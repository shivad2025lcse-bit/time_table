package com.smarttimetable.controller;

import com.smarttimetable.entity.FacultyLeave;
import com.smarttimetable.entity.Role;
import com.smarttimetable.entity.Teacher;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.FacultyLeaveRepository;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.UserRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty-leaves")
@CrossOrigin(origins = "*")
public class FacultyLeaveController {

    private final FacultyLeaveRepository leaveRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;

    public FacultyLeaveController(
            FacultyLeaveRepository leaveRepository,
            TeacherRepository teacherRepository,
            UserRepository userRepository) {
        this.leaveRepository = leaveRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY', 'ROLE_STUDENT')")
    public List<Map<String, Object>> getLeaves(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return leaveRepository.findByDate(date).stream().map(this::toResponse).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<?> markLeave(@RequestBody Map<String, Object> payload, Authentication authentication) {
        LocalDate date;
        Long teacherId;
        try {
            date = LocalDate.parse(String.valueOf(payload.get("date")));
            teacherId = Long.valueOf(String.valueOf(payload.get("teacherId")));
        } catch (DateTimeParseException | NumberFormatException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "A valid leave date and teacherId are required."));
        }
        Teacher teacher = teacherRepository.findById(teacherId).orElse(null);
        if (teacher == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Faculty profile not found."));
        }

        User actor = userRepository.findByUsernameIgnoreCase(authentication.getName()).orElse(null);
        if (actor == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Authenticated user not found."));
        }
        if (actor.getRole() == Role.ROLE_FACULTY
                && (teacher.getUser() == null || !teacher.getUser().getId().equals(actor.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Faculty can only submit leave for their own account."));
        }

        FacultyLeave leave = leaveRepository.findByDateAndTeacherId(date, teacherId)
                .orElseGet(FacultyLeave::new);
        leave.setTeacher(teacher);
        leave.setDate(date);
        leave.setReason(payload.get("reason") != null ? payload.get("reason").toString().trim() : "");
        leave.setCreatedBy(actor.getUsername());
        if (leave.getCreatedAt() == null) {
            leave.setCreatedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(toResponse(leaveRepository.save(leave)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<?> cancelLeave(@PathVariable Long id, Authentication authentication) {
        FacultyLeave leave = leaveRepository.findById(id).orElse(null);
        if (leave == null) {
            return ResponseEntity.notFound().build();
        }
        User actor = userRepository.findByUsernameIgnoreCase(authentication.getName()).orElse(null);
        if (actor == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Authenticated user not found."));
        }
        if (actor.getRole() == Role.ROLE_FACULTY
                && (leave.getTeacher().getUser() == null || !leave.getTeacher().getUser().getId().equals(actor.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Faculty can only cancel their own leave."));
        }
        leaveRepository.delete(leave);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> toResponse(FacultyLeave leave) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", leave.getId());
        response.put("teacherId", leave.getTeacher().getId());
        response.put("staffName", leave.getTeacher().getDisplayName() != null
                ? leave.getTeacher().getDisplayName()
                : leave.getTeacher().getName());
        response.put("date", leave.getDate());
        response.put("reason", leave.getReason() != null ? leave.getReason() : "");
        response.put("createdBy", leave.getCreatedBy() != null ? leave.getCreatedBy() : "");
        response.put("createdAt", leave.getCreatedAt());
        return response;
    }
}
