package com.smarttimetable.controller;

import com.smarttimetable.entity.*;
import com.smarttimetable.service.TimetableOperationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/operations")
@CrossOrigin(origins = "*")
public class TimetableOperationsController {

        @Autowired
        private TimetableOperationsService service;

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
        public List<Substitution> getSubstitutions() {
                return service.getAllSubstitutions();
        }

        @PostMapping("/substitutions")
        public Substitution saveSubstitution(@RequestBody Substitution sub) {
                return service.saveSubstitution(sub);
        }

        @DeleteMapping("/substitutions/{id}")
        public void deleteSubstitution(@PathVariable Long id) {
                service.deleteSubstitution(id);
        }

        // Coverage
        @GetMapping("/coverage")
        public List<CoverageRequest> getCoverageRequests() {
                return service.getAllCoverageRequests();
        }

        @PostMapping("/coverage")
        public CoverageRequest saveCoverageRequest(@RequestBody CoverageRequest req) {
                return service.saveCoverageRequest(req);
        }

        @DeleteMapping("/coverage/{id}")
        public void deleteCoverageRequest(@PathVariable Long id) {
                service.deleteCoverageRequest(id);
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
        public PeriodNotification savePeriodNotification(@RequestBody PeriodNotification notif) {
                return service.savePeriodNotification(notif);
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
}
