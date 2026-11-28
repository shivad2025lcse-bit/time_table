package com.smarttimetable.controller;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.CoverageRequestRepository;
import com.smarttimetable.repository.SubstitutionRepository;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.UserRepository;
import com.smarttimetable.service.EmailNotificationService;
import com.smarttimetable.service.TimetableOperationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/operations")
@CrossOrigin(origins = "*")
public class TimetableOperationsController {

        @Autowired
        private TimetableOperationsService service;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private TeacherRepository teacherRepository;

        @Autowired
        private SubstitutionRepository substitutionRepository;

        @Autowired
        private CoverageRequestRepository coverageRequestRepository;

        @Autowired
        private EmailNotificationService emailNotificationService;

        @Autowired
        private com.smarttimetable.service.QuizVisibilityService quizVisibilityService;

        private Teacher resolveFacultyActor(Authentication authentication) {
                if (authentication == null)
                        return null;
                User u = userRepository.findByUsernameIgnoreCase(authentication.getName()).orElse(null);
                if (u == null || u.getRole() != Role.ROLE_FACULTY)
                        return null;
                return teacherRepository.findByUserId(u.getId()).orElse(null);
        }

        private boolean isFacultyRoleOnly(Authentication authentication) {
                if (authentication == null)
                        return false;
                boolean hasFac = authentication.getAuthorities().stream()
                                .anyMatch(a -> "ROLE_FACULTY".equals(a.getAuthority()));
                boolean hasAdm = authentication.getAuthorities().stream()
                                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
                return hasFac && !hasAdm;
        }

        private boolean matchesTeacher(Teacher self, String candidateName) {
                if (self == null || candidateName == null || candidateName.isBlank())
                        return false;
                String normCand = candidateName.trim().toLowerCase().replaceAll("\\s+", " ");
                String full = (((self.getFirstName() != null ? self.getFirstName() : "") + " " +
                                (self.getLastName() != null ? self.getLastName() : "")).trim()).toLowerCase()
                                .replaceAll("\\s+", " ");
                String disp = (self.getDisplayName() != null
                                ? self.getDisplayName().trim().toLowerCase().replaceAll("\\s+", " ")
                                : "");
                if (!full.isEmpty() && (normCand.equals(full) || normCand.contains(full) || full.contains(normCand)))
                        return true;
                if (!disp.isEmpty() && (normCand.equals(disp) || normCand.contains(disp) || disp.contains(normCand)))
                        return true;
                return self.getEmployeeId() != null && normCand.equalsIgnoreCase(self.getEmployeeId().trim());
        }

        // Overrides
        @GetMapping("/overrides")
        public List<TimetableOverride> getOverrides() {
                return service.getAllOverrides();
        }

        @PostMapping("/overrides")
        public TimetableOverride saveOverride(@RequestBody TimetableOverride override) {
                return service.saveOverride(override);
        }

        @DeleteMapping("/overrides/{id}")
        public void deleteOverride(@PathVariable Long id) {
                service.deleteOverride(id);
        }

        @DeleteMapping("/overrides/all")
        public void deleteAllOverrides() {
                service.deleteAllOverrides();
        }

        // Substitutions
        @GetMapping("/substitutions")
        @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY', 'ROLE_STUDENT')")
        public List<Substitution> getSubstitutions() {
                return service.getAllSubstitutions();
        }

        @PostMapping("/substitutions")
        @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
        public ResponseEntity<?> saveSubstitution(@RequestBody Substitution sub, Authentication authentication) {
                if (isFacultyRoleOnly(authentication)) {
                        Teacher self = resolveFacultyActor(authentication);
                        if (self == null || !matchesTeacher(self, sub.getOriginalFaculty())) {
                                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                                .body(Map.of("error",
                                                                "Faculty can only arrange substitution for their own periods."));
                        }
                }
                return ResponseEntity.ok(service.saveSubstitution(sub));
        }

        @DeleteMapping("/substitutions/{id}")
        @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
        public ResponseEntity<?> deleteSubstitution(@PathVariable Long id, Authentication authentication) {
                Substitution sub = substitutionRepository.findById(id).orElse(null);
                if (sub == null) {
                        return ResponseEntity.notFound().build();
                }
                if (isFacultyRoleOnly(authentication)
                                && !matchesTeacher(resolveFacultyActor(authentication), sub.getOriginalFaculty())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                        .body(Map.of("error", "Faculty can only cancel their own substitutions."));
                }
                service.deleteSubstitution(id);
                return ResponseEntity.noContent().build();
        }

