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
    public List<TimetableOverride> getOverrides() { return service.getAllOverrides(); }
    
    @PostMapping("/overrides")
    public TimetableOverride saveOverride(@RequestBody TimetableOverride override) { return service.saveOverride(override); }
    
    @DeleteMapping("/overrides/{id}")
    public void deleteOverride(@PathVariable Long id) { service.deleteOverride(id); }

    @DeleteMapping("/overrides/all")
    public void deleteAllOverrides() { service.deleteAllOverrides(); }

    // Substitutions
    @GetMapping("/substitutions")
    public List<Substitution> getSubstitutions() { return service.getAllSubstitutions(); }

    @PostMapping("/substitutions")
    public Substitution saveSubstitution(@RequestBody Substitution sub) { return service.saveSubstitution(sub); }

    @DeleteMapping("/substitutions/{id}")
    public void deleteSubstitution(@PathVariable Long id) { service.deleteSubstitution(id); }

    // Coverage
    @GetMapping("/coverage")
    public List<CoverageRequest> getCoverageRequests() { return service.getAllCoverageRequests(); }

    @PostMapping("/coverage")
    public CoverageRequest saveCoverageRequest(@RequestBody CoverageRequest req) { return service.saveCoverageRequest(req); }

    @DeleteMapping("/coverage/{id}")
    public void deleteCoverageRequest(@PathVariable Long id) { service.deleteCoverageRequest(id); }

    // Custom Subjects
    @GetMapping("/custom-subjects")
    public List<CustomSubject> getCustomSubjects() { return service.getAllCustomSubjects(); }

    @PostMapping("/custom-subjects")
    public CustomSubject saveCustomSubject(@RequestBody CustomSubject sub) { return service.saveCustomSubject(sub); }

    @DeleteMapping("/custom-subjects/{id}")
    public void deleteCustomSubject(@PathVariable Long id) { service.deleteCustomSubject(id); }

    // Custom Venues
    @GetMapping("/custom-venues")
    public List<CustomVenue> getCustomVenues() { return service.getAllCustomVenues(); }

    @PostMapping("/custom-venues")
    public CustomVenue saveCustomVenue(@RequestBody CustomVenue venue) { return service.saveCustomVenue(venue); }

    @DeleteMapping("/custom-venues/{id}")
    public void deleteCustomVenue(@PathVariable Long id) { service.deleteCustomVenue(id); }

    // Period Notifications
    @GetMapping("/period-notifications")
    public List<PeriodNotification> getPeriodNotifications() { return service.getAllPeriodNotifications(); }

    @PostMapping("/period-notifications")
    public PeriodNotification savePeriodNotification(@RequestBody PeriodNotification notif) { return service.savePeriodNotification(notif); }

    @DeleteMapping("/period-notifications/{id}")
    public void deletePeriodNotification(@PathVariable Long id) { service.deletePeriodNotification(id); }
}
