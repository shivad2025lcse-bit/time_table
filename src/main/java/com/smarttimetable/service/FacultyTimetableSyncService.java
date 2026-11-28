package com.smarttimetable.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarttimetable.entity.FacultyTimetable;
import com.smarttimetable.entity.Section;
import com.smarttimetable.entity.Teacher;
import com.smarttimetable.entity.TimetableEntry;
import com.smarttimetable.repository.FacultyTimetableRepository;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.TimetableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class FacultyTimetableSyncService {

    private static final Logger log = LoggerFactory.getLogger(FacultyTimetableSyncService.class);
    private static final List<String> VALID_DAYS = List.of(
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    );
    private static final Pattern TITLE_PREFIX = Pattern.compile(
            "(?i)^(?:dr|mr|mrs|ms|miss|prof|smt|sri)\\.?\\s*"
    );

    @Autowired
    private TimetableRepository timetableRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private FacultyTimetableRepository facultyTimetableRepository;

    @Autowired(required = false)
    private ObjectMapper objectMapper;

    private ObjectMapper mapper() {
        return objectMapper != null ? objectMapper : new ObjectMapper();
    }

    /**
     * Backfill all existing Faculty Timetables from all persisted Student/Class Timetables on startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void syncExistingTimetablesOnStartup() {
        try {
            Map<String, Object> summary = syncAllFacultyTimetablesFromStudentTimetables();
            log.info("Startup Faculty TT sync completed: {}", summary);
        } catch (Exception ex) {
            log.warn("Startup Faculty TT sync failed: {}", ex.getMessage());
        }
    }

    /**
     * Rebuilds auto-synced slots in every faculty member's persisted FacultyTimetable
     * from the current active-semester Student/Class Timetable entries while preserving manual slots.
     */
    @Transactional
    public Map<String, Object> syncAllFacultyTimetablesFromStudentTimetables() {
        List<Teacher> allTeachers = teacherRepository.findAll();
        List<TimetableEntry> allEntries = timetableRepository.findAll();

        List<TimetableEntry> activeEntries = filterActiveSemesterEntries(allEntries);

        // username -> Day -> PeriodKey -> distinct formatted class strings
        Map<String, Map<String, Map<String, Set<String>>>> desiredByUser = new LinkedHashMap<>();

        int matchedEntries = 0;
        for (TimetableEntry entry : activeEntries) {
            String day = normalizeDay(entry.getDay());
            Integer slotNum = entry.getTimeSlot() != null ? entry.getTimeSlot().getSlotNumber() : null;
            if (day == null || slotNum == null || slotNum < 1 || entry.getSubject() == null) {
                continue;
            }
            String subText = firstNonBlank(entry.getSubject().getSubjectName(), entry.getSubject().getSubjectCode(), "");
            if (subText.isEmpty() || subText.equalsIgnoreCase("FREE") || subText.equals("-")) {
                continue;
            }
            String secText = (entry.getSection() != null && entry.getSection().getSectionName() != null)
                    ? entry.getSection().getSectionName().trim() : "";
            String venueText = resolveVenueText(entry);
            String cellValue = joinNonBlank(", ", subText, secText, venueText);
            if (cellValue.isEmpty()) {
                continue;
            }

            List<Teacher> assignedTeachers = resolveTeachersForEntry(entry, allTeachers);
            if (assignedTeachers.isEmpty()) {
                continue;
            }

            String pKey = "P" + slotNum;
            matchedEntries++;
            for (Teacher t : assignedTeachers) {
                String uname = resolveCanonicalUsername(t);
                if (uname == null) {
                    continue;
                }
                desiredByUser
                        .computeIfAbsent(uname, k -> new LinkedHashMap<>())
                        .computeIfAbsent(day, k -> new LinkedHashMap<>())
                        .computeIfAbsent(pKey, k -> new LinkedHashSet<>())
                        .add(cellValue);
            }
        }

        Map<String, FacultyTimetable> existingByUser = new LinkedHashMap<>();
        for (FacultyTimetable ft : facultyTimetableRepository.findAll()) {
            if (ft.getUsername() != null && !ft.getUsername().isBlank()) {
                existingByUser.put(ft.getUsername().trim().toLowerCase(Locale.ROOT), ft);
            }
        }

        Set<String> allTargetUsers = new LinkedHashSet<>(existingByUser.keySet());
        allTargetUsers.addAll(desiredByUser.keySet());

        int updatedCount = 0;
        int syncedSlotsCount = 0;
        ObjectMapper jsonMapper = mapper();

        for (String uname : allTargetUsers) {
            FacultyTimetable existingFt = existingByUser.get(uname);
            Map<String, Map<String, Set<String>>> desiredForUser = desiredByUser.getOrDefault(uname, Collections.emptyMap());
            if (existingFt == null && desiredForUser.isEmpty()) {
                continue;
            }

            Map<String, Object> root = parseJsonMap(existingFt != null ? existingFt.getDataJson() : null, jsonMapper);
            Map<String, String> prevAutoSynced = extractAutoSyncedMap(root.get("_autoSynced"));
            Map<String, String> nextAutoSynced = new LinkedHashMap<>();

            boolean changed = (existingFt == null);

            // 1. Remove previously auto-synced slots that are no longer assigned in Student TT
            for (Map.Entry<String, String> prev : prevAutoSynced.entrySet()) {
                String slotKey = prev.getKey();
                int dot = slotKey.indexOf('.');
                if (dot <= 0 || dot >= slotKey.length() - 1) {
                    continue;
                }
                String dayName = slotKey.substring(0, dot);
                String pKey = slotKey.substring(dot + 1);

                boolean stillAssigned = desiredForUser.containsKey(dayName)
                        && desiredForUser.get(dayName).containsKey(pKey);
                if (!stillAssigned) {
                    Object dayObj = root.get(dayName);
                    if (dayObj instanceof Map<?, ?> rawDayMap) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> dayMap = (Map<String, Object>) rawDayMap;
                        Object currentVal = dayMap.get(pKey);
                        String currentStr = currentVal != null ? String.valueOf(currentVal).trim() : "";
                        String prevStr = prev.getValue() != null ? prev.getValue().trim() : "";
                        if (currentStr.equals(prevStr) || currentStr.isEmpty()) {
                            dayMap.put(pKey, "");
                            changed = true;
                        }
                    }
                }
            }

            // 2. Apply all active Student TT assignments for this faculty
            for (Map.Entry<String, Map<String, Set<String>>> dayEntry : desiredForUser.entrySet()) {
                String dayName = dayEntry.getKey();
                @SuppressWarnings("unchecked")
                Map<String, Object> dayMap = (root.get(dayName) instanceof Map<?, ?>)
                        ? (Map<String, Object>) root.get(dayName)
                        : new LinkedHashMap<>();
                root.put(dayName, dayMap);

                for (Map.Entry<String, Set<String>> periodEntry : dayEntry.getValue().entrySet()) {
                    String pKey = periodEntry.getKey();
                    String desiredVal = String.join(" | ", periodEntry.getValue());
                    Object existingObj = dayMap.get(pKey);
                    String existingVal = existingObj != null ? String.valueOf(existingObj).trim() : "";

                    if (!desiredVal.equals(existingVal)) {
                        dayMap.put(pKey, desiredVal);
                        changed = true;
                    }
                    nextAutoSynced.put(dayName + "." + pKey, desiredVal);
                    syncedSlotsCount++;
                }
            }

            if (nextAutoSynced.isEmpty()) {
                if (root.remove("_autoSynced") != null) {
                    changed = true;
                }
            } else if (!nextAutoSynced.equals(prevAutoSynced)) {
                root.put("_autoSynced", nextAutoSynced);
                changed = true;
            }

            if (changed) {
                FacultyTimetable target = existingFt != null ? existingFt : new FacultyTimetable();
                target.setUsername(uname);
                try {
                    target.setDataJson(jsonMapper.writeValueAsString(root));
                } catch (Exception ex) {
                    log.warn("Failed serializing FacultyTimetable for {}: {}", uname, ex.getMessage());
                    continue;
                }
                target.setUpdatedBy("student-tt-sync");
                target.setUpdatedAt(LocalDateTime.now());
                facultyTimetableRepository.save(target);
                updatedCount++;
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("facultyUpdated", updatedCount);
        summary.put("syncedSlots", syncedSlotsCount);
        summary.put("matchedEntries", matchedEntries);
        return summary;
    }

    public static class FacultyConflictException extends RuntimeException {
        private final List<Map<String, Object>> conflicts;

        public FacultyConflictException(List<Map<String, Object>> conflicts) {
            super(buildSummaryMessage(conflicts));
            this.conflicts = conflicts != null ? conflicts : Collections.emptyList();
        }

        public List<Map<String, Object>> getConflicts() {
            return conflicts;
        }

        private static String buildSummaryMessage(List<Map<String, Object>> conflicts) {
            if (conflicts == null || conflicts.isEmpty()) {
                return "Faculty is already assigned to another class for this period.";
            }
            Object firstMsg = conflicts.get(0).get("message");
            if (conflicts.size() == 1) {
                return String.valueOf(firstMsg);
            }
            return firstMsg + " (and " + (conflicts.size() - 1) + " more conflict(s))";
        }
    }

    /**
     * Returns all active-semester faculty class assignments across all sections for UI conflict hints.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActiveFacultyAssignments() {
        List<Teacher> allTeachers = teacherRepository.findAll();
        List<TimetableEntry> activeEntries = filterActiveSemesterEntries(timetableRepository.findAll());
        List<Map<String, Object>> result = new ArrayList<>();

        for (TimetableEntry entry : activeEntries) {
            String day = normalizeDay(entry.getDay());
            Integer slotNum = entry.getTimeSlot() != null ? entry.getTimeSlot().getSlotNumber() : null;
            if (day == null || slotNum == null || entry.getSection() == null || entry.getSubject() == null) {
                continue;
            }
            String subText = firstNonBlank(entry.getSubject().getSubjectName(), entry.getSubject().getSubjectCode(), "");
            if (subText.isEmpty() || subText.equalsIgnoreCase("FREE") || subText.equals("-")) {
                continue;
            }
            String secName = entry.getSection().getSectionName() != null ? entry.getSection().getSectionName().trim() : "";
            String venue = resolveVenueText(entry);
            List<Teacher> owners = resolveTeachersForEntry(entry, allTeachers);
            for (Teacher t : owners) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("teacherId", t.getId());
                item.put("teacherUsername", resolveCanonicalUsername(t));
                item.put("teacherEmployeeId", t.getEmployeeId() != null ? t.getEmployeeId() : "");
                item.put("teacherName", t.getName());
                item.put("teacherDisplayName", (t.getDisplayName() != null && !t.getDisplayName().isBlank()) ? t.getDisplayName().trim() : t.getName());
                item.put("facultyText", entry.getAssignedFaculty() != null ? entry.getAssignedFaculty() : "");
                item.put("sectionName", secName);
                item.put("subjectName", subText);
                item.put("venue", venue);
                item.put("day", day);
                item.put("slotNumber", slotNum);
                item.put("period", "P" + slotNum);
                result.add(item);
            }
        }
        return result;
    }

    /**
     * Checks whether any cell in gridData assigns a faculty member who is already assigned
     * to another class/section on the same day and period.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findGridFacultyConflicts(
            String targetSectionName,
            Integer targetSemester,
            Map<String, Map<String, String>> gridData) {
        if (gridData == null || gridData.isEmpty()) {
            return Collections.emptyList();
        }
        String cleanTarget = targetSectionName != null ? targetSectionName.trim() : "";
        List<Teacher> allTeachers = teacherRepository.findAll();
        List<TimetableEntry> activeEntries = filterActiveSemesterEntries(timetableRepository.findAll());

        // (teacherId + "|" + day + "|" + slotNumber) -> existing entry info
        Map<String, TimetableEntry> occupiedByTeacherSlot = new LinkedHashMap<>();
        for (TimetableEntry existing : activeEntries) {
            String secName = (existing.getSection() != null && existing.getSection().getSectionName() != null)
                    ? existing.getSection().getSectionName().trim() : "";
            if (!cleanTarget.isEmpty() && secName.equalsIgnoreCase(cleanTarget)) {
                continue;
            }
            String day = normalizeDay(existing.getDay());
            Integer slotNum = existing.getTimeSlot() != null ? existing.getTimeSlot().getSlotNumber() : null;
            if (day == null || slotNum == null) continue;
            for (Teacher owner : resolveTeachersForEntry(existing, allTeachers)) {
                if (owner.getId() != null) {
                    occupiedByTeacherSlot.putIfAbsent(owner.getId() + "|" + day + "|" + slotNum, existing);
                }
            }
        }

        List<Map<String, Object>> conflicts = new ArrayList<>();
        Set<String> dedupeKeys = new HashSet<>();

        for (Map.Entry<String, Map<String, String>> dayEntry : gridData.entrySet()) {
            String day = normalizeDay(dayEntry.getKey());
            Map<String, String> periods = dayEntry.getValue();
            if (day == null || periods == null) continue;

            for (int p = 1; p <= 7; p++) {
                String cellVal = periods.get("P" + p);
                if (cellVal == null || cellVal.trim().isEmpty()) continue;
                String[] parts = cellVal.split(",");
                String subText = parts.length > 0 ? parts[0].trim() : "";
                String facText = parts.length > 1 ? parts[1].trim() : "";
                if (subText.isEmpty() || subText.equalsIgnoreCase("FREE") || facText.isEmpty()) continue;

                List<Teacher> requestedTeachers = matchTeachers(facText, allTeachers);
                for (Teacher reqTeacher : requestedTeachers) {
                    if (reqTeacher.getId() == null) continue;
                    TimetableEntry existing = occupiedByTeacherSlot.get(reqTeacher.getId() + "|" + day + "|" + p);
                    if (existing != null) {
                        String conflictKey = reqTeacher.getId() + "|" + day + "|" + p;
                        if (dedupeKeys.add(conflictKey)) {
                            conflicts.add(buildConflictMap(reqTeacher, facText, day, p, existing));
                        }
                    }
                }
            }
        }
        return conflicts;
    }

    /**
     * Checks whether assigning targetTeacher on targetDay/slotNumber conflicts with another section.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findSingleEntryConflicts(TimetableEntry entry, Teacher targetTeacher, String targetDay) {
        if (entry == null || targetTeacher == null || targetTeacher.getId() == null || entry.getTimeSlot() == null) {
            return Collections.emptyList();
        }
        String day = normalizeDay(targetDay != null && !targetDay.isBlank() ? targetDay : entry.getDay());
        Integer slotNum = entry.getTimeSlot().getSlotNumber();
        if (day == null || slotNum == null) {
            return Collections.emptyList();
        }
        String ownSection = (entry.getSection() != null && entry.getSection().getSectionName() != null)
                ? entry.getSection().getSectionName().trim() : "";
        List<Teacher> allTeachers = teacherRepository.findAll();
        List<TimetableEntry> activeEntries = filterActiveSemesterEntries(timetableRepository.findAll());

        List<Map<String, Object>> conflicts = new ArrayList<>();
        for (TimetableEntry existing : activeEntries) {
            if (existing.getId() != null && existing.getId().equals(entry.getId())) continue;
            String existingSec = (existing.getSection() != null && existing.getSection().getSectionName() != null)
                    ? existing.getSection().getSectionName().trim() : "";
            if (!ownSection.isEmpty() && existingSec.equalsIgnoreCase(ownSection)) continue;
            if (!day.equalsIgnoreCase(normalizeDay(existing.getDay()))) continue;
            Integer exSlot = existing.getTimeSlot() != null ? existing.getTimeSlot().getSlotNumber() : null;
            if (!Objects.equals(slotNum, exSlot)) continue;

            for (Teacher owner : resolveTeachersForEntry(existing, allTeachers)) {
                if (owner.getId() != null && owner.getId().equals(targetTeacher.getId())) {
                    String facLabel = (targetTeacher.getDisplayName() != null && !targetTeacher.getDisplayName().isBlank())
                            ? targetTeacher.getDisplayName() : targetTeacher.getName();
                    conflicts.add(buildConflictMap(targetTeacher, facLabel, day, slotNum, existing));
                    break;
                }
            }
        }
        return conflicts;
    }

    private Map<String, Object> buildConflictMap(Teacher teacher, String requestedLabel, String day, int slotNum, TimetableEntry existing) {
        String teacherLabel = (teacher.getDisplayName() != null && !teacher.getDisplayName().isBlank())
                ? teacher.getDisplayName().trim()
                : (teacher.getName() != null && !teacher.getName().isBlank() ? teacher.getName().trim() : requestedLabel);
        String existingSec = (existing.getSection() != null && existing.getSection().getSectionName() != null)
                ? existing.getSection().getSectionName().trim() : "another class";
        String existingSub = existing.getSubject() != null
                ? firstNonBlank(existing.getSubject().getSubjectName(), existing.getSubject().getSubjectCode(), "")
                : "";
        String existingVenue = resolveVenueText(existing);
        String details = joinNonBlank(", ", existingSub, existingVenue);
        String message = teacherLabel + " is already assigned to " + existingSec
                + (details.isEmpty() ? "" : " (" + details + ")")
                + " on " + day + " Period " + slotNum + ".";

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("day", day);
        map.put("period", "P" + slotNum);
        map.put("slotNumber", slotNum);
        map.put("faculty", teacherLabel);
        map.put("teacherUsername", resolveCanonicalUsername(teacher));
        map.put("existingSection", existingSec);
        map.put("existingSubject", existingSub);
        map.put("existingVenue", existingVenue);
        map.put("message", message);
        return map;
    }

    /**
     * Resolves the best matching Teacher for a faculty string (used when persisting TimetableEntry or syncing).
     */
    public Teacher matchBestTeacher(String facText, List<Teacher> allTeachers) {
        List<Teacher> matched = matchTeachers(facText, allTeachers);
        return matched.isEmpty() ? null : matched.get(0);
    }

    /**
     * Resolves one or more Teachers from a faculty string (supports multiple faculty separated by '/' or '&').
     */
    public List<Teacher> matchTeachers(String facText, List<Teacher> allTeachers) {
        if (facText == null || facText.trim().isEmpty() || allTeachers == null || allTeachers.isEmpty()) {
            return Collections.emptyList();
        }
        String raw = facText.trim();
        if (raw.equals("-") || raw.equalsIgnoreCase("FREE") || raw.equalsIgnoreCase("TBA")) {
            return Collections.emptyList();
        }

        String[] segments = raw.split("[/&+]");
        List<Teacher> matched = new ArrayList<>();
        Set<Long> seenTeacherIds = new HashSet<>();

        for (String seg : segments) {
            Teacher t = matchSingleTeacher(seg, allTeachers);
            if (t != null && (t.getId() == null || seenTeacherIds.add(t.getId()))) {
                matched.add(t);
            }
        }
        if (matched.isEmpty() && segments.length > 1) {
            Teacher whole = matchSingleTeacher(raw, allTeachers);
            if (whole != null) {
                matched.add(whole);
            }
        }
        return matched;
    }

    private Teacher matchSingleTeacher(String facText, List<Teacher> allTeachers) {
        if (facText == null) return null;
        String cleaned = facText.trim();
        int commaIdx = cleaned.indexOf(',');
        if (commaIdx > 0) {
            cleaned = cleaned.substring(0, commaIdx).trim();
        }
        if (cleaned.isEmpty() || cleaned.equals("-")) return null;

        String lowerRaw = cleaned.toLowerCase(Locale.ROOT);
        Teacher best = null;
        int bestScore = 0;

        for (Teacher t : allTeachers) {
            int score = scoreTeacherMatch(lowerRaw, cleaned, t);
            if (score > bestScore) {
                bestScore = score;
                best = t;
            }
        }
        return bestScore > 0 ? best : null;
    }

    private int scoreTeacherMatch(String lowerRaw, String cleanedQuery, Teacher t) {
        if (t.getUser() != null && t.getUser().getUsername() != null
                && t.getUser().getUsername().trim().equalsIgnoreCase(lowerRaw)) {
            return 2000;
        }
        if (t.getEmployeeId() != null && t.getEmployeeId().trim().equalsIgnoreCase(lowerRaw)) {
            return 2000;
        }

        String qCompact = compactNameWithoutTitle(cleanedQuery);
        List<String> qTokens = nameTokensWithoutTitle(cleanedQuery);
        if (qTokens.isEmpty()) return 0;

        List<String> qLong = qTokens.stream().filter(tok -> tok.length() >= 2).toList();
        List<String> qInitials = qTokens.stream().filter(tok -> tok.length() == 1).toList();
        List<String> qSorted = new ArrayList<>(qTokens);
        Collections.sort(qSorted);
        String qLongJoined = String.join("", qLong);
        String qPhonetic = phoneticKey(qLongJoined);

        int best = 0;
        for (String cand : teacherCandidateNames(t)) {
            String cCompact = compactNameWithoutTitle(cand);
            List<String> cTokens = nameTokensWithoutTitle(cand);
            if (cTokens.isEmpty()) continue;

            if (!qCompact.isEmpty() && qCompact.equals(cCompact)) {
                best = Math.max(best, 1500);
                continue;
            }

            List<String> cSorted = new ArrayList<>(cTokens);
            Collections.sort(cSorted);
            if (qSorted.equals(cSorted)) {
                best = Math.max(best, 1300);
                continue;
            }

            List<String> cLong = cTokens.stream().filter(tok -> tok.length() >= 2).toList();
            List<String> cInitials = cTokens.stream().filter(tok -> tok.length() == 1).toList();
            String cLongJoined = String.join("", cLong);
            String cPhonetic = phoneticKey(cLongJoined);

            boolean initialsCompatible = qInitials.isEmpty() || cInitials.isEmpty()
                    || qInitials.stream().anyMatch(cInitials::contains);
            boolean initialsExact = !qInitials.isEmpty() && qInitials.equals(cInitials);
            boolean initialsConflict = !qInitials.isEmpty() && !cInitials.isEmpty()
                    && qInitials.stream().noneMatch(cInitials::contains);
            if (initialsConflict) {
                continue;
            }

            if (!qLongJoined.isEmpty() && qLongJoined.equals(cLongJoined)) {
                best = Math.max(best, initialsExact ? 1150 : 950);
                continue;
            }
            if (qPhonetic.length() >= 4 && qPhonetic.equals(cPhonetic)) {
                best = Math.max(best, initialsExact ? 1100 : 900);
                continue;
            }

            List<String> qMain = qTokens.stream().filter(tok -> tok.length() >= 3).toList();
            if (!qMain.isEmpty() && qMain.stream().allMatch(cTokens::contains) && initialsCompatible) {
                int s = 700 + (initialsExact ? 200 : 0) + qMain.size() * 20;
                best = Math.max(best, s);
                continue;
            }

            if (qPhonetic.length() >= 5 && (cPhonetic.contains(qPhonetic) || qPhonetic.contains(cPhonetic)) && initialsCompatible) {
                best = Math.max(best, 400);
            }
        }
        return best;
    }

    private String phoneticKey(String s) {
        if (s == null) return "";
        return s.toLowerCase(Locale.ROOT)
                .replace("ck", "k")
                .replace("ee", "i")
                .replace("oo", "u");
    }

    private List<Teacher> resolveTeachersForEntry(TimetableEntry entry, List<Teacher> allTeachers) {
        String assignedFac = entry.getAssignedFaculty();
        if (assignedFac != null && !assignedFac.trim().isEmpty()) {
            return matchTeachers(assignedFac, allTeachers);
        }
        if (entry.getTeacher() != null) {
            return List.of(entry.getTeacher());
        }
        return Collections.emptyList();
    }

    private List<TimetableEntry> filterActiveSemesterEntries(List<TimetableEntry> allEntries) {
        Map<Long, List<TimetableEntry>> bySection = new LinkedHashMap<>();
        List<TimetableEntry> noSection = new ArrayList<>();
        for (TimetableEntry e : allEntries) {
            if (e.getSection() != null && e.getSection().getId() != null) {
                bySection.computeIfAbsent(e.getSection().getId(), k -> new ArrayList<>()).add(e);
            } else {
                noSection.add(e);
            }
        }

        List<TimetableEntry> result = new ArrayList<>(noSection);
        for (List<TimetableEntry> secEntries : bySection.values()) {
            if (secEntries.isEmpty()) continue;
            Section sec = secEntries.get(0).getSection();
            Integer activeSem = sec.getSemester();

            if (activeSem != null) {
                List<TimetableEntry> matching = new ArrayList<>();
                for (TimetableEntry e : secEntries) {
                    if (e.getSemester() == null || Objects.equals(e.getSemester(), activeSem)) {
                        matching.add(e);
                    }
                }
                if (!matching.isEmpty()) {
                    result.addAll(matching);
                    continue;
                }
            }

            Integer maxSem = null;
            for (TimetableEntry e : secEntries) {
                if (e.getSemester() != null && (maxSem == null || e.getSemester() > maxSem)) {
                    maxSem = e.getSemester();
                }
            }
            for (TimetableEntry e : secEntries) {
                if (maxSem == null || e.getSemester() == null || Objects.equals(e.getSemester(), maxSem)) {
                    result.add(e);
                }
            }
        }
        return result;
    }

    private List<String> teacherCandidateNames(Teacher t) {
        List<String> names = new ArrayList<>(3);
        if (t.getDisplayName() != null && !t.getDisplayName().isBlank()) {
            String d = t.getDisplayName().trim();
            int comma = d.indexOf(',');
            names.add(comma > 0 ? d.substring(0, comma).trim() : d);
        }
        String full = ((t.getFirstName() != null ? t.getFirstName() : "") + " "
                + (t.getLastName() != null ? t.getLastName() : "")).trim();
        if (!full.isEmpty()) {
            names.add(full);
        }
        return names;
    }

    private String stripLeadingTitle(String input) {
        String s = input == null ? "" : input.trim();
        String prev;
        do {
            prev = s;
            s = TITLE_PREFIX.matcher(s).replaceFirst("").trim();
        } while (!s.equals(prev));
        return s;
    }

    private String compactNameWithoutTitle(String input) {
        return stripLeadingTitle(input)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
    }

    private List<String> nameTokensWithoutTitle(String input) {
        String s = stripLeadingTitle(input).toLowerCase(Locale.ROOT);
        String[] parts = s.split("[^a-z0-9]+");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            if (!p.isEmpty()) out.add(p);
        }
        return out;
    }

    private String resolveCanonicalUsername(Teacher t) {
        if (t == null) return null;
        if (t.getUser() != null && t.getUser().getUsername() != null && !t.getUser().getUsername().isBlank()) {
            return t.getUser().getUsername().trim().toLowerCase(Locale.ROOT);
        }
        if (t.getEmployeeId() != null && !t.getEmployeeId().isBlank()) {
            return t.getEmployeeId().trim().toLowerCase(Locale.ROOT);
        }
        return null;
    }

    private String resolveVenueText(TimetableEntry entry) {
        String v = firstNonBlank(
                entry.getAssignedVenue(),
                entry.getClassroom() != null ? entry.getClassroom().getRoomNumber() : null,
                entry.getLaboratory() != null ? entry.getLaboratory().getLabName() : null,
                ""
        );
        if (v.equals("-") || v.equalsIgnoreCase("FREE") || v.equalsIgnoreCase("TBA")) {
            return "";
        }
        return v;
    }

    private String normalizeDay(String rawDay) {
        if (rawDay == null) return null;
        String clean = rawDay.trim();
        for (String d : VALID_DAYS) {
            if (d.equalsIgnoreCase(clean)) {
                return d;
            }
        }
        return null;
    }

    private Map<String, Object> parseJsonMap(String dataJson, ObjectMapper jsonMapper) {
        if (dataJson == null || dataJson.trim().isEmpty() || dataJson.trim().equals("{}")) {
            return new LinkedHashMap<>();
        }
        try {
            Map<String, Object> map = jsonMapper.readValue(dataJson, new TypeReference<LinkedHashMap<String, Object>>() {});
            return map != null ? map : new LinkedHashMap<>();
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private Map<String, String> extractAutoSyncedMap(Object obj) {
        Map<String, String> out = new LinkedHashMap<>();
        if (obj instanceof Map<?, ?> raw) {
            for (Map.Entry<?, ?> e : raw.entrySet()) {
                if (e.getKey() != null && e.getValue() != null) {
                    out.put(String.valueOf(e.getKey()), String.valueOf(e.getValue()));
                }
            }
        }
        return out;
    }

    private static String firstNonBlank(String... candidates) {
        if (candidates == null) return "";
        for (String c : candidates) {
            if (c != null && !c.trim().isEmpty()) {
                return c.trim();
            }
        }
        return "";
    }

    private static String joinNonBlank(String sep, String... parts) {
        List<String> nonBlank = new ArrayList<>();
        for (String p : parts) {
            if (p != null && !p.trim().isEmpty()) {
                nonBlank.add(p.trim());
            }
        }
        return String.join(sep, nonBlank);
    }
}
