package com.smarttimetable.service;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class ExcelImportService {

    @Autowired
    private TimetableRepository timetableRepository;
    @Autowired
    private TimeSlotRepository timeSlotRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private TeacherRepository teacherRepository;
    @Autowired
    private SectionRepository sectionRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private ClassroomRepository classroomRepository;
    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> importTimetableExcel(MultipartFile file, String sectionName) throws Exception {
        Map<String, Object> response = new HashMap<>();
        
        if (file.isEmpty()) {
            throw new Exception("Excel file is empty");
        }
        
        Section section = sectionRepository.findBySectionName(sectionName).orElse(null);
        if (section == null) {
            // For now, if section is completely unknown, we will just use the first available section
            // as a fallback for the database relation, so we don't crash on foreign key constraints.
            List<Section> allSections = sectionRepository.findAll();
            if (!allSections.isEmpty()) section = allSections.get(0);
        }

        List<TimeSlot> slots = ensureTimeSlots();
        List<Subject> allSubjects = subjectRepository.findAll();
        List<Teacher> allTeachers = teacherRepository.findAll();

        Map<String, Map<String, String>> gridData = new HashMap<>();
        int importedCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            
            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header

                Cell dayCell = row.getCell(0);
                if (dayCell == null) continue;
                String rawDay = dayCell.getStringCellValue().trim();
                if (rawDay.isEmpty()) continue;
                
                String day = rawDay.substring(0, 1).toUpperCase() + rawDay.substring(1).toLowerCase();
                
                if (!Arrays.asList("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday").contains(day)) {
                    continue;
                }

                Map<String, String> dayGrid = gridData.computeIfAbsent(day, k -> new HashMap<>());

                for (int p = 1; p <= 7; p++) {
                    Cell periodCell = row.getCell(p);
                    String cellVal = "";
                    if (periodCell != null) {
                        cellVal = periodCell.getStringCellValue().trim();
                    }
                    
                    if (cellVal.isEmpty() || cellVal.equalsIgnoreCase("FREE") || cellVal.equalsIgnoreCase("BREAK")) {
                        dayGrid.put("P" + p, "");
                        continue;
                    }

                    // Convert "CS8591 (Ms.J - CR-12)" -> "CS8591, Ms.J, CR-12"
                    String formattedVal = cellVal.replace(" (", ", ").replace(" - ", ", ").replace(")", "");
                    dayGrid.put("P" + p, formattedVal);

                    if (section == null || slots.isEmpty()) {
                        skippedCount++;
                        continue;
                    }

                    final int periodIdx = p;
                    TimeSlot timeSlot = slots.stream().filter(s -> s.getSlotNumber() != null && s.getSlotNumber() == periodIdx).findFirst().orElse(slots.get(0));
                    
                    String subjectCode = formattedVal.split(",")[0].trim();
                    
                    Subject subject = allSubjects.stream().filter(s -> s.getSubjectCode() != null && s.getSubjectCode().equalsIgnoreCase(subjectCode)).findFirst().orElse(null);
                    
                    if (subject == null) {
                        if (!allSubjects.isEmpty()) subject = allSubjects.get(0);
                    }
                    
                    Teacher teacher = null;
                    if (!allTeachers.isEmpty()) teacher = allTeachers.get(0);

                    List<TimetableEntry> existing = timetableRepository.findBySectionId(section.getId());
                    TimetableEntry entry = existing.stream()
                        .filter(e -> e.getDay().equals(day) && e.getTimeSlot().getId().equals(timeSlot.getId()))
                        .findFirst()
                        .orElse(new TimetableEntry());
                    
                    if (entry.getId() != null) {
                        updatedCount++;
                    } else {
                        importedCount++;
                    }
                    
                    entry.setDay(day);
                    entry.setSection(section);
                    entry.setTimeSlot(timeSlot);
                    if (subject != null) entry.setSubject(subject);
                    if (teacher != null) entry.setTeacher(teacher);
                    
                    timetableRepository.save(entry);
                }
            }
        }
        
        response.put("message", "Excel imported successfully.\n" + importedCount + " entries imported.\n" + updatedCount + " updated.\n" + skippedCount + " skipped.");
        response.put("grid", gridData);
        return response;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> saveManualTimetable(String sectionName, Map<String, Map<String, String>> gridData) throws Exception {
        String cleanSection = (sectionName != null && !sectionName.trim().isEmpty()) ? sectionName.trim() : "II CSE C";
        Section section = sectionRepository.findBySectionName(cleanSection).orElse(null);

        if (section == null) {
            String[] tokens = cleanSection.split("\\s+");
            String yr = tokens.length >= 1 ? tokens[0] : "II";
            String dp = tokens.length >= 2 ? tokens[1] : "CSE";
            String sc = tokens.length >= 3 ? tokens[2] : "A";
            return assignUploadedClassTimetable(dp, yr, sc, cleanSection, null, gridData);
        }

        int semester = section.getSemester() != null ? section.getSemester() : 3;
        int savedCount = replaceSectionTimetableFromGrid(section, semester, gridData);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Timetable saved successfully to Database (" + savedCount + " periods for " + section.getSectionName() + ").");
        response.put("sectionName", section.getSectionName());
        response.put("sectionId", section.getId());
        response.put("entriesSaved", savedCount);
        return response;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> assignUploadedClassTimetable(
            String deptCodeOrName,
            String yearRomanOrNum,
            String secCode,
            String sectionName,
            String classAdvisorUsernameOrName,
            Map<String, Map<String, String>> gridData) throws Exception {

        String cleanDept = (deptCodeOrName != null && !deptCodeOrName.trim().isEmpty()) ? deptCodeOrName.trim() : "CSE";
        String cleanYear = (yearRomanOrNum != null && !yearRomanOrNum.trim().isEmpty()) ? yearRomanOrNum.trim() : "II";
        String cleanSec = (secCode != null && !secCode.trim().isEmpty()) ? secCode.trim().toUpperCase() : "A";
        String targetSectionName = (sectionName != null && !sectionName.trim().isEmpty())
                ? sectionName.trim()
                : (cleanYear + " " + cleanDept + " " + cleanSec);

        int yearInt = parseYearToInt(cleanYear);
        int semester = Math.max(1, Math.min(8, yearInt * 2 - 1));

        // 1. Resolve or create Department
        Department dept = departmentRepository.findByCode(cleanDept)
                .or(() -> departmentRepository.findByName(cleanDept))
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setCode(cleanDept.toUpperCase());
                    d.setName(cleanDept);
                    return departmentRepository.save(d);
                });

        // 2. Resolve or create Course
        String courseCode = "BTECH-" + dept.getCode().replaceAll("[^A-Za-z0-9]", "");
        Course course = courseRepository.findByCode(courseCode)
                .or(() -> courseRepository.findByName(courseCode))
                .orElseGet(() -> {
                    Course c = new Course();
                    c.setCode(courseCode);
                    c.setName("B.Tech " + dept.getName());
                    c.setDepartment(dept);
                    return courseRepository.save(c);
                });

        // 3. Resolve or create Section
        Section section = sectionRepository.findBySectionName(targetSectionName).orElseGet(() -> {
            Section s = new Section();
            s.setSectionName(targetSectionName);
            s.setCourse(course);
            s.setSemester(semester);
            s.setYear(yearInt);
            s.setSectionIdentifier(cleanSec);
            s.setStudentCount(60);
            return sectionRepository.save(s);
        });

        // 4. Update Class Advisor if specified
        String assignedAdvisorName = "";
        List<Teacher> allTeachers = teacherRepository.findAll();
        if (classAdvisorUsernameOrName != null && !classAdvisorUsernameOrName.trim().isEmpty()) {
            String advKey = classAdvisorUsernameOrName.trim().toLowerCase();
            Teacher matchedAdvisor = allTeachers.stream()
                    .filter(t -> (t.getUser() != null && t.getUser().getUsername() != null && t.getUser().getUsername().equalsIgnoreCase(advKey))
                            || (t.getEmployeeId() != null && t.getEmployeeId().equalsIgnoreCase(advKey))
                            || (t.getDisplayName() != null && t.getDisplayName().equalsIgnoreCase(advKey))
                            || t.getName().equalsIgnoreCase(advKey))
                    .findFirst().orElse(null);

            if (matchedAdvisor != null) {
                for (Teacher t : allTeachers) {
                    if (targetSectionName.equalsIgnoreCase(t.getClassAdvisorFor()) && !t.getId().equals(matchedAdvisor.getId())) {
                        t.setClassAdvisorFor("");
                        teacherRepository.save(t);
                    }
                }
                matchedAdvisor.setClassAdvisorFor(targetSectionName);
                teacherRepository.save(matchedAdvisor);
                assignedAdvisorName = matchedAdvisor.getDisplayName() != null ? matchedAdvisor.getDisplayName() : matchedAdvisor.getName();
            }
        }

        // 5. Replace section timetable entries accurately via shared grid saver
        int savedCount = replaceSectionTimetableFromGrid(section, semester, gridData);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Assigned timetable (" + savedCount + " periods) to " + targetSectionName + ".");
        response.put("sectionName", targetSectionName);
        response.put("sectionId", section.getId());
        response.put("entriesSaved", savedCount);
        response.put("classAdvisor", assignedAdvisorName);
        return response;
    }

    private int replaceSectionTimetableFromGrid(Section section, int semester, Map<String, Map<String, String>> gridData) {
        List<TimetableEntry> existing = timetableRepository.findBySectionId(section.getId());
        if (!existing.isEmpty()) {
            timetableRepository.deleteAll(existing);
        }

        List<TimeSlot> slots = ensureTimeSlots();
        List<Subject> allSubjects = subjectRepository.findAll();
        List<Teacher> allTeachers = teacherRepository.findAll();
        List<Classroom> allRooms = classroomRepository.findAll();
        List<Laboratory> allLabs = laboratoryRepository.findAll();

        Department dept = (section.getCourse() != null && section.getCourse().getDepartment() != null)
                ? section.getCourse().getDepartment()
                : departmentRepository.findAll().stream().findFirst().orElse(null);

        int savedCount = 0;
        if (gridData != null && !slots.isEmpty()) {
            for (Map.Entry<String, Map<String, String>> dayEntry : gridData.entrySet()) {
                String day = dayEntry.getKey();
                Map<String, String> periods = dayEntry.getValue();
                if (periods == null) continue;

                for (int p = 1; p <= 7; p++) {
                    String cellVal = periods.get("P" + p);
                    if (cellVal == null || cellVal.trim().isEmpty() || cellVal.trim().equalsIgnoreCase("FREE") || cellVal.trim().equals("-")) {
                        continue;
                    }

                    String[] parts = cellVal.split(",");
                    String subText = parts.length > 0 ? parts[0].trim() : "";
                    String facText = parts.length > 1 ? parts[1].trim() : "";
                    String venueText = parts.length > 2 ? parts[2].trim() : "";
                    if (subText.isEmpty() || subText.equalsIgnoreCase("FREE")) continue;

                    final int periodIdx = p;
                    TimeSlot timeSlot = slots.stream()
                            .filter(s -> s.getSlotNumber() != null && s.getSlotNumber() == periodIdx)
                            .findFirst().orElse(slots.get(0));

                    Subject subject = findOrCreateSubject(subText, dept, semester, allSubjects);
                    Teacher teacher = matchTeacher(facText, allTeachers);
                    if (teacher == null && !allTeachers.isEmpty()) {
                        teacher = allTeachers.get(0);
                    }
                    if (subject == null || teacher == null) continue;

                    Classroom room = matchClassroom(venueText, allRooms);
                    Laboratory lab = (room == null) ? matchLab(venueText, allLabs) : null;
                    if (room == null && lab == null && !allRooms.isEmpty()) {
                        room = allRooms.get(0);
                    }

                    TimetableEntry entry = new TimetableEntry();
                    entry.setDay(day);
                    entry.setSection(section);
                    entry.setTimeSlot(timeSlot);
                    entry.setSubject(subject);
                    entry.setTeacher(teacher);
                    entry.setClassroom(room);
                    entry.setLaboratory(lab);
                    entry.setSemester(semester);
                    if (!facText.isEmpty()) entry.setAssignedFaculty(facText);
                    if (!venueText.isEmpty()) entry.setAssignedVenue(venueText);
                    timetableRepository.save(entry);
                    savedCount++;
                }
            }
        }
        return savedCount;
    }

    private List<TimeSlot> ensureTimeSlots() {
        List<TimeSlot> slots = timeSlotRepository.findAll();
        if (!slots.isEmpty()) {
            return slots;
        }
        String[][] defaults = {
                {"08:40", "09:40"},
                {"09:40", "10:40"},
                {"11:00", "12:00"},
                {"12:00", "13:00"},
                {"13:40", "14:30"},
                {"14:30", "15:20"},
                {"15:20", "16:10"}
        };
        List<TimeSlot> created = new ArrayList<>();
        for (int i = 0; i < defaults.length; i++) {
            created.add(timeSlotRepository.save(new TimeSlot(i + 1, defaults[i][0], defaults[i][1])));
        }
        return created;
    }

    private int parseYearToInt(String y) {
        String u = y.toUpperCase();
        if (u.equals("I") || u.startsWith("1")) return 1;
        if (u.equals("II") || u.startsWith("2")) return 2;
        if (u.equals("III") || u.startsWith("3")) return 3;
        if (u.equals("IV") || u.startsWith("4")) return 4;
        return 2;
    }

    private Subject findOrCreateSubject(String subText, Department dept, int semester, List<Subject> allSubjects) {
        String clean = subText.trim();
        for (Subject s : allSubjects) {
            if ((s.getSubjectCode() != null && s.getSubjectCode().equalsIgnoreCase(clean))
                    || (s.getSubjectName() != null && s.getSubjectName().equalsIgnoreCase(clean))) {
                return s;
            }
        }
        String code = clean.toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (code.isEmpty()) code = "SUB" + System.currentTimeMillis();
        if (code.length() > 16) code = code.substring(0, 16);
        for (Subject s : allSubjects) {
            if (s.getSubjectCode() != null && s.getSubjectCode().equalsIgnoreCase(code)) {
                return s;
            }
        }
        Subject created = new Subject();
        created.setSubjectCode(code);
        created.setSubjectName(clean);
        created.setDepartment(dept);
        created.setSemester(semester);
        created.setType(clean.toUpperCase().contains("LAB") ? SubjectType.LAB : SubjectType.THEORY);
        created = subjectRepository.save(created);
        allSubjects.add(created);
        return created;
    }

    private Teacher matchTeacher(String facText, List<Teacher> allTeachers) {
        if (facText == null || facText.trim().isEmpty()) return null;
        String q = facText.trim().toLowerCase();
        for (Teacher t : allTeachers) {
            if ((t.getDisplayName() != null && t.getDisplayName().toLowerCase().contains(q))
                    || t.getName().toLowerCase().contains(q)
                    || (t.getFirstName() != null && q.contains(t.getFirstName().toLowerCase()))
                    || (t.getUser() != null && t.getUser().getUsername().equalsIgnoreCase(q))) {
                return t;
            }
        }
        return null;
    }

    private Classroom matchClassroom(String venueText, List<Classroom> allRooms) {
        if (venueText == null || venueText.trim().isEmpty()) return null;
        String q = venueText.trim().toLowerCase();
        return allRooms.stream()
                .filter(r -> r.getRoomNumber() != null && r.getRoomNumber().toLowerCase().equals(q))
                .findFirst().orElse(null);
    }

    private Laboratory matchLab(String venueText, List<Laboratory> allLabs) {
        if (venueText == null || venueText.trim().isEmpty()) return null;
        String q = venueText.trim().toLowerCase();
        return allLabs.stream()
                .filter(l -> l.getLabName() != null && l.getLabName().toLowerCase().contains(q))
                .findFirst().orElse(null);
    }
}
