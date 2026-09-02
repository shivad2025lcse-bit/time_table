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
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));
        quizRepository.delete(quiz); // cascades to questions, submissions, answers
    }
}
