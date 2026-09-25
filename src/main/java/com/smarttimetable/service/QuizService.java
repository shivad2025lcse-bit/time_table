package com.smarttimetable.service;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuizService {
    @Autowired
    private QuizRepository quizRepository;
    @Autowired
    private QuizQuestionRepository questionRepository;
    @Autowired
    private QuizSubmissionRepository submissionRepository;
    @Autowired
    private StudentAnswerRepository answerRepository;
    @Autowired
    private AiEvaluationService aiEvaluationService;
    @Autowired
    private SectionRepository sectionRepository;
    @Autowired
    private TeacherRepository teacherRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private TopicPerformanceRepository topicPerformanceRepository;

    @Transactional
    public Quiz createQuiz(Long sectionId, Long teacherId, com.smarttimetable.dto.QuizCreateRequest request) {
        Section section = sectionRepository.findById(sectionId).orElseThrow(() -> new RuntimeException("Section not found"));
        Teacher teacher = teacherRepository.findById(teacherId).orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        Quiz quiz = new Quiz();
        quiz.setTitle(request.title);
        quiz.setSubjectName(request.subjectName);
        quiz.setTopic(request.topic);
        quiz.setDifficulty(request.difficulty);
        if (request.durationMinutes != null) quiz.setDurationMinutes(request.durationMinutes);
        if (request.passingPercentage != null) quiz.setPassingPercentage(request.passingPercentage);
        quiz.setSection(section);
        quiz.setTeacher(teacher);
        quiz = quizRepository.save(quiz);
        
        for (com.smarttimetable.dto.QuizCreateRequest.QuestionDto dto : request.questions) {
            QuizQuestion q = new QuizQuestion();
            q.setQuestionText(dto.questionText);
            q.setType(dto.type);
            q.setOptions(dto.options);
            q.setCorrectAnswer(dto.correctAnswer);
            q.setMarks(dto.marks != null ? dto.marks : 10);
            q.setTopicConcept(dto.topicConcept);
            q.setExplanation(dto.explanation);
            q.setDifficulty(dto.difficulty);
            q.setQuiz(quiz);
            questionRepository.save(q);
        }
        return quiz;
    }

    public List<Quiz> getQuizzesBySection(Long sectionId) {
        return quizRepository.findBySectionId(sectionId);
    }
    
    public List<Quiz> getQuizzesByTeacher(Long teacherId) {
        return quizRepository.findByTeacherId(teacherId);
    }

    @Transactional
    public QuizSubmission submitQuiz(Long quizId, Long studentId, List<StudentAnswer> answers) {
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));
        Student student = studentRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
        
        QuizSubmission submission = new QuizSubmission();
        submission.setQuiz(quiz);
        submission.setStudent(student);
        submission = submissionRepository.save(submission);
        
        int totalMaxMarks = 0;
        int totalAwardedMarks = 0;
        
        for (StudentAnswer answer : answers) {
            QuizQuestion question = questionRepository.findById(answer.getQuestion().getId()).orElseThrow(() -> new RuntimeException("Question not found"));
            answer.setSubmission(submission);
            answer.setQuestion(question);
            
            totalMaxMarks += question.getMarks();
            
            // Auto-grade MCQ
            if ("MCQ".equalsIgnoreCase(question.getType())) {
                if (question.getCorrectAnswer() != null && question.getCorrectAnswer().equalsIgnoreCase(answer.getAnswerText())) {
                    answer.setMarksAwarded(question.getMarks());
                    answer.setIsCorrect(true);
                } else {
                    answer.setMarksAwarded(0);
                    answer.setIsCorrect(false);
                }
            } else {
                // Descriptive: basic text match or 0
                answer.setMarksAwarded(0); 
                answer.setIsCorrect(false);
            }
            
            totalAwardedMarks += answer.getMarksAwarded();
            answerRepository.save(answer);
        }
        
        submission.setTotalScore(totalAwardedMarks);
        double percentage = totalMaxMarks > 0 ? ((double) totalAwardedMarks / totalMaxMarks) * 100 : 0;
        submission.setPercentage(percentage);

        // Update Topic Performance
        java.util.Map<String, int[]> topicStats = new java.util.HashMap<>();
        for (StudentAnswer answer : answers) {
            String topic = answer.getQuestion().getTopicConcept();
            if (topic == null || topic.isEmpty()) topic = "General";
            topicStats.putIfAbsent(topic, new int[]{0, 0}); // [correct, total]
            topicStats.get(topic)[1]++;
            if (Boolean.TRUE.equals(answer.getIsCorrect())) {
                topicStats.get(topic)[0]++;
            }
        }

        List<TopicPerformance> existingPerformances = topicPerformanceRepository.findByStudentId(studentId);
        for (java.util.Map.Entry<String, int[]> entry : topicStats.entrySet()) {
            String topic = entry.getKey();
            int correct = entry.getValue()[0];
            int total = entry.getValue()[1];
            double currentScore = ((double) correct / total) * 100;

            TopicPerformance tp = existingPerformances.stream()
                .filter(p -> p.getTopicName().equalsIgnoreCase(topic))
                .findFirst()
                .orElse(new TopicPerformance());
            
            if (tp.getId() == null) {
                tp.setStudent(student);
                tp.setTopicName(topic);
                tp.setSubjectName(quiz.getSubjectName() != null ? quiz.getSubjectName() : "General");
                tp.setPercentage(currentScore);
            } else {
                // Moving average or simple average with new attempt
                tp.setPercentage((tp.getPercentage() + currentScore) / 2);
            }

            if (tp.getPercentage() >= 90) tp.setCompetencyLevel("Excellent");
            else if (tp.getPercentage() >= 75) tp.setCompetencyLevel("Good");
            else if (tp.getPercentage() >= 50) tp.setCompetencyLevel("Developing");
            else tp.setCompetencyLevel("Needs Improvement");

            topicPerformanceRepository.save(tp);
        }
        
        if (percentage < 50.0) {
            List<StudentAnswer> incorrect = answerRepository.findBySubmissionId(submission.getId())
                .stream().filter(a -> a.getIsCorrect() == null || !a.getIsCorrect())
                .collect(Collectors.toList());
            String analysis = aiEvaluationService.analyzeWeakness(incorrect);
            submission.setAiWeaknessAnalysis(analysis);
        }
        
        return submissionRepository.save(submission);
    }

    public List<QuizSubmission> getResultsForQuiz(Long quizId) {
        return submissionRepository.findByQuizId(quizId);
    }

    public List<QuizSubmission> getWeakStudentsForQuiz(Long quizId) {
        return submissionRepository.findByQuizId(quizId)
            .stream().filter(s -> s.getPercentage() != null && s.getPercentage() < 50.0)
            .collect(Collectors.toList());
    }



    @Transactional
    public void deleteQuizSubmission(Long submissionId) {
        QuizSubmission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new RuntimeException("Submission not found with id: " + submissionId));
        submissionRepository.delete(submission); // Cascades to answers
    }

    public java.util.Optional<QuizSubmission> getSubmissionForStudent(Long quizId, Long studentId) {
        return submissionRepository.findByQuizIdAndStudentId(quizId, studentId);
    }

    public List<QuizSubmission> getStudentQuizHistory(Long studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Transactional
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));
        
        List<QuizSubmission> submissions = submissionRepository.findByQuizId(quizId);
        for (QuizSubmission sub : submissions) {
            // Explicitly delete answers for each submission
            answerRepository.deleteAll(sub.getAnswers());
        }
        answerRepository.flush(); // Force execution of DELETE FROM student_answers

        // Explicitly delete submissions
        submissionRepository.deleteAll(submissions);
        submissionRepository.flush(); // Force execution of DELETE FROM quiz_submissions

        // Now safe to delete quiz and its questions
        quizRepository.delete(quiz);
    }
}
