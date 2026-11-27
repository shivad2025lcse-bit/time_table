package com.smarttimetable.service;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class TemporaryTimetableService {

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) { super(message); }
    }

    @Value("${app.timezone:Asia/Kolkata}")
    private String configuredTimezone;

    @Autowired private TemporaryTimetableChangeRepository changeRepository;
    @Autowired private TemporaryChangeAuditLogRepository auditLogRepository;
    @Autowired private EmailNotificationLogRepository emailLogRepository;
    @Autowired private TimetableRepository timetableRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private SubjectRepository subjectRepository;
    @Autowired private TeacherRepository teacherRepository;
    @Autowired private ClassroomRepository classroomRepository;
    @Autowired private TimeSlotRepository timeSlotRepository;
    @Autowired private EmailNotificationService emailNotificationService;

    public ZoneId getCollegeZone() {
        try {
            return ZoneId.of(configuredTimezone != null && !configuredTimezone.isBlank() ? configuredTimezone : "Asia/Kolkata");
        } catch (Exception e) {
            return ZoneId.of("Asia/Kolkata");
        }
    }

    public LocalDate collegeToday() {
        return LocalDate.now(getCollegeZone());
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "${app.timezone:Asia/Kolkata}")
    @Transactional
    public void scheduledMidnightExpirySweep() {
        expirePastPublishedChanges(collegeToday());
    }

    @Transactional
    public int expirePastPublishedChanges(LocalDate today) {
        LocalDate ref = today != null ? today : collegeToday();
        List<TemporaryTimetableChange> expired = changeRepository.findExpiredPublished(ref);
        if (expired.isEmpty()) return 0;

        LocalDateTime now = LocalDateTime.now(getCollegeZone());
        for (TemporaryTimetableChange c : expired) {
            c.setStatus(TemporaryChangeStatus.EXPIRED);
            c.setExpiredAt(now);
            changeRepository.save(c);
            recordAudit(c.getId(), c.getSectionName(), "EXPIRED", "SYSTEM",
                    "Automatically expired after " + c.getEndDate() + "; permanent timetable restored.");
        }
        return expired.size();
    }

    @Transactional
    public List<Map<String, Object>> createChanges(Map<String, Object> req, User actor, boolean facultyRequest) {
        expirePastPublishedChanges(collegeToday());

        TemporaryChangeType changeType = parseChangeType(req.get("changeType"));
        Integer periodNumber = parsePeriod(req.get("periodNumber"));
        boolean publishRequested = !facultyRequest && Boolean.TRUE.equals(req.get("publishNow"));

        List<Section> targetSections = resolveTargetSections(req);
        if (targetSections.isEmpty()) {
            throw new IllegalArgumentException("At least one valid Section must be selected.");
        }

        List<DateRange> targetDateRanges = resolveDateRanges(req);
        if (targetDateRanges.isEmpty()) {
            throw new IllegalArgumentException("At least one valid Date or Date Range is required.");
        }

        Department explicitDept = req.get("departmentId") != null && !String.valueOf(req.get("departmentId")).isBlank()
                ? departmentRepository.findById(Long.valueOf(req.get("departmentId").toString())).orElse(null)
                : null;

        Subject origSubj = resolveSubject(req.get("originalSubjectId"));
        Subject updSubj = resolveSubject(req.get("updatedSubjectId"));
        Teacher origFac = resolveTeacher(req.get("originalFacultyId"));
        Teacher replFac = resolveTeacher(req.get("replacementFacultyId"));
        Classroom origRoom = resolveClassroom(req.get("originalVenueId"));
        Classroom updRoom = resolveClassroom(req.get("updatedVenueId"));

        String origSubjName = str(req.get("originalSubjectName"));
        if (origSubjName.isEmpty() && origSubj != null) origSubjName = origSubj.getSubjectName();

        String updSubjName = str(req.get("updatedSubjectName"));
        if (updSubjName.isEmpty() && updSubj != null) updSubjName = updSubj.getSubjectName();

        String origFacName = str(req.get("originalFacultyName"));
        if (origFacName.isEmpty() && origFac != null) origFacName = teacherDisplayName(origFac);

        String replFacName = str(req.get("replacementFacultyName"));
        if (replFacName.isEmpty() && replFac != null) replFacName = teacherDisplayName(replFac);

        if (origFac == null && !origFacName.isEmpty()) origFac = findTeacherByName(origFacName);
        if (replFac == null && !replFacName.isEmpty()) replFac = findTeacherByName(replFacName);

        String origVenueName = str(req.get("originalVenueName"));
        if (origVenueName.isEmpty() && origRoom != null) origVenueName = origRoom.getRoomNumber();

        String updVenueName = str(req.get("updatedVenueName"));
        if (updVenueName.isEmpty() && updRoom != null) updVenueName = updRoom.getRoomNumber();

        String origStart = str(req.get("originalStartTime"));
        String origEnd = str(req.get("originalEndTime"));
        String updStart = str(req.get("updatedStartTime"));
        String updEnd = str(req.get("updatedEndTime"));
        String reason = str(req.get("reason"));
        String description = str(req.get("description"));
        String acadYear = str(req.get("academicYear"));
        String batch = str(req.get("batch"));

        List<TemporaryTimetableChange> built = new ArrayList<>();
        for (Section sec : targetSections) {
            for (DateRange range : targetDateRanges) {
                TemporaryTimetableChange c = new TemporaryTimetableChange();
                c.setSection(sec);
                c.setSectionName(sec.getSectionName());
                Department secDept = explicitDept != null ? explicitDept :
                        (sec.getCourse() != null ? sec.getCourse().getDepartment() : null);
                c.setDepartment(secDept);
                c.setAcademicYear(!acadYear.isEmpty() ? acadYear : romanYearForSection(sec));
                c.setBatch(!batch.isEmpty() ? batch : (sec.getBatchStartYear() != null ? sec.getBatchStartYear() + "" : ""));
                c.setChangeType(changeType);
                c.setChangeDate(range.start());
                c.setStartDate(range.start());
                c.setEndDate(range.end());
                String dayLabel = str(req.get("dayOfWeek"));
                c.setDayOfWeek(!dayLabel.isEmpty() ? dayLabel : toDayName(range.start()));
                c.setPeriodNumber(periodNumber);

                // Match underlying permanent slot if one exists for the day/period
                TimetableEntry perm = findPermanentSlot(sec.getId(), c.getDayOfWeek(), periodNumber, sec.getSemester());
                c.setTimetableEntry(perm);
                if (perm != null) {
                    if (origSubj == null) origSubj = perm.getSubject();
                    if (origSubjName.isEmpty() && perm.getSubject() != null) c.setOriginalSubjectName(perm.getSubject().getSubjectName());
                    else c.setOriginalSubjectName(origSubjName);

                    Teacher permTeacher = perm.getTeacher();
                    if (origFac == null) origFac = permTeacher;
                    if (origFacName.isEmpty()) c.setOriginalFacultyName(resolvePermFacultyName(perm));
                    else c.setOriginalFacultyName(origFacName);

                    if (origVenueName.isEmpty()) c.setOriginalVenueName(resolvePermVenueName(perm));
                    else c.setOriginalVenueName(origVenueName);

                    if (origStart.isEmpty() && perm.getTimeSlot() != null) c.setOriginalStartTime(perm.getTimeSlot().getStartTime());
                    else c.setOriginalStartTime(origStart);
                    if (origEnd.isEmpty() && perm.getTimeSlot() != null) c.setOriginalEndTime(perm.getTimeSlot().getEndTime());
                    else c.setOriginalEndTime(origEnd);
                } else {
                    c.setOriginalSubjectName(origSubjName);
                    c.setOriginalFacultyName(origFacName);
                    c.setOriginalVenueName(origVenueName);
                    String[] slotTimes = defaultSlotTimes(periodNumber);
                    c.setOriginalStartTime(!origStart.isEmpty() ? origStart : slotTimes[0]);
                    c.setOriginalEndTime(!origEnd.isEmpty() ? origEnd : slotTimes[1]);
                }

                c.setOriginalSubject(origSubj);
                c.setUpdatedSubject(updSubj);
                c.setUpdatedSubjectName(updSubjName);
                c.setOriginalFaculty(origFac);
                c.setReplacementFaculty(replFac);
                c.setReplacementFacultyName(replFacName);
                c.setOriginalClassroom(origRoom);
                c.setUpdatedClassroom(updRoom);
                c.setUpdatedVenueName(updVenueName);
                c.setUpdatedStartTime(updStart);
                c.setUpdatedEndTime(updEnd);
                c.setReason(reason);
                c.setDescription(description);
                c.setRevision(1);
                c.setCreatedBy(actor != null ? actor.getUsername() : "SYSTEM");

                if (facultyRequest) {
                    c.setStatus(TemporaryChangeStatus.PENDING_APPROVAL);
                } else if (publishRequested) {
                    validateConflicts(c);
                    c.setStatus(TemporaryChangeStatus.PUBLISHED);
                    c.setApprovedBy(actor != null ? actor.getUsername() : "ADMIN");
                    c.setPublishedAt(LocalDateTime.now(getCollegeZone()));
                } else {
                    c.setStatus(TemporaryChangeStatus.DRAFT);
                }
                built.add(c);
            }
        }

        List<TemporaryTimetableChange> saved = changeRepository.saveAll(built);
        List<Map<String, Object>> out = new ArrayList<>();
        for (TemporaryTimetableChange c : saved) {
            String auditAction = c.getStatus() == TemporaryChangeStatus.PUBLISHED ? "PUBLISHED"
                    : (c.getStatus() == TemporaryChangeStatus.PENDING_APPROVAL ? "FACULTY_REQUESTED" : "CREATED");
            recordAudit(c.getId(), c.getSectionName(), auditAction,
                    actor != null ? actor.getUsername() : "SYSTEM",
                    describeChangeSummary(c));
            if (c.getStatus() == TemporaryChangeStatus.PUBLISHED) {
                emailNotificationService.dispatchTemporaryChangeEmailsAsync(c.getId(), "TEMP_CHANGE_PUBLISHED", c.getRevision());
            }
            out.add(toDto(c));
        }
        return out;
    }

    @Transactional
    public Map<String, Object> updateChange(Long id, Map<String, Object> req, User actor) {
        TemporaryTimetableChange c = changeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Temporary timetable change not found: " + id));
        if (c.getStatus() == TemporaryChangeStatus.EXPIRED || c.getStatus() == TemporaryChangeStatus.CANCELLED) {
            throw new IllegalStateException("Cancelled or expired changes cannot be edited directly.");
        }

        if (req.containsKey("changeType")) c.setChangeType(parseChangeType(req.get("changeType")));
        if (req.containsKey("periodNumber")) c.setPeriodNumber(parsePeriod(req.get("periodNumber")));

        if (req.containsKey("startDate") || req.containsKey("endDate") || req.containsKey("changeDate")) {
            LocalDate sd = parseDate(req.get("startDate") != null ? req.get("startDate") : req.get("changeDate"));
            LocalDate ed = parseDate(req.get("endDate") != null ? req.get("endDate") : sd);
            if (sd == null || ed == null || ed.isBefore(sd)) {
                throw new IllegalArgumentException("Invalid start/end dates.");
            }
            c.setChangeDate(sd);
            c.setStartDate(sd);
            c.setEndDate(ed);
            c.setDayOfWeek(toDayName(sd));
        }
        if (req.containsKey("originalSubjectName")) c.setOriginalSubjectName(str(req.get("originalSubjectName")));
        if (req.containsKey("updatedSubjectName")) c.setUpdatedSubjectName(str(req.get("updatedSubjectName")));
        if (req.containsKey("originalFacultyName")) {
            String f = str(req.get("originalFacultyName"));
            c.setOriginalFacultyName(f);
            c.setOriginalFaculty(f.isEmpty() ? null : findTeacherByName(f));
        }
        if (req.containsKey("replacementFacultyName")) {
            String f = str(req.get("replacementFacultyName"));
            c.setReplacementFacultyName(f);
            c.setReplacementFaculty(f.isEmpty() ? null : findTeacherByName(f));
        }
        if (req.containsKey("originalVenueName")) c.setOriginalVenueName(str(req.get("originalVenueName")));
        if (req.containsKey("updatedVenueName")) c.setUpdatedVenueName(str(req.get("updatedVenueName")));
        if (req.containsKey("originalStartTime")) c.setOriginalStartTime(str(req.get("originalStartTime")));
        if (req.containsKey("updatedStartTime")) c.setUpdatedStartTime(str(req.get("updatedStartTime")));
        if (req.containsKey("originalEndTime")) c.setOriginalEndTime(str(req.get("originalEndTime")));
        if (req.containsKey("updatedEndTime")) c.setUpdatedEndTime(str(req.get("updatedEndTime")));
        if (req.containsKey("reason")) c.setReason(str(req.get("reason")));
        if (req.containsKey("description")) c.setDescription(str(req.get("description")));

        boolean wasPublished = c.getStatus() == TemporaryChangeStatus.PUBLISHED;
        if (wasPublished) {
            validateConflicts(c);
            c.setRevision((c.getRevision() != null ? c.getRevision() : 1) + 1);
            c.setPublishedAt(LocalDateTime.now(getCollegeZone()));
        }

        TemporaryTimetableChange saved = changeRepository.save(c);
        recordAudit(saved.getId(), saved.getSectionName(),
                wasPublished ? "MODIFIED_PUBLISHED" : "EDITED",
                actor != null ? actor.getUsername() : "ADMIN",
                describeChangeSummary(saved));

        if (wasPublished) {
            emailNotificationService.dispatchTemporaryChangeEmailsAsync(saved.getId(), "TEMP_CHANGE_MODIFIED", saved.getRevision());
        }
        return toDto(saved);
    }

    @Transactional
    public Map<String, Object> publishChange(Long id, User actor) {
        expirePastPublishedChanges(collegeToday());
        TemporaryTimetableChange c = changeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Temporary timetable change not found: " + id));
        if (c.getStatus() == TemporaryChangeStatus.CANCELLED || c.getStatus() == TemporaryChangeStatus.EXPIRED) {
            throw new IllegalStateException("Cannot publish a cancelled or expired change.");
        }
        if (c.getEndDate().isBefore(collegeToday())) {
            throw new IllegalArgumentException("Cannot publish a temporary change whose end date has already passed.");
        }

        validateConflicts(c);
        c.setStatus(TemporaryChangeStatus.PUBLISHED);
        c.setApprovedBy(actor != null ? actor.getUsername() : "ADMIN");
        c.setPublishedAt(LocalDateTime.now(getCollegeZone()));
        TemporaryTimetableChange saved = changeRepository.save(c);

        recordAudit(saved.getId(), saved.getSectionName(), "PUBLISHED",
                actor != null ? actor.getUsername() : "ADMIN",
                describeChangeSummary(saved));
        emailNotificationService.dispatchTemporaryChangeEmailsAsync(saved.getId(), "TEMP_CHANGE_PUBLISHED", saved.getRevision());
        return toDto(saved);
    }

    @Transactional
    public Map<String, Object> cancelChange(Long id, User actor, String cancelReason) {
        TemporaryTimetableChange c = changeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Temporary timetable change not found: " + id));
        if (c.getStatus() == TemporaryChangeStatus.CANCELLED) {
            return toDto(c);
        }
        boolean wasPublished = c.getStatus() == TemporaryChangeStatus.PUBLISHED;
        c.setStatus(TemporaryChangeStatus.CANCELLED);
        c.setCancelledAt(LocalDateTime.now(getCollegeZone()));
        if (cancelReason != null && !cancelReason.isBlank()) {
            c.setDescription((c.getDescription() != null && !c.getDescription().isBlank() ? c.getDescription() + " | " : "")
                    + "Cancellation Note: " + cancelReason.trim());
        }
        if (wasPublished) {
            c.setRevision((c.getRevision() != null ? c.getRevision() : 1) + 1);
        }
        TemporaryTimetableChange saved = changeRepository.save(c);
        recordAudit(saved.getId(), saved.getSectionName(), "CANCELLED",
                actor != null ? actor.getUsername() : "ADMIN",
                "Cancelled change for " + saved.getSectionName() + " P" + saved.getPeriodNumber() + " (" + saved.getStartDate() + ")");
        if (wasPublished) {
            emailNotificationService.dispatchTemporaryChangeEmailsAsync(saved.getId(), "TEMP_CHANGE_CANCELLED", saved.getRevision());
        }
        return toDto(saved);
    }

    @Transactional
    public Map<String, Object> rejectFacultyRequest(Long id, User actor, String reason) {
        TemporaryTimetableChange c = changeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Temporary timetable change not found: " + id));
        c.setStatus(TemporaryChangeStatus.REJECTED);
        if (reason != null && !reason.isBlank()) {
            c.setReason("Rejected by Admin: " + reason.trim());
        }
        TemporaryTimetableChange saved = changeRepository.save(c);
        recordAudit(saved.getId(), saved.getSectionName(), "REJECTED",
                actor != null ? actor.getUsername() : "ADMIN", saved.getReason());
        return toDto(saved);
    }

    @Transactional
    public void deleteChange(Long id, User actor) {
        TemporaryTimetableChange c = changeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Temporary timetable change not found: " + id));
        if (c.getStatus() == TemporaryChangeStatus.PUBLISHED) {
            throw new IllegalStateException("Cancel a published temporary change before deleting it, so affected students & staff remain informed.");
        }
        // Detach audit/notification FK references before deleting
        for (EmailNotificationLog logItem : emailLogRepository.findByTemporaryChangeIdOrderBySentAtDesc(id)) {
            logItem.setTemporaryChange(null);
            emailLogRepository.save(logItem);
        }
        String sec = c.getSectionName();
        changeRepository.delete(c);
        recordAudit(id, sec, "DELETED", actor != null ? actor.getUsername() : "ADMIN",
                "Deleted change ID " + id + " for " + sec);
    }

    public void validateConflicts(TemporaryTimetableChange candidate) {
        if (candidate.getSection() == null || candidate.getPeriodNumber() == null
                || candidate.getStartDate() == null || candidate.getEndDate() == null) {
            throw new IllegalArgumentException("Section, Period, and valid Dates are required.");
        }
        if (candidate.getEndDate().isBefore(candidate.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be earlier than start date.");
        }
        if (candidate.getPeriodNumber() < 1 || candidate.getPeriodNumber() > 10) {
            throw new IllegalArgumentException("Period number must be between 1 and 10.");
        }

        // 1. Overlapping published temporary changes on same section, date range & period
        List<TemporaryTimetableChange> sectionOverlaps = changeRepository.findOverlappingForSectionAndPeriod(
                candidate.getSection().getId(),
                candidate.getPeriodNumber(),
                candidate.getStartDate(),
                candidate.getEndDate(),
                List.of(TemporaryChangeStatus.PUBLISHED)
        );
        for (TemporaryTimetableChange other : sectionOverlaps) {
            if (!Objects.equals(other.getId(), candidate.getId())) {
                throw new ConflictException("Conflicting published temporary change (#" + other.getId() + ") already exists for "
                        + candidate.getSectionName() + " Period " + candidate.getPeriodNumber()
                        + " between " + other.getStartDate() + " and " + other.getEndDate() + ".");
            }
        }

        // 2. Replacement Faculty double-booking check across other sections
        String replFacNorm = normalizeName(candidate.getReplacementFacultyName());
        boolean cancelsClass = candidate.getChangeType() == TemporaryChangeType.PERIOD_CANCELLATION
                || candidate.getChangeType() == TemporaryChangeType.FREE_PERIOD;

        List<TemporaryTimetableChange> samePeriodPublished = changeRepository.findPublishedOverlappingForPeriod(
                candidate.getPeriodNumber(), candidate.getStartDate(), candidate.getEndDate()
        );

        if (!cancelsClass && !replFacNorm.isEmpty()) {
            for (TemporaryTimetableChange other : samePeriodPublished) {
                if (Objects.equals(other.getId(), candidate.getId())) continue;
                if (Objects.equals(other.getSection().getId(), candidate.getSection().getId())) continue;
                if (other.getChangeType() == TemporaryChangeType.PERIOD_CANCELLATION || other.getChangeType() == TemporaryChangeType.FREE_PERIOD) continue;
                String otherEffFac = !normalizeName(other.getReplacementFacultyName()).isEmpty()
                        ? normalizeName(other.getReplacementFacultyName())
                        : normalizeName(other.getOriginalFacultyName());
                if (replFacNorm.equals(otherEffFac)) {
                    throw new ConflictException("Faculty conflict: " + candidate.getReplacementFacultyName()
                            + " is already assigned via temporary change (#" + other.getId() + ") to "
                            + other.getSectionName() + " in Period " + candidate.getPeriodNumber() + ".");
                }
            }

            // Check permanent slots on each day within the range (up to 31 days sanity guard)
            LocalDate cursor = candidate.getStartDate();
            int guard = 0;
            while (!cursor.isAfter(candidate.getEndDate()) && guard++ < 60) {
                String dayName = toDayName(cursor);
                if (!"Sunday".equalsIgnoreCase(dayName)) {
                    List<TimetableEntry> allEntries = timetableRepository.findAll();
                    for (TimetableEntry entry : allEntries) {
                        if (entry.getSection() == null || Objects.equals(entry.getSection().getId(), candidate.getSection().getId())) continue;
                        if (entry.getTimeSlot() == null || !Objects.equals(entry.getTimeSlot().getSlotNumber(), candidate.getPeriodNumber())) continue;
                        if (!dayName.equalsIgnoreCase(entry.getDay())) continue;
                        String permFac = normalizeName(resolvePermFacultyName(entry));
                        if (!permFac.equals(replFacNorm)) continue;

                        // Check if that other section moved/cancelled/substituted this faculty away on cursor
                        final LocalDate checkDate = cursor;
                        boolean freedByTemp = samePeriodPublished.stream().anyMatch(o ->
                                Objects.equals(o.getSection().getId(), entry.getSection().getId())
                                && o.coversDate(checkDate)
                                && (o.getChangeType() == TemporaryChangeType.PERIOD_CANCELLATION
                                    || o.getChangeType() == TemporaryChangeType.FREE_PERIOD
                                    || !normalizeName(o.getReplacementFacultyName()).isEmpty())
                        );
                        if (!freedByTemp) {
                            throw new ConflictException("Faculty conflict on " + cursor + " (" + dayName + " P" + candidate.getPeriodNumber() + "): "
                                    + candidate.getReplacementFacultyName() + " has a permanent class for " + entry.getSection().getSectionName() + ".");
                        }
                    }
                }
                cursor = cursor.plusDays(1);
            }
        }

        // 3. Venue/Classroom double-booking check across other sections
        String updVenueNorm = normalizeVenue(candidate.getUpdatedVenueName());
        if (!cancelsClass && !updVenueNorm.isEmpty()) {
            for (TemporaryTimetableChange other : samePeriodPublished) {
                if (Objects.equals(other.getId(), candidate.getId())) continue;
                if (Objects.equals(other.getSection().getId(), candidate.getSection().getId())) continue;
                if (other.getChangeType() == TemporaryChangeType.PERIOD_CANCELLATION || other.getChangeType() == TemporaryChangeType.FREE_PERIOD) continue;
                String otherVenue = normalizeVenue(
                        !str(other.getUpdatedVenueName()).isEmpty() ? other.getUpdatedVenueName() : other.getOriginalVenueName()
                );
                if (updVenueNorm.equals(otherVenue)) {
                    throw new ConflictException("Classroom conflict: Venue '" + candidate.getUpdatedVenueName()
                            + "' is already allocated via temporary change (#" + other.getId() + ") to "
                            + other.getSectionName() + " in Period " + candidate.getPeriodNumber() + ".");
                }
            }

            LocalDate cursor = candidate.getStartDate();
            int guard = 0;
            while (!cursor.isAfter(candidate.getEndDate()) && guard++ < 60) {
                String dayName = toDayName(cursor);
                if (!"Sunday".equalsIgnoreCase(dayName)) {
                    for (TimetableEntry entry : timetableRepository.findAll()) {
                        if (entry.getSection() == null || Objects.equals(entry.getSection().getId(), candidate.getSection().getId())) continue;
                        if (entry.getTimeSlot() == null || !Objects.equals(entry.getTimeSlot().getSlotNumber(), candidate.getPeriodNumber())) continue;
                        if (!dayName.equalsIgnoreCase(entry.getDay())) continue;
                        String permVenue = normalizeVenue(resolvePermVenueName(entry));
                        if (!permVenue.equals(updVenueNorm)) continue;

                        final LocalDate checkDate = cursor;
                        boolean freedByTemp = samePeriodPublished.stream().anyMatch(o ->
                                Objects.equals(o.getSection().getId(), entry.getSection().getId())
                                && o.coversDate(checkDate)
                                && (o.getChangeType() == TemporaryChangeType.PERIOD_CANCELLATION
                                    || o.getChangeType() == TemporaryChangeType.FREE_PERIOD
                                    || !normalizeVenue(o.getUpdatedVenueName()).isEmpty())
                        );
                        if (!freedByTemp) {
                            throw new ConflictException("Classroom conflict on " + cursor + " (" + dayName + " P" + candidate.getPeriodNumber() + "): "
                                    + "Venue '" + candidate.getUpdatedVenueName() + "' is permanently booked by " + entry.getSection().getSectionName() + ".");
                        }
                    }
                }
                cursor = cursor.plusDays(1);
            }
        }
    }

    @Transactional
    public Map<String, Object> getEffectiveSectionTimetable(Long sectionId, LocalDate targetDate, Integer targetSemester) {
        LocalDate date = targetDate != null ? targetDate : collegeToday();
        expirePastPublishedChanges(collegeToday());

        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found: " + sectionId));
        Integer effectiveSem = targetSemester != null ? targetSemester : section.getSemester();
        String dayName = toDayName(date);

        List<TimetableEntry> sectionEntries = timetableRepository.findBySectionId(sectionId).stream()
                .filter(e -> effectiveSem == null || Objects.equals(e.getSemester(), effectiveSem))
                .filter(e -> dayName.equalsIgnoreCase(e.getDay()))
                .toList();

        Map<Integer, TimetableEntry> permByPeriod = new HashMap<>();
        for (TimetableEntry e : sectionEntries) {
            if (e.getTimeSlot() != null && e.getTimeSlot().getSlotNumber() != null) {
                permByPeriod.put(e.getTimeSlot().getSlotNumber(), e);
            }
        }

        List<TemporaryTimetableChange> activeTemps = changeRepository.findActiveBySectionAndDate(
                sectionId, TemporaryChangeStatus.PUBLISHED, date
        );
        Map<Integer, TemporaryTimetableChange> tempByPeriod = new HashMap<>();
        int maxPeriod = 7;
        for (TemporaryTimetableChange tc : activeTemps) {
            if (tc.getPeriodNumber() != null) {
                tempByPeriod.put(tc.getPeriodNumber(), tc);
                if (tc.getPeriodNumber() > maxPeriod) maxPeriod = tc.getPeriodNumber();
            }
        }

        List<Map<String, Object>> slots = new ArrayList<>();
        if (!"Sunday".equalsIgnoreCase(dayName)) {
            for (int p = 1; p <= maxPeriod; p++) {
                TimetableEntry perm = permByPeriod.get(p);
                TemporaryTimetableChange temp = tempByPeriod.get(p);
                if (p > 7 && perm == null && temp == null) continue;
                slots.add(buildEffectiveSlotDto(p, perm, temp));
            }
        }

        List<TemporaryTimetableChange> upcoming = changeRepository.findUpcomingBySection(
                sectionId, TemporaryChangeStatus.PUBLISHED, collegeToday()
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", date.toString());
        result.put("dayOfWeek", dayName);
        result.put("isHoliday", "Sunday".equalsIgnoreCase(dayName));
        result.put("sectionId", section.getId());
        result.put("sectionName", section.getSectionName());
        result.put("semester", effectiveSem);
        result.put("overrideCount", activeTemps.size());
        result.put("slots", slots);
        result.put("upcomingChanges", upcoming.stream().map(this::toDto).toList());
        return result;
    }

    @Transactional
    public Map<String, Object> getEffectiveFacultyTimetable(Teacher teacher, LocalDate targetDate) {
        LocalDate date = targetDate != null ? targetDate : collegeToday();
        expirePastPublishedChanges(collegeToday());

        String dayName = toDayName(date);
        String facName = teacherDisplayName(teacher);
        String facNorm = normalizeName(facName);

        List<TimetableEntry> allPerm = timetableRepository.findAll();
        List<TemporaryTimetableChange> allPublishedOnDate = changeRepository.findActiveForDate(TemporaryChangeStatus.PUBLISHED, date);

        List<Map<String, Object>> slots = new ArrayList<>();
        Set<String> coveredSecPeriods = new HashSet<>();

        // 1. Permanent entries for this teacher on dayName, overlaid with any section/period temp change
        for (TimetableEntry perm : allPerm) {
            if (!dayName.equalsIgnoreCase(perm.getDay()) || perm.getTimeSlot() == null || perm.getSection() == null) continue;
            boolean matchesTeacher = (perm.getTeacher() != null && Objects.equals(perm.getTeacher().getId(), teacher.getId()))
                    || normalizeName(resolvePermFacultyName(perm)).equals(facNorm);
            if (!matchesTeacher) continue;

            Integer period = perm.getTimeSlot().getSlotNumber();
            Long secId = perm.getSection().getId();
            coveredSecPeriods.add(secId + ":" + period);

            TemporaryTimetableChange matchingTemp = allPublishedOnDate.stream()
                    .filter(tc -> Objects.equals(tc.getSection().getId(), secId) && Objects.equals(tc.getPeriodNumber(), period))
                    .findFirst().orElse(null);

            Map<String, Object> dto = buildEffectiveSlotDto(period, perm, matchingTemp);
            dto.put("sectionId", secId);
            dto.put("sectionName", perm.getSection().getSectionName());
            dto.put("facultyInvolvement", matchingTemp != null && !normalizeName(matchingTemp.getReplacementFacultyName()).isEmpty()
                    && !normalizeName(matchingTemp.getReplacementFacultyName()).equals(facNorm)
                    ? "REPLACED_OUT" : "ASSIGNED");
            slots.add(dto);
        }

        // 2. Temporary changes on targetDate assigning this teacher as replacement/extra/special faculty
        for (TemporaryTimetableChange tc : allPublishedOnDate) {
            String key = tc.getSection().getId() + ":" + tc.getPeriodNumber();
            if (coveredSecPeriods.contains(key)) continue;
            boolean isRepl = (tc.getReplacementFaculty() != null && Objects.equals(tc.getReplacementFaculty().getId(), teacher.getId()))
                    || (!normalizeName(tc.getReplacementFacultyName()).isEmpty() && normalizeName(tc.getReplacementFacultyName()).equals(facNorm));
            if (isRepl) {
                Map<String, Object> dto = buildEffectiveSlotDto(tc.getPeriodNumber(), tc.getTimetableEntry(), tc);
                dto.put("sectionId", tc.getSection().getId());
                dto.put("sectionName", tc.getSectionName());
                dto.put("facultyInvolvement", tc.getChangeType() == TemporaryChangeType.EXTRA_CLASS
                        || tc.getChangeType() == TemporaryChangeType.SPECIAL_CLASS
                        ? "EXTRA_ASSIGNED" : "SUBSTITUTION_ASSIGNED");
                slots.add(dto);
            }
        }

        slots.sort(Comparator.comparingInt(m -> (Integer) m.get("periodNumber")));

        List<Map<String, Object>> relevantChanges = changeRepository.findAllByOrderByStartDateDescPeriodNumberAscIdDesc().stream()
                .filter(tc -> {
                    boolean orig = (tc.getOriginalFaculty() != null && Objects.equals(tc.getOriginalFaculty().getId(), teacher.getId()))
                            || normalizeName(tc.getOriginalFacultyName()).equals(facNorm);
                    boolean repl = (tc.getReplacementFaculty() != null && Objects.equals(tc.getReplacementFaculty().getId(), teacher.getId()))
                            || normalizeName(tc.getReplacementFacultyName()).equals(facNorm);
                    return orig || repl;
                })
                .map(this::toDto)
                .toList();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("date", date.toString());
        res.put("dayOfWeek", dayName);
        res.put("teacherId", teacher.getId());
        res.put("facultyName", facName);
        res.put("slots", slots);
        res.put("changes", relevantChanges);
        return res;
    }

    @Transactional
    public Map<String, Object> previewAffectedSlot(Long sectionId, LocalDate date, Integer periodNumber) {
        Section sec = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found: " + sectionId));
        String dayName = toDayName(date);
        TimetableEntry perm = findPermanentSlot(sectionId, dayName, periodNumber, sec.getSemester());
        List<TemporaryTimetableChange> existing = changeRepository.findOverlappingForSectionAndPeriod(
                sectionId, periodNumber, date, date, List.of(TemporaryChangeStatus.PUBLISHED, TemporaryChangeStatus.PENDING_APPROVAL)
        );
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("sectionId", sec.getId());
        res.put("sectionName", sec.getSectionName());
        res.put("date", date.toString());
        res.put("dayOfWeek", dayName);
        res.put("periodNumber", periodNumber);
        String[] times = defaultSlotTimes(periodNumber);
        if (perm != null) {
            res.put("hasPermanentSlot", true);
            res.put("originalSubjectName", perm.getSubject() != null ? perm.getSubject().getSubjectName() : "FREE");
            res.put("originalFacultyName", resolvePermFacultyName(perm));
            res.put("originalVenueName", resolvePermVenueName(perm));
            res.put("originalStartTime", perm.getTimeSlot() != null ? perm.getTimeSlot().getStartTime() : times[0]);
            res.put("originalEndTime", perm.getTimeSlot() != null ? perm.getTimeSlot().getEndTime() : times[1]);
        } else {
            res.put("hasPermanentSlot", false);
            res.put("originalSubjectName", "FREE");
            res.put("originalFacultyName", "");
            res.put("originalVenueName", "");
            res.put("originalStartTime", times[0]);
            res.put("originalEndTime", times[1]);
        }
        res.put("conflictingChanges", existing.stream().map(this::toDto).toList());
        return res;
    }

    @Transactional
    public Map<String, Object> getAdminDashboardOverview(
            Long departmentId, String academicYear, Long sectionId,
            LocalDate date, String facultyQuery, TemporaryChangeType changeType, TemporaryChangeStatus statusFilter
    ) {
        LocalDate today = collegeToday();
        expirePastPublishedChanges(today);

        List<TemporaryTimetableChange> all = changeRepository.findAllByOrderByStartDateDescPeriodNumberAscIdDesc();

        long totalCount = all.size();
        long todayCount = all.stream().filter(c -> c.getStatus() == TemporaryChangeStatus.PUBLISHED && c.coversDate(today)).count();
        long upcomingCount = all.stream().filter(c -> c.getStatus() == TemporaryChangeStatus.PUBLISHED && c.getEndDate().isAfter(today)).count();
        long publishedCount = all.stream().filter(c -> c.getStatus() == TemporaryChangeStatus.PUBLISHED).count();
        long cancelledCount = all.stream().filter(c -> c.getStatus() == TemporaryChangeStatus.CANCELLED).count();
        long expiredCount = all.stream().filter(c -> c.getStatus() == TemporaryChangeStatus.EXPIRED).count();
        long pendingCount = all.stream().filter(c -> c.getStatus() == TemporaryChangeStatus.PENDING_APPROVAL).count();

        long emailsSent = emailLogRepository.countByNotificationStatusIn(List.of("SENT", "SIMULATED"));
        long emailsFailed = emailLogRepository.countByNotificationStatus("FAILED");

        List<Map<String, Object>> filtered = all.stream()
                .filter(c -> departmentId == null || (c.getDepartment() != null && Objects.equals(c.getDepartment().getId(), departmentId)))
                .filter(c -> academicYear == null || academicYear.isBlank() || academicYear.equalsIgnoreCase(str(c.getAcademicYear())))
                .filter(c -> sectionId == null || (c.getSection() != null && Objects.equals(c.getSection().getId(), sectionId)))
                .filter(c -> date == null || c.coversDate(date))
                .filter(c -> changeType == null || c.getChangeType() == changeType)
                .filter(c -> statusFilter == null || c.getStatus() == statusFilter)
                .filter(c -> facultyQuery == null || facultyQuery.isBlank()
                        || str(c.getOriginalFacultyName()).toLowerCase().contains(facultyQuery.toLowerCase())
                        || str(c.getReplacementFacultyName()).toLowerCase().contains(facultyQuery.toLowerCase()))
                .map(this::toDto)
                .toList();

        List<Map<String, Object>> logs = emailLogRepository.findTop250ByOrderBySentAtDesc().stream()
                .map(this::toEmailLogDto)
                .toList();

        List<Map<String, Object>> audits = auditLogRepository.findTop200ByOrderByCreatedAtDesc().stream()
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", a.getId());
                    m.put("temporaryChangeId", a.getTemporaryChangeId());
                    m.put("sectionName", a.getSectionName());
                    m.put("actionType", a.getActionType());
                    m.put("actorUsername", a.getActorUsername());
                    m.put("details", a.getDetails());
                    m.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
                    return m;
                }).toList();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", totalCount);
        stats.put("today", todayCount);
        stats.put("upcoming", upcomingCount);
        stats.put("published", publishedCount);
        stats.put("cancelled", cancelledCount);
        stats.put("expired", expiredCount);
        stats.put("pendingApproval", pendingCount);
        stats.put("emailsSent", emailsSent);
        stats.put("emailsFailed", emailsFailed);
        stats.put("emailProvider", emailNotificationService.resolveActiveProvider());
        stats.put("collegeDate", today.toString());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("stats", stats);
        resp.put("changes", filtered);
        resp.put("emailLogs", logs);
        resp.put("auditLogs", audits);
        return resp;
    }

    private Map<String, Object> buildEffectiveSlotDto(int periodNumber, TimetableEntry perm, TemporaryTimetableChange temp) {
        String[] defTimes = defaultSlotTimes(periodNumber);
        String permSub = perm != null && perm.getSubject() != null ? perm.getSubject().getSubjectName() : "FREE";
        String permCode = perm != null && perm.getSubject() != null ? str(perm.getSubject().getSubjectCode()) : "";
        String permFac = perm != null ? resolvePermFacultyName(perm) : "-";
        String permVenue = perm != null ? resolvePermVenueName(perm) : "-";
        String permStart = (perm != null && perm.getTimeSlot() != null) ? perm.getTimeSlot().getStartTime() : defTimes[0];
        String permEnd = (perm != null && perm.getTimeSlot() != null) ? perm.getTimeSlot().getEndTime() : defTimes[1];

        String effSub = permSub;
        String effFac = permFac;
        String effVenue = permVenue;
        String effStart = permStart;
        String effEnd = permEnd;
        String badgeType = "PERMANENT";
        boolean isOverridden = false;

        if (temp != null && temp.getStatus() == TemporaryChangeStatus.PUBLISHED) {
            isOverridden = true;
            switch (temp.getChangeType()) {
                case PERIOD_CANCELLATION -> {
                    badgeType = "CANCELLED";
                    effSub = "CANCELLED";
                    effFac = "-";
                    effVenue = "-";
                }
                case FREE_PERIOD -> {
                    badgeType = "FREE PERIOD";
                    effSub = "FREE";
                    effFac = "-";
                    effVenue = "-";
                }
                case FACULTY_SUBSTITUTION -> {
                    badgeType = "FACULTY SUBSTITUTION";
                    if (!str(temp.getUpdatedSubjectName()).isEmpty()) effSub = temp.getUpdatedSubjectName();
                    if (!str(temp.getReplacementFacultyName()).isEmpty()) effFac = temp.getReplacementFacultyName();
                    if (!str(temp.getUpdatedVenueName()).isEmpty()) effVenue = temp.getUpdatedVenueName();
                }
                case CLASSROOM_CHANGE -> {
                    badgeType = "ROOM CHANGE";
                    if (!str(temp.getUpdatedSubjectName()).isEmpty()) effSub = temp.getUpdatedSubjectName();
                    if (!str(temp.getReplacementFacultyName()).isEmpty()) effFac = temp.getReplacementFacultyName();
                    if (!str(temp.getUpdatedVenueName()).isEmpty()) effVenue = temp.getUpdatedVenueName();
                }
                case EXTRA_CLASS, SPECIAL_CLASS -> {
                    badgeType = "EXTRA CLASS";
                    effSub = !str(temp.getUpdatedSubjectName()).isEmpty()
                            ? temp.getUpdatedSubjectName()
                            : (temp.getChangeType() == TemporaryChangeType.SPECIAL_CLASS ? "SPECIAL CLASS" : "EXTRA CLASS");
                    if (!str(temp.getReplacementFacultyName()).isEmpty()) effFac = temp.getReplacementFacultyName();
                    if (!str(temp.getUpdatedVenueName()).isEmpty()) effVenue = temp.getUpdatedVenueName();
                    if (!str(temp.getUpdatedStartTime()).isEmpty()) effStart = temp.getUpdatedStartTime();
                    if (!str(temp.getUpdatedEndTime()).isEmpty()) effEnd = temp.getUpdatedEndTime();
                }
                default -> {
                    badgeType = "TEMPORARY CHANGE";
                    if (!str(temp.getUpdatedSubjectName()).isEmpty()) effSub = temp.getUpdatedSubjectName();
                    if (!str(temp.getReplacementFacultyName()).isEmpty()) effFac = temp.getReplacementFacultyName();
                    if (!str(temp.getUpdatedVenueName()).isEmpty()) effVenue = temp.getUpdatedVenueName();
                    if (!str(temp.getUpdatedStartTime()).isEmpty()) effStart = temp.getUpdatedStartTime();
                    if (!str(temp.getUpdatedEndTime()).isEmpty()) effEnd = temp.getUpdatedEndTime();
                }
            }
        }

        String low = effSub.toLowerCase();
        String category = "CANCELLED".equalsIgnoreCase(effSub) ? "cat-cancelled"
                : ("cat-theory");
        if (!"CANCELLED".equalsIgnoreCase(effSub) && (low.contains("lab") || low.contains("practical") || low.contains("project"))) {
            category = "cat-lab";
        } else if ("alt".equals(low)) {
            category = "cat-alt";
        }

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("periodNumber", periodNumber);
        m.put("startTime", effStart);
        m.put("endTime", effEnd);
        m.put("effectiveSubject", effSub);
        m.put("effectiveSubjectCode", permCode);
        m.put("effectiveFaculty", effFac);
        m.put("effectiveVenue", effVenue);
        m.put("category", category);
        m.put("badgeType", badgeType);
        m.put("isTemporaryOverride", isOverridden);
        m.put("originalSubject", permSub);
        m.put("originalFaculty", permFac);
        m.put("originalVenue", permVenue);
        m.put("originalStartTime", permStart);
        m.put("originalEndTime", permEnd);
        m.put("temporaryChange", temp != null ? toDto(temp) : null);
        return m;
    }

    public Map<String, Object> toDto(TemporaryTimetableChange c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("departmentId", c.getDepartment() != null ? c.getDepartment().getId() : null);
        m.put("departmentCode", c.getDepartment() != null ? c.getDepartment().getCode() : "");
        m.put("academicYear", str(c.getAcademicYear()));
        m.put("batch", str(c.getBatch()));
        m.put("sectionId", c.getSection() != null ? c.getSection().getId() : null);
        m.put("sectionName", c.getSectionName());
        m.put("changeType", c.getChangeType() != null ? c.getChangeType().name() : null);
        m.put("changeDate", c.getChangeDate() != null ? c.getChangeDate().toString() : null);
        m.put("startDate", c.getStartDate() != null ? c.getStartDate().toString() : null);
        m.put("endDate", c.getEndDate() != null ? c.getEndDate().toString() : null);
        m.put("dayOfWeek", str(c.getDayOfWeek()));
        m.put("periodNumber", c.getPeriodNumber());
        m.put("originalSubjectName", str(c.getOriginalSubjectName()));
        m.put("updatedSubjectName", str(c.getUpdatedSubjectName()));
        m.put("originalFacultyName", str(c.getOriginalFacultyName()));
        m.put("replacementFacultyName", str(c.getReplacementFacultyName()));
        m.put("originalVenueName", str(c.getOriginalVenueName()));
        m.put("updatedVenueName", str(c.getUpdatedVenueName()));
        m.put("originalStartTime", str(c.getOriginalStartTime()));
        m.put("updatedStartTime", str(c.getUpdatedStartTime()));
        m.put("originalEndTime", str(c.getOriginalEndTime()));
        m.put("updatedEndTime", str(c.getUpdatedEndTime()));
        m.put("reason", str(c.getReason()));
        m.put("description", str(c.getDescription()));
        m.put("status", c.getStatus() != null ? c.getStatus().name() : null);
        m.put("revision", c.getRevision());
        m.put("createdBy", str(c.getCreatedBy()));
        m.put("approvedBy", str(c.getApprovedBy()));
        m.put("publishedAt", c.getPublishedAt() != null ? c.getPublishedAt().toString() : null);
        m.put("cancelledAt", c.getCancelledAt() != null ? c.getCancelledAt().toString() : null);
        m.put("expiredAt", c.getExpiredAt() != null ? c.getExpiredAt().toString() : null);
        m.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
        return m;
    }

    public Map<String, Object> toEmailLogDto(EmailNotificationLog l) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", l.getId());
        m.put("recipientName", str(l.getRecipientName()));
        m.put("recipientRole", str(l.getRecipientRole()));
        m.put("email", str(l.getEmail()));
        m.put("temporaryChangeId", l.getTemporaryChange() != null ? l.getTemporaryChange().getId() : null);
        m.put("sectionName", l.getTemporaryChange() != null ? l.getTemporaryChange().getSectionName() : "");
        m.put("changeRevision", l.getChangeRevision());
        m.put("eventType", str(l.getEventType()));
        m.put("emailSubject", str(l.getEmailSubject()));
        m.put("notificationStatus", str(l.getNotificationStatus()));
        m.put("provider", str(l.getProvider()));
        m.put("errorMessage", str(l.getErrorMessage()));
        m.put("sentAt", l.getSentAt() != null ? l.getSentAt().toString() : null);
        return m;
    }

    private void recordAudit(Long changeId, String sectionName, String action, String actor, String details) {
        TemporaryChangeAuditLog logEntry = new TemporaryChangeAuditLog();
        logEntry.setTemporaryChangeId(changeId);
        logEntry.setSectionName(sectionName);
        logEntry.setActionType(action);
        logEntry.setActorUsername(actor);
        logEntry.setDetails(details != null && details.length() > 1150 ? details.substring(0, 1150) : details);
        auditLogRepository.save(logEntry);
    }

    private String describeChangeSummary(TemporaryTimetableChange c) {
        return c.getChangeType() + " | " + c.getSectionName() + " P" + c.getPeriodNumber()
                + " | " + c.getStartDate() + (c.getEndDate().equals(c.getStartDate()) ? "" : ".." + c.getEndDate())
                + (!str(c.getUpdatedSubjectName()).isEmpty() ? " | Sub: " + c.getUpdatedSubjectName() : "")
                + (!str(c.getReplacementFacultyName()).isEmpty() ? " | Staff: " + c.getReplacementFacultyName() : "")
                + (!str(c.getUpdatedVenueName()).isEmpty() ? " | Room: " + c.getUpdatedVenueName() : "");
    }

    private record DateRange(LocalDate start, LocalDate end) {}

    private List<DateRange> resolveDateRanges(Map<String, Object> req) {
        List<DateRange> ranges = new ArrayList<>();
        Object datesObj = req.get("dates");
        if (datesObj instanceof List<?> list && !list.isEmpty()) {
            for (Object o : list) {
                LocalDate d = parseDate(o);
                if (d != null) ranges.add(new DateRange(d, d));
            }
            if (!ranges.isEmpty()) return ranges;
        }
        LocalDate start = parseDate(req.get("startDate") != null ? req.get("startDate") : req.get("changeDate"));
        LocalDate end = parseDate(req.get("endDate") != null ? req.get("endDate") : start);
        if (start != null) {
            if (end == null) end = start;
            if (end.isBefore(start)) throw new IllegalArgumentException("End date cannot be before start date.");
            ranges.add(new DateRange(start, end));
        }
        return ranges;
    }

    private List<Section> resolveTargetSections(Map<String, Object> req) {
        List<Section> sections = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        Object idsObj = req.get("sectionIds");
        if (idsObj instanceof List<?> list) {
            for (Object idO : list) {
                if (idO == null || String.valueOf(idO).isBlank()) continue;
                Long sid = Long.valueOf(idO.toString());
                if (seen.add(sid)) {
                    sectionRepository.findById(sid).ifPresent(sections::add);
                }
            }
        }
        if (req.get("sectionId") != null && !String.valueOf(req.get("sectionId")).isBlank()) {
            Long sid = Long.valueOf(req.get("sectionId").toString());
            if (seen.add(sid)) sectionRepository.findById(sid).ifPresent(sections::add);
        }
        String secName = str(req.get("sectionName"));
        if (sections.isEmpty() && !secName.isEmpty()) {
            sectionRepository.findAll().stream()
                    .filter(s -> s.getSectionName().equalsIgnoreCase(secName))
                    .findFirst().ifPresent(sections::add);
        }
        return sections;
    }

    private TimetableEntry findPermanentSlot(Long sectionId, String dayName, int periodNumber, Integer semester) {
        return timetableRepository.findBySectionId(sectionId).stream()
                .filter(e -> semester == null || Objects.equals(e.getSemester(), semester))
                .filter(e -> dayName.equalsIgnoreCase(e.getDay()))
                .filter(e -> e.getTimeSlot() != null && Objects.equals(e.getTimeSlot().getSlotNumber(), periodNumber))
                .findFirst().orElse(null);
    }

    private String resolvePermFacultyName(TimetableEntry e) {
        if (e.getAssignedFaculty() != null && !e.getAssignedFaculty().isBlank()) return e.getAssignedFaculty().trim();
        if (e.getTeacher() != null) return teacherDisplayName(e.getTeacher());
        return "-";
    }

    private String resolvePermVenueName(TimetableEntry e) {
        if (e.getAssignedVenue() != null && !e.getAssignedVenue().isBlank()) return e.getAssignedVenue().trim();
        if (e.getClassroom() != null) return str(e.getClassroom().getRoomNumber());
        if (e.getLaboratory() != null) return str(e.getLaboratory().getLabName());
        return "-";
    }

    private Teacher findTeacherByName(String rawName) {
        String norm = normalizeName(rawName);
        if (norm.isEmpty()) return null;
        return teacherRepository.findAll().stream()
                .filter(t -> normalizeName(teacherDisplayName(t)).equals(norm))
                .findFirst().orElse(null);
    }

    private String teacherDisplayName(Teacher t) {
        if (t == null) return "";
        if (t.getDisplayName() != null && !t.getDisplayName().isBlank()) return t.getDisplayName().trim();
        return (str(t.getFirstName()) + " " + str(t.getLastName())).trim();
    }

    private TemporaryChangeType parseChangeType(Object raw) {
        if (raw == null || String.valueOf(raw).isBlank()) return TemporaryChangeType.SUBJECT_CHANGE;
        return TemporaryChangeType.valueOf(String.valueOf(raw).trim().toUpperCase());
    }

    private Integer parsePeriod(Object raw) {
        if (raw == null || String.valueOf(raw).isBlank()) throw new IllegalArgumentException("Period number is required.");
        int p = Integer.parseInt(String.valueOf(raw).trim());
        if (p < 1 || p > 10) throw new IllegalArgumentException("Period number must be between 1 and 10.");
        return p;
    }

    private LocalDate parseDate(Object raw) {
        if (raw == null) return null;
        String s = String.valueOf(raw).trim();
        if (s.isEmpty()) return null;
        return LocalDate.parse(s);
    }

    private Subject resolveSubject(Object idObj) {
        if (idObj == null || String.valueOf(idObj).isBlank()) return null;
        return subjectRepository.findById(Long.valueOf(idObj.toString())).orElse(null);
    }

    private Teacher resolveTeacher(Object idObj) {
        if (idObj == null || String.valueOf(idObj).isBlank()) return null;
        return teacherRepository.findById(Long.valueOf(idObj.toString())).orElse(null);
    }

    private Classroom resolveClassroom(Object idObj) {
        if (idObj == null || String.valueOf(idObj).isBlank()) return null;
        return classroomRepository.findById(Long.valueOf(idObj.toString())).orElse(null);
    }

    private String toDayName(LocalDate d) {
        return d.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }

    private String romanYearForSection(Section s) {
        String[] r = {"", "I Year", "II Year", "III Year", "IV Year"};
        if (s.getYear() != null && s.getYear() >= 1 && s.getYear() <= 4) return r[s.getYear()];
        return s.getSemester() != null && s.getSemester() >= 1 && s.getSemester() <= 8 ? r[(s.getSemester() + 1) / 2] : "II Year";
    }

    private String[] defaultSlotTimes(int period) {
        for (TimeSlot ts : timeSlotRepository.findAll()) {
            if (Objects.equals(ts.getSlotNumber(), period)) {
                return new String[]{str(ts.getStartTime()), str(ts.getEndTime())};
            }
        }
        return switch (period) {
            case 1 -> new String[]{"08:40", "09:40"};
            case 2 -> new String[]{"09:40", "10:40"};
            case 3 -> new String[]{"11:00", "12:00"};
            case 4 -> new String[]{"12:00", "13:00"};
            case 5 -> new String[]{"13:40", "14:30"};
            case 6 -> new String[]{"14:30", "15:20"};
            case 7 -> new String[]{"15:20", "16:10"};
            default -> new String[]{"16:15", "17:05"};
        };
    }

    private String normalizeName(String v) {
        return str(v).replaceAll("\\s+", " ").toLowerCase();
    }

    private String normalizeVenue(String v) {
        String c = str(v).toUpperCase();
        if (c.isEmpty() || "-".equals(c) || "TBA".equals(c) || "FREE".equals(c) || "ONLINE".equals(c)) return "";
        return c.replaceAll("\\s+", " ");
    }

    private String str(Object o) {
        return o == null ? "" : String.valueOf(o).trim();
    }
}
