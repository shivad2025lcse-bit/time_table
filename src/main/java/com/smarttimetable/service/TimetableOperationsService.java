package com.smarttimetable.service;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TimetableOperationsService {

    @Autowired private TimetableOverrideRepository overrideRepo;
    @Autowired private SubstitutionRepository substitutionRepo;
    @Autowired private CoverageRequestRepository coverageRepo;
    @Autowired private CustomSubjectRepository subjectRepo;
    @Autowired private CustomVenueRepository venueRepo;
    @Autowired private PeriodNotificationRepository notificationRepo;
    @Autowired private FacultyTimetableRepository facultyTimetableRepo;

    // Overrides
    public List<TimetableOverride> getAllOverrides() { return overrideRepo.findAll(); }
    public TimetableOverride saveOverride(TimetableOverride override) { return overrideRepo.save(override); }
    public void deleteOverride(Long id) { overrideRepo.deleteById(id); }
    public void deleteAllOverrides() { overrideRepo.deleteAll(); }

    // Substitutions
    public List<Substitution> getAllSubstitutions() { return substitutionRepo.findAll(); }
    public Substitution saveSubstitution(Substitution sub) { return substitutionRepo.save(sub); }
    public void deleteSubstitution(Long id) { substitutionRepo.deleteById(id); }

    // Coverage Requests
    public List<CoverageRequest> getAllCoverageRequests() { return coverageRepo.findAll(); }
    public CoverageRequest saveCoverageRequest(CoverageRequest req) { return coverageRepo.save(req); }
    public void deleteCoverageRequest(Long id) { coverageRepo.deleteById(id); }

    // Custom Subjects
    public List<CustomSubject> getAllCustomSubjects() { return subjectRepo.findAll(); }
    public CustomSubject saveCustomSubject(CustomSubject sub) { return subjectRepo.save(sub); }
    public void deleteCustomSubject(Long id) { subjectRepo.deleteById(id); }

    // Custom Venues
    public List<CustomVenue> getAllCustomVenues() { return venueRepo.findAll(); }
    public CustomVenue saveCustomVenue(CustomVenue venue) { return venueRepo.save(venue); }
    public void deleteCustomVenue(Long id) { venueRepo.deleteById(id); }

    // Period Notifications
    public List<PeriodNotification> getAllPeriodNotifications() { return notificationRepo.findAll(); }
    public PeriodNotification savePeriodNotification(PeriodNotification notif) { return notificationRepo.save(notif); }
    public void deletePeriodNotification(Long id) { notificationRepo.deleteById(id); }

    // Faculty Personal Timetables
    public java.util.Optional<FacultyTimetable> getFacultyTimetable(String username) {
        return facultyTimetableRepo.findByUsernameIgnoreCase(username);
    }

    public FacultyTimetable saveFacultyTimetable(String username, String dataJson, String updatedBy) {
        String normalized = username.trim().toLowerCase();
        FacultyTimetable ft = facultyTimetableRepo.findByUsernameIgnoreCase(normalized)
                .orElseGet(FacultyTimetable::new);
        ft.setUsername(normalized);
        ft.setDataJson(dataJson != null ? dataJson : "{}");
        ft.setUpdatedBy(updatedBy);
        ft.setUpdatedAt(java.time.LocalDateTime.now());
        return facultyTimetableRepo.save(ft);
    }
}