        // Coverage
        @GetMapping("/coverage")
        @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
        public List<CoverageRequest> getCoverageRequests() {
                return service.getAllCoverageRequests();
        }

        @PostMapping("/coverage")
        @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
        public ResponseEntity<?> saveCoverageRequest(@RequestBody CoverageRequest req, Authentication authentication) {
                if (req.getDate() == null || req.getSectionName() == null || req.getSectionName().isBlank()
                                || req.getDay() == null || req.getDay().isBlank() || req.getPeriodIndex() == null
                                || req.getPeriodIndex() < 0 || req.getPeriodIndex() > 6) {
                        return ResponseEntity.badRequest().body(Map.of("error", "A date, section, day, and valid period are required."));
                }
                if (isFacultyRoleOnly(authentication)) {
                        Teacher self = resolveFacultyActor(authentication);
                        String status = req.getStatus() != null ? req.getStatus().trim().toUpperCase() : "OPEN";
                        String actorName = "REQUESTED".equals(status) ? req.getRequestedBy() : req.getAbsentStaff();
                        if (!matchesTeacher(self, actorName)) {
                                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                                .body(Map.of("error", "Faculty can only update coverage requests involving their own periods."));
                        }
                }
                if (req.getStatus() == null || req.getStatus().isBlank()) {
                        req.setStatus("OPEN");
                }
                return ResponseEntity.ok(service.saveCoverageRequest(req));
        }

