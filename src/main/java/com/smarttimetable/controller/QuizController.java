package com.smarttimetable.controller;

import com.smarttimetable.dto.QuizCreateRequest;
import com.smarttimetable.dto.QuizSubmitRequest;
import com.smarttimetable.entity.*;
import com.smarttimetable.repository.QuizQuestionRepository;
import com.smarttimetable.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizQuestionRepository questionRepository;

    @PostMapping
    public ResponseEntity<?> createQuiz(@RequestBody QuizCreateRequest request) {
        try {
            List<QuizQuestion> questions = new ArrayList<>();
            for (QuizCreateRequest.QuestionDto dto : request.questions) {
                QuizQuestion q = new QuizQuestion();
                q.setQuestionText(dto.questionText);
                q.setType(dto.type);
                q.setOptions(dto.options);
                q.setCorrectAnswer(dto.correctAnswer);
                q.setMarks(dto.marks != null ? dto.marks : 10);
                questions.add(q);
            }
            Quiz quiz = quizService.createQuiz(request.sectionId, request.teacherId, request.title, questions);
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<List<Quiz>> getQuizzesBySection(@PathVariable Long sectionId) {
        return ResponseEntity.ok(quizService.getQuizzesBySection(sectionId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Quiz>> getQuizzesByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(quizService.getQuizzesByTeacher(teacherId));
    }

    @PostMapping("/{quizId}/submit")
    public ResponseEntity<?> submitQuiz(@PathVariable Long quizId, @RequestBody QuizSubmitRequest request) {
        try {
            List<StudentAnswer> answers = new ArrayList<>();
            for (QuizSubmitRequest.AnswerDto dto : request.answers) {
                StudentAnswer sa = new StudentAnswer();
                QuizQuestion qq = new QuizQuestion();
                qq.setId(dto.questionId);
                sa.setQuestion(qq);
                sa.setAnswerText(dto.answerText);
                answers.add(sa);
            }
            QuizSubmission submission = quizService.submitQuiz(quizId, request.studentId, answers);
            return ResponseEntity.ok(submission);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{quizId}/results")
    public ResponseEntity<List<QuizSubmission>> getResults(@PathVariable Long quizId) {
        return ResponseEntity.ok(quizService.getResultsForQuiz(quizId));
    }

    @GetMapping("/{quizId}/results/weak")
    public ResponseEntity<List<QuizSubmission>> getWeakStudents(@PathVariable Long quizId) {
        return ResponseEntity.ok(quizService.getWeakStudentsForQuiz(quizId));
    }
}
