package com.smarttimetable.controller;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import com.smarttimetable.service.TemporaryTimetableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/temp-timetable")
@CrossOrigin(origins = "*")
public class TemporaryTimetableController {

    @Autowired private TemporaryTimetableService tempService;
    @Autowired private UserRepository userRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private TeacherRepository teacherRepository;

    @GetMapping("/effective")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY', 'ROLE_STUDENT')")
    public ResponseEntity<?> getEffectiveTimetable(
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer semester,
            Authentication authentication
    ) {
        try {
            User actor = requireUser(authentication);
            if (actor.getRole() == Role.ROLE_STUDENT) {
                Student st = studentRepository.findByUserId(actor.getId())
                        .orElseThrow(() -> new IllegalStateException("Student profile not found."));
                Long studentSecId = st.getSection() != null ? st.getSection().getId() : null;
                if (studentSecId == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Student has no assigned section."));
                }
                Integer stSem = st.getSemester() != null ? st.getSemester() : st.getSection().getSemester();
                return ResponseEntity.ok(tempService.getEffectiveSectionTimetable(studentSecId, date, stSem));
            }
            if (sectionId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "sectionId is required."));
            }
            return ResponseEntity.ok(tempService.getEffectiveSectionTimetable(sectionId, date, semester));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/faculty/effective")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<?> getFacultyEffectiveTimetable(
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication
    ) {
        try {
            User actor = requireUser(authentication);
            Teacher target = null;
            if (actor.getRole() == Role.ROLE_FACULTY) {
                target = teacherRepository.findByUserId(actor.getId()).orElse(null);
            } else if (teacherId != null) {
                target = teacherRepository.findById(teacherId).orElse(null);
            }
            if (target == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Faculty profile not found."));
            }
            return ResponseEntity.ok(tempService.getEffectiveFacultyTimetable(target, date));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/admin/overview")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> getAdminOverview(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) TemporaryChangeType changeType,
            @RequestParam(required = false) TemporaryChangeStatus status
    ) {
        return ResponseEntity.ok(tempService.getAdminDashboardOverview(
                departmentId, academicYear, sectionId, date, faculty, changeType, status
        ));
    }

    @GetMapping("/admin/preview-slot")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<?> previewSlot(
            @RequestParam Long sectionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Integer periodNumber
    ) {
        try {
            return ResponseEntity.ok(tempService.previewAffectedSlot(sectionId, date, periodNumber));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createAdminTempChange(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            User actor = requireUser(authentication);
            List<Map<String, Object>> created = tempService.createChanges(request, actor, false);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "createdCount", created.size(),
                    "changes", created
            ));
        } catch (TemporaryTimetableService.ConflictException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/faculty-request")
    @PreAuthorize("hasAnyAuthority('ROLE_FACULTY', 'ROLE_ADMIN')")
    public ResponseEntity<?> submitFacultyRequest(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            User actor = requireUser(authentication);
            List<Map<String, Object>> created = tempService.createChanges(request, actor, true);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "createdCount", created.size(),
                    "changes", created,
                    "message", "Substitution/change request submitted for Admin approval."
            ));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateTempChange(@PathVariable Long id, @RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            User actor = requireUser(authentication);
            return ResponseEntity.ok(tempService.updateChange(id, request, actor));
        } catch (TemporaryTimetableService.ConflictException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> publishTempChange(@PathVariable Long id, Authentication authentication) {
        try {
            User actor = requireUser(authentication);
            return ResponseEntity.ok(tempService.publishChange(id, actor));
        } catch (TemporaryTimetableService.ConflictException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> cancelTempChange(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            User actor = requireUser(authentication);
            String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : "";
            return ResponseEntity.ok(tempService.cancelChange(id, actor, reason));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> rejectFacultyRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            User actor = requireUser(authentication);
            String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : "";
            return ResponseEntity.ok(tempService.rejectFacultyRequest(id, actor, reason));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteTempChange(@PathVariable Long id, Authentication authentication) {
        try {
            User actor = requireUser(authentication);
            tempService.deleteChange(id, actor);
            return ResponseEntity.ok(Map.of("deletedId", id));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    private User requireUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("Authentication required.");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found."));
    }
}
