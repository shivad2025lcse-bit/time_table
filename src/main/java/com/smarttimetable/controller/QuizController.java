package com.smarttimetable.controller;

import com.smarttimetable.dto.QuizCreateRequest;
import com.smarttimetable.dto.QuizSubmitRequest;
import com.smarttimetable.entity.*;
import com.smarttimetable.repository.QuizQuestionRepository;
import com.smarttimetable.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smarttimetable.service.AiQuizGeneratorService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizQuestionRepository questionRepository;

    @Autowired
    private AiQuizGeneratorService aiQuizGeneratorService;

    @PostMapping
    public ResponseEntity<?> createQuiz(@RequestBody QuizCreateRequest request) {
        try {
            Quiz quiz = quizService.createQuiz(request.sectionId, request.teacherId, request);
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateQuestions(@RequestBody Map<String, Object> request) {
        try {
            String topic = (String) request.get("topic");
            String notes = (String) request.get("notes");
            String difficulty = (String) request.getOrDefault("difficulty", "Medium");
            int count = Integer.parseInt(request.getOrDefault("count", "5").toString());

            List<QuizQuestion> questions = aiQuizGeneratorService.generateQuestions(topic, notes, difficulty, count);
            return ResponseEntity.ok(questions);
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

    @DeleteMapping("/{quizId}")
    public ResponseEntity<?> deleteQuiz(@PathVariable Long quizId) {
        try {
            quizService.deleteQuiz(quizId);
            return ResponseEntity.ok("Quiz deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