        @DeleteMapping("/coverage/{id}")
        @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
        public ResponseEntity<?> deleteCoverageRequest(@PathVariable Long id, Authentication authentication) {
                CoverageRequest request = coverageRequestRepository.findById(id).orElse(null);
                if (request == null) {
                        return ResponseEntity.notFound().build();
                }
                if (isFacultyRoleOnly(authentication)
                                && (!matchesTeacher(resolveFacultyActor(authentication), request.getAbsentStaff())
                                                || !"OPEN".equalsIgnoreCase(request.getStatus()))) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                        .body(Map.of("error", "Faculty can only cancel their own open leave requests."));
                }
                service.deleteCoverageRequest(id);
                return ResponseEntity.noContent().build();
        }

        // Custom Subjects
        @GetMapping("/custom-subjects")
        public List<CustomSubject> getCustomSubjects() {
                return service.getAllCustomSubjects();
        }

        @PostMapping("/custom-subjects")
        public CustomSubject saveCustomSubject(@RequestBody CustomSubject sub) {
                return service.saveCustomSubject(sub);
        }

        @DeleteMapping("/custom-subjects/{id}")
        public void deleteCustomSubject(@PathVariable Long id) {
                service.deleteCustomSubject(id);
        }

        // Custom Venues
        @GetMapping("/custom-venues")
        public List<CustomVenue> getCustomVenues() {
                return service.getAllCustomVenues();
        }

        @PostMapping("/custom-venues")
        public CustomVenue saveCustomVenue(@RequestBody CustomVenue venue) {
                return service.saveCustomVenue(venue);
        }

        @DeleteMapping("/custom-venues/{id}")
        public void deleteCustomVenue(@PathVariable Long id) {
                service.deleteCustomVenue(id);
        }

        // Period Notifications
        @GetMapping("/period-notifications")
        public List<PeriodNotification> getPeriodNotifications() {
                return service.getAllPeriodNotifications();
        }

        @PostMapping("/period-notifications")
        public ResponseEntity<?> savePeriodNotification(@RequestBody PeriodNotification notif,
                        Authentication authentication) {
                if (isFacultyRoleOnly(authentication)) {
                        String src = notif.getSource() != null ? notif.getSource().trim().toLowerCase() : "";
                        if ("leave".equals(src) || "substitution".equals(src)) {
                                Teacher self = resolveFacultyActor(authentication);
                                if (self == null || !matchesTeacher(self, notif.getOriginalFaculty())) {
                                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                                        .body(Map.of("error",
                                                                        "Faculty can only notify leave or substitution for their own periods."));
                                }
                        }
                }
                return ResponseEntity.ok(service.savePeriodNotification(notif));
        }

        @DeleteMapping("/period-notifications/{id}")
        public void deletePeriodNotification(@PathVariable Long id) {
                service.deletePeriodNotification(id);
        }

        // Faculty Personal Timetables (viewable/editable by Admin and the owning
        // Faculty)
        @GetMapping("/faculty-timetables/{username}")
        public ResponseEntity<java.util.Map<String, Object>> getFacultyTimetable(@PathVariable String username) {
                return service.getFacultyTimetable(username).<ResponseEntity<java.util.Map<String, Object>>>map(
                                ft -> ResponseEntity.ok(java.util.Map.of(
                                                "username", ft.getUsername(),
                                                "dataJson", ft.getDataJson(),
                                                "updatedBy", ft.getUpdatedBy() != null ? ft.getUpdatedBy() : "",
                                                "updatedAt",
                                                ft.getUpdatedAt() != null ? ft.getUpdatedAt().toString() : "")))
                                .orElseGet(() -> ResponseEntity.ok(java.util.Map.of(
                                                "username", username.toLowerCase(),
                                                "dataJson", "{}")));
        }

        @PostMapping("/faculty-timetables/{username}")
        @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
        public ResponseEntity<?> saveFacultyTimetable(
                        @PathVariable String username,
                        @RequestBody java.util.Map<String, String> payload,
                        org.springframework.security.core.Authentication authentication) {
                boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                String actor = authentication != null ? authentication.getName() : "";
                if (!isAdmin && !actor.equalsIgnoreCase(username)) {
                        return ResponseEntity.status(403)
                                        .body(java.util.Map.of("error", "Faculty can only edit their own timetable."));
                }
                String dataJson = payload.getOrDefault("dataJson", "{}");
                FacultyTimetable saved = service.saveFacultyTimetable(username, dataJson, actor);
                return ResponseEntity.ok(java.util.Map.of(
                                "username", saved.getUsername(),
                                "dataJson", saved.getDataJson(),
                                "updatedBy", saved.getUpdatedBy() != null ? saved.getUpdatedBy() : "",
                                "updatedAt", saved.getUpdatedAt() != null ? saved.getUpdatedAt().toString() : ""));
        }

        @GetMapping("/tt-suggestions")
        public ResponseEntity<java.util.Map<String, Object>> getLiveSuggestions() {
                return ResponseEntity.ok(service.getLiveSuggestions());
        }

        @PostMapping("/notify-class-leave-or-sub")
        @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
        public ResponseEntity<?> notifyClassLeaveOrSub(
                        @RequestBody Map<String, Object> payload,
                        Authentication authentication) {
                String eventType = payload.get("eventType") != null ? payload.get("eventType").toString().trim()
                                : "ABSENT";
                String sectionName = payload.get("sectionName") != null ? payload.get("sectionName").toString().trim()
                                : "";
                String dateStr = payload.get("date") != null ? payload.get("date").toString().trim() : "";
                String dayName = payload.get("day") != null ? payload.get("day").toString().trim() : "";
                Integer periodNumber = payload.get("periodNumber") != null
                                ? Integer.valueOf(payload.get("periodNumber").toString())
                                : null;
                String subject = payload.get("subject") != null ? payload.get("subject").toString().trim() : "";
                String venue = payload.get("venue") != null ? payload.get("venue").toString().trim() : "";
                String originalFaculty = payload.get("originalFaculty") != null
                                ? payload.get("originalFaculty").toString().trim()
                                : "";
                String substituteFaculty = payload.get("substituteFaculty") != null
                                ? payload.get("substituteFaculty").toString().trim()
                                : "";
                String reason = payload.get("reason") != null ? payload.get("reason").toString().trim() : "";

                if (isFacultyRoleOnly(authentication)) {
                        Teacher self = resolveFacultyActor(authentication);
                        if (self == null || !matchesTeacher(self, originalFaculty)) {
                                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                                .body(Map.of("error",
                                                                "Faculty can only notify leave or substitution for their own periods."));
                        }
                }
                if (sectionName.isEmpty()) {
                        return ResponseEntity.badRequest().body(Map.of("error",
                                        "sectionName is required so only that class's students are notified."));
                }

                Map<String, Object> result = emailNotificationService.dispatchClassLeaveOrSubstitutionEmails(
                                eventType, sectionName, dateStr, dayName, periodNumber, subject, venue, originalFaculty,
                                substituteFaculty, reason);
                return ResponseEntity.ok(result);
        }

        @GetMapping("/download-tt-setting")
        @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
        public ResponseEntity<Map<String, Object>> getDownloadTtSetting() {
                return ResponseEntity.ok(Map.of("downloadTtEnabled", quizVisibilityService.isDownloadTtEnabled()));
        }

        @PutMapping("/download-tt-setting")
        @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
        public ResponseEntity<Map<String, Object>> updateDownloadTtSetting(
                        @RequestBody Map<String, Object> body,
                        Authentication authentication) {
                boolean enabled = body != null && Boolean.parseBoolean(String.valueOf(body.get("enabled")));
                String actor = authentication != null ? authentication.getName() : "admin";
                return ResponseEntity.ok(quizVisibilityService.setDownloadTtEnabled(enabled, actor));
        }
}
