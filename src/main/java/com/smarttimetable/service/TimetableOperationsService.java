package com.smarttimetable.service;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class TimetableOperationsService {

    @Autowired
    private TimetableOverrideRepository overrideRepo;
    @Autowired
    private SubstitutionRepository substitutionRepo;
    @Autowired
    private CoverageRequestRepository coverageRepo;
    @Autowired
    private CustomSubjectRepository subjectRepo;
    @Autowired
    private CustomVenueRepository venueRepo;
    @Autowired
    private PeriodNotificationRepository notificationRepo;
    @Autowired
    private FacultyTimetableRepository facultyTimetableRepo;
    @Autowired
    private SubjectRepository coreSubjectRepo;
    @Autowired
    private TeacherRepository teacherRepo;
    @Autowired
    private ClassroomRepository classroomRepo;
    @Autowired
    private LaboratoryRepository laboratoryRepo;
    @Autowired
    private DepartmentRepository departmentRepo;
    @Autowired
    private SectionRepository sectionRepo;
    @Autowired
    private TimetableRepository timetableRepo;
    @Autowired
    private FacultyTimetableSyncService facultyTimetableSyncService;

    // Overrides
    public List<TimetableOverride> getAllOverrides() {
        return overrideRepo.findAll();
    }

    public TimetableOverride saveOverride(TimetableOverride override) {
        return overrideRepo.save(override);
    }

    public void deleteOverride(Long id) {
        overrideRepo.deleteById(id);
    }

    public void deleteAllOverrides() {
        overrideRepo.deleteAll();
    }

    // Substitutions
    public List<Substitution> getAllSubstitutions() {
        return substitutionRepo.findAll();
    }

    public Substitution saveSubstitution(Substitution sub) {
        return substitutionRepo.save(sub);
    }

    public void deleteSubstitution(Long id) {
        substitutionRepo.deleteById(id);
    }

    // Coverage Requests
    public List<CoverageRequest> getAllCoverageRequests() {
        return coverageRepo.findAll();
    }

    public CoverageRequest saveCoverageRequest(CoverageRequest req) {
        return coverageRepo.save(req);
    }

    public void deleteCoverageRequest(Long id) {
        coverageRepo.deleteById(id);
    }

    // Custom Subjects
    public List<CustomSubject> getAllCustomSubjects() {
        return subjectRepo.findAll();
    }

    public CustomSubject saveCustomSubject(CustomSubject sub) {
        return subjectRepo.save(sub);
    }

    public void deleteCustomSubject(Long id) {
        subjectRepo.deleteById(id);
    }

    // Custom Venues
    public List<CustomVenue> getAllCustomVenues() {
        return venueRepo.findAll();
    }

    public CustomVenue saveCustomVenue(CustomVenue venue) {
        return venueRepo.save(venue);
    }

    public void deleteCustomVenue(Long id) {
        venueRepo.deleteById(id);
    }

    // Period Notifications
    public List<PeriodNotification> getAllPeriodNotifications() {
        return notificationRepo.findAll();
    }

    public PeriodNotification savePeriodNotification(PeriodNotification notif) {
        return notificationRepo.save(notif);
    }

    public void deletePeriodNotification(Long id) {
        notificationRepo.deleteById(id);
    }

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

    private String toRomanYear(Section section, String[] tokens) {
        String[] romans = { "", "I", "II", "III", "IV" };
        if (section.getYear() != null && section.getYear() >= 1 && section.getYear() <= 4) {
            return romans[section.getYear()];
        }
        if (tokens.length > 0 && tokens[0].matches("(?i)^(I|II|III|IV)$")) {
            return tokens[0].toUpperCase();
        }
        if (section.getSemester() != null && section.getSemester() >= 1 && section.getSemester() <= 8) {
            return romans[(section.getSemester() + 1) / 2];
        }
        return "II";
    }

    private void addVenueIfPresent(Map<String, Map<String, Object>> venues, String rawName, String building,
            String type) {
        if (rawName == null)
            return;
        String clean = rawName.trim();
        if (clean.isEmpty() || clean.equals("-") || clean.equalsIgnoreCase("TBA") || clean.equalsIgnoreCase("FREE"))
            return;
        String key = clean.toUpperCase();
        Map<String, Object> item = venues.computeIfAbsent(key, k -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", clean);
            m.put("building", building != null ? building.trim() : "");
            m.put("type", type != null ? type.trim() : "");
            return m;
        });
        if ("".equals(item.get("building")) && building != null && !building.trim().isEmpty()) {
            item.put("building", building.trim());
        }
        if ("".equals(item.get("type")) && type != null && !type.trim().isEmpty()) {
            item.put("type", type.trim());
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getLiveSuggestions() {
        Map<String, Map<String, Object>> subjectMap = new LinkedHashMap<>();
        Map<String, Map<String, Object>> staffMap = new LinkedHashMap<>();
        Map<String, Map<String, Object>> venueMap = new LinkedHashMap<>();
        Map<String, Map<String, Object>> deptMap = new LinkedHashMap<>();
        List<Map<String, Object>> sectionsList = new ArrayList<>();

        for (CustomSubject cs : subjectRepo.findAll()) {
            String label = cs.getShortName() != null && !cs.getShortName().isBlank() ? cs.getShortName().trim()
                    : (cs.getSubjectCode() != null ? cs.getSubjectCode().trim() : "");
            if (!label.isEmpty()) {
                Map<String, Object> m = subjectMap.computeIfAbsent(label.toUpperCase(), k -> new LinkedHashMap<>());
                m.put("label", label);
                m.put("code", cs.getSubjectCode() != null ? cs.getSubjectCode().trim() : label);
                m.put("title", cs.getTitle() != null ? cs.getTitle().trim() : "");
                m.put("faculty", cs.getFaculty() != null ? cs.getFaculty().trim() : "");
                m.put("venue", cs.getVenue() != null ? cs.getVenue().trim() : "");
                m.put("dept", "");
            }
            addVenueIfPresent(venueMap, cs.getVenue(), "", "Custom");
        }

        for (Subject s : coreSubjectRepo.findAll()) {
            String rawLabel = (s.getSubjectName() != null && !s.getSubjectName().isBlank())
                    ? s.getSubjectName().trim()
                    : (s.getSubjectCode() != null ? s.getSubjectCode().trim() : "");
            if (rawLabel.isEmpty() || rawLabel.equalsIgnoreCase("FREE"))
                continue;
            String deptCode = (s.getDepartment() != null && s.getDepartment().getCode() != null)
                    ? s.getDepartment().getCode().trim().toUpperCase()
                    : "";
            String facultyName = "";
            if (s.getAssignedTeacher() != null) {
                Teacher t = s.getAssignedTeacher();
                facultyName = (t.getDisplayName() != null && !t.getDisplayName().isBlank())
                        ? t.getDisplayName().trim()
                        : ((t.getFirstName() != null ? t.getFirstName() : "") + " "
                                + (t.getLastName() != null ? t.getLastName() : "")).trim();
            }
            Map<String, Object> m = subjectMap.computeIfAbsent(rawLabel.toUpperCase(), k -> new LinkedHashMap<>());
            m.putIfAbsent("label", rawLabel);
            m.put("code", s.getSubjectCode() != null ? s.getSubjectCode().trim() : m.getOrDefault("code", rawLabel));
            m.putIfAbsent("title", s.getSubjectName() != null ? s.getSubjectName().trim() : "");
            if ("".equals(m.getOrDefault("faculty", "")) && !facultyName.isEmpty())
                m.put("faculty", facultyName);
            m.putIfAbsent("venue", "");
            if ("".equals(m.getOrDefault("dept", "")) && !deptCode.isEmpty())
                m.put("dept", deptCode);
        }

        for (Teacher t : teacherRepo.findAll()) {
            String disp = (t.getDisplayName() != null && !t.getDisplayName().isBlank())
                    ? t.getDisplayName().trim()
                    : ((t.getFirstName() != null ? t.getFirstName() : "") + " "
                            + (t.getLastName() != null ? t.getLastName() : "")).trim();
            if (disp.isEmpty())
                continue;
            String deptCode = (t.getDepartment() != null && t.getDepartment().getCode() != null)
                    ? t.getDepartment().getCode().trim().toUpperCase()
                    : "";
            Map<String, Object> m = staffMap.computeIfAbsent(disp.toUpperCase(), k -> new LinkedHashMap<>());
            m.put("label", disp);
            m.put("employeeId", t.getEmployeeId() != null ? t.getEmployeeId().trim() : "");
            m.put("dept", deptCode);
            m.put("subjectHandling", t.getSubjectHandling() != null ? t.getSubjectHandling().trim() : "");
        }

        for (Classroom c : classroomRepo.findAll()) {
            addVenueIfPresent(venueMap, c.getRoomNumber(), c.getBuilding(),
                    c.getRoomType() != null ? c.getRoomType() : "THEORY");
        }
        for (Laboratory l : laboratoryRepo.findAll()) {
            addVenueIfPresent(venueMap, l.getLabName(), l.getBuilding(),
                    l.getLabType() != null ? l.getLabType() : "LAB");
        }
        for (CustomVenue cv : venueRepo.findAll()) {
            addVenueIfPresent(venueMap, cv.getName(), "", "Custom");
        }

        for (TimetableEntry entry : timetableRepo.findAll()) {
            String fac = entry.getAssignedFaculty() != null ? entry.getAssignedFaculty().trim() : "";
            if (fac.isEmpty() && entry.getTeacher() != null) {
                Teacher t = entry.getTeacher();
                fac = (t.getDisplayName() != null && !t.getDisplayName().isBlank())
                        ? t.getDisplayName().trim()
                        : ((t.getFirstName() != null ? t.getFirstName() : "") + " "
                                + (t.getLastName() != null ? t.getLastName() : "")).trim();
            }
            if (!fac.isEmpty() && !fac.equals("-") && !fac.equalsIgnoreCase("TBA")) {
                final String facName = fac;
                staffMap.computeIfAbsent(fac.toUpperCase(), k -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("label", facName);
                    m.put("employeeId", "");
                    m.put("dept", "");
                    m.put("subjectHandling", "");
                    return m;
                });
            }
            String venue = entry.getAssignedVenue() != null ? entry.getAssignedVenue().trim() : "";
            if (venue.isEmpty() && entry.getClassroom() != null)
                venue = entry.getClassroom().getRoomNumber();
            if ((venue == null || venue.isEmpty()) && entry.getLaboratory() != null)
                venue = entry.getLaboratory().getLabName();
            addVenueIfPresent(venueMap, venue, "", "Assigned");

            if (entry.getSubject() != null && entry.getSubject().getSubjectName() != null) {
                String subLabel = entry.getSubject().getSubjectName().trim();
                if (!subLabel.isEmpty() && !subLabel.equalsIgnoreCase("FREE")) {
                    Map<String, Object> sm = subjectMap.get(subLabel.toUpperCase());
                    if (sm != null) {
                        if ("".equals(sm.getOrDefault("faculty", "")) && !fac.isEmpty() && !"-".equals(fac))
                            sm.put("faculty", fac);
                        if ("".equals(sm.getOrDefault("venue", "")) && venue != null && !venue.isEmpty()
                                && !"TBA".equalsIgnoreCase(venue))
                            sm.put("venue", venue);
                    }
                }
            }
        }

        for (Department d : departmentRepo.findAll()) {
            String code = d.getCode() != null ? d.getCode().trim().toUpperCase() : "";
            if (code.isEmpty())
                continue;
            Map<String, Object> m = deptMap.computeIfAbsent(code, k -> new LinkedHashMap<>());
            m.put("code", code);
            m.put("name", d.getName() != null ? d.getName().trim() : code);
        }

        Set<String> seenSecNames = new LinkedHashSet<>();
        for (Section s : sectionRepo.findAll()) {
            String secName = s.getSectionName() != null ? s.getSectionName().trim() : "";
            if (secName.isEmpty() || secName.matches("^\\d+\\s+CSE\\s+II\\s+CSE.*"))
                continue;
            if (!seenSecNames.add(secName.toUpperCase()))
                continue;

            String[] tokens = secName.split("\\s+");
            String dept = (s.getCourse() != null && s.getCourse().getDepartment() != null
                    && s.getCourse().getDepartment().getCode() != null)
                            ? s.getCourse().getDepartment().getCode().trim().toUpperCase()
                            : (tokens.length >= 2 ? tokens[1].toUpperCase() : "CSE");
            String year = toRomanYear(s, tokens);
            String secCode = (s.getSectionIdentifier() != null && !s.getSectionIdentifier().isBlank())
                    ? s.getSectionIdentifier().trim().toUpperCase()
                    : (tokens.length >= 3 ? String.join(" ", Arrays.copyOfRange(tokens, 2, tokens.length)).toUpperCase()
                            : secName);

            deptMap.computeIfAbsent(dept, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", dept);
                m.put("name", dept);
                return m;
            });

            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("id", s.getId());
            sm.put("sectionName", secName);
            sm.put("dept", dept);
            sm.put("year", year);
            sm.put("sectionCode", secCode);
            sm.put("semester", s.getSemester());
            sectionsList.add(sm);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("subjects", new ArrayList<>(subjectMap.values()));
        result.put("staff", new ArrayList<>(staffMap.values()));
        result.put("venues", new ArrayList<>(venueMap.values()));
        result.put("departments", new ArrayList<>(deptMap.values()));
        result.put("sections", sectionsList);
        result.put("assignments", facultyTimetableSyncService.getActiveFacultyAssignments());
        return result;
    }
}
