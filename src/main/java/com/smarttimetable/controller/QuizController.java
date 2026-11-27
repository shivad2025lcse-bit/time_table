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
import com.smarttimetable.service.QuizVisibilityService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizQuestionRepository questionRepository;

    @Autowired
    private AiQuizGeneratorService aiQuizGeneratorService;

    @Autowired
    private QuizVisibilityService quizVisibilityService;

    @Autowired
    private com.smarttimetable.repository.QuizRepository quizRepository;

    @Autowired
    private com.smarttimetable.repository.StudentRepository studentRepository;

    private boolean isStudentOnly(Authentication authentication) {
        if (authentication == null) return false;
        boolean hasStudent = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STUDENT".equals(a.getAuthority()));
        boolean hasPrivileged = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ROLE_FACULTY".equals(a.getAuthority()));
        return hasStudent && !hasPrivileged;
    }

    @GetMapping("/visibility")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<Map<String, Object>> getQuizVisibility() {
        return ResponseEntity.ok(quizVisibilityService.getVisibilitySnapshot());
    }

    @GetMapping("/visibility/student")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getStudentQuizVisibility(
            Authentication authentication,
            @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(quizVisibilityService.getStudentQuizVisibility(authentication, sectionId));
    }

    @PutMapping("/visibility/section/{sectionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_FACULTY', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateSectionQuizVisibility(
            @PathVariable Long sectionId,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        boolean enabled = body != null && Boolean.parseBoolean(String.valueOf(body.get("enabled")));
        String actor = authentication != null ? authentication.getName() : "system";
        try {
            return ResponseEntity.ok(quizVisibilityService.setSectionQuizEnabled(sectionId, enabled, actor));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/visibility/global")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> updateGlobalQuizVisibility(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        boolean enabled = body != null && Boolean.parseBoolean(String.valueOf(body.get("enabled")));
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(quizVisibilityService.setGlobalQuizEnabled(enabled, actor));
    }

    @PutMapping("/visibility/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> updateAllClassesQuizVisibility(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        boolean enabled = body != null && Boolean.parseBoolean(String.valueOf(body.get("enabled")));
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(quizVisibilityService.setAllSectionsQuizEnabled(enabled, actor));
    }

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
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<?> generateQuestions(@RequestBody Map<String, Object> request) {
        try {
            String topic = request.get("topic") != null ? request.get("topic").toString().trim() : "";
            String notes = request.get("notes") != null ? request.get("notes").toString() : "";
            String difficulty = String.valueOf(request.getOrDefault("difficulty", "Medium"));
            String type = String.valueOf(request.getOrDefault("type", "MCQ"));
            int count = Integer.parseInt(request.getOrDefault("count", "5").toString());
            String provider = request.get("provider") != null ? request.get("provider").toString() : "AUTO";
            String apiKey = request.get("apiKey") != null ? request.get("apiKey").toString() : "";
            String model = request.get("model") != null ? request.get("model").toString() : "";
            @SuppressWarnings("unchecked")
            List<String> excludeQuestions = request.get("excludeQuestions") instanceof List
                    ? (List<String>) request.get("excludeQuestions")
                    : java.util.Collections.emptyList();

            AiQuizGeneratorService.GenerationResult result = aiQuizGeneratorService.generateQuestionsWithMeta(
                    topic, notes, difficulty, type, count, provider, apiKey, model, excludeQuestions);
            return ResponseEntity.ok(Map.of(
                    "questions", result.questions(),
                    "providerUsed", result.providerUsed(),
                    "modelUsed", result.modelUsed(),
                    "difficultyApplied", result.difficultyApplied(),
                    "usedExternalAi", result.usedExternalAi(),
                    "warning", result.warning() != null ? result.warning() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "AI generation failed"));
        }
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<?> getQuizzesBySection(@PathVariable Long sectionId, Authentication authentication) {
        if (isStudentOnly(authentication) && !quizVisibilityService.isQuizVisibleForSection(sectionId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Quiz access is currently disabled for your class."));
        }
        return ResponseEntity.ok(quizService.getQuizzesBySection(sectionId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Quiz>> getQuizzesByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(quizService.getQuizzesByTeacher(teacherId));
    }

    @PostMapping("/{quizId}/submit")
    public ResponseEntity<?> submitQuiz(@PathVariable Long quizId, @RequestBody QuizSubmitRequest request, Authentication authentication) {
        try {
            if (isStudentOnly(authentication)) {
                Quiz quiz = quizRepository.findById(quizId).orElse(null);
                Long secId = (quiz != null && quiz.getSection() != null) ? quiz.getSection().getId() : null;
                if (!quizVisibilityService.isQuizVisibleForSection(secId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Quiz access is currently disabled for your class.");
                }
            }
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

    @DeleteMapping("/submission/{submissionId}")
    public ResponseEntity<?> deleteQuizSubmission(@PathVariable Long submissionId) {
        try {
            quizService.deleteQuizSubmission(submissionId);
            return ResponseEntity.ok(Map.of("message", "History deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Faculty: get all submissions for a quiz (full student details for analytics)
    @GetMapping("/{quizId}/submissions")
    public ResponseEntity<List<QuizSubmission>> getSubmissions(@PathVariable Long quizId) {
        return ResponseEntity.ok(quizService.getResultsForQuiz(quizId));
    }

    // Student: check if they already submitted a specific quiz
    @GetMapping("/{quizId}/submission/{studentId}")
    public ResponseEntity<?> getMySubmission(@PathVariable Long quizId, @PathVariable Long studentId) {
        return quizService.getSubmissionForStudent(quizId, studentId)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElse(ResponseEntity.noContent().build());
    }

    // Student: view entire quiz history with answers
    @GetMapping("/student/{studentId}/history")
    public ResponseEntity<?> getStudentQuizHistory(@PathVariable Long studentId, Authentication authentication) {
        if (isStudentOnly(authentication)) {
            Student stu = studentRepository.findById(studentId).orElse(null);
            Long secId = (stu != null && stu.getSection() != null) ? stu.getSection().getId() : null;
            if (!quizVisibilityService.isQuizVisibleForSection(secId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Quiz access is currently disabled for your class."));
            }
        }
        return ResponseEntity.ok(quizService.getStudentQuizHistory(studentId));
    }


}
