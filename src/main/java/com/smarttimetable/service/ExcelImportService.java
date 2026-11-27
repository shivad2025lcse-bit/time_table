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
        return importTimetableExcel(file, sectionName, null);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> importTimetableExcel(MultipartFile file, String sectionName, Integer explicitSemester) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new Exception("Excel/CSV file is empty");
        }
        String cleanSection = sectionName != null ? sectionName.trim() : "";
        if (cleanSection.isEmpty()) {
            throw new Exception("Target section name is required");
        }

        Section section = sectionRepository.findBySectionName(cleanSection).orElse(null);
        if (section == null) {
            section = resolveOrCreateSectionByName(cleanSection, explicitSemester);
        }

        int semester = (explicitSemester != null && explicitSemester >= 1 && explicitSemester <= 8)
                ? explicitSemester
                : (section.getSemester() != null ? section.getSemester() : 3);

        List<List<String>> rows = readTabularRows(file);
        if (rows.isEmpty()) {
            throw new Exception("Uploaded file has no readable rows");
        }

        // Detect header row & map columns to periods P1..P7 (skipping Tea/Lunch Break/Activity columns)
        int headerIdx = 0;
        Map<Integer, Integer> colToPeriod = new LinkedHashMap<>();
        int dayCol = 0;
        for (int r = 0; r < Math.min(rows.size(), 5); r++) {
            List<String> candidate = rows.get(r);
            Map<Integer, Integer> parsed = parsePeriodColumnMap(candidate);
            if (!parsed.isEmpty()) {
                headerIdx = r + 1;
                colToPeriod = parsed;
                dayCol = findDayColumn(candidate);
                break;
            }
        }
        if (colToPeriod.isEmpty()) {
            // Positional fallback: col 0 = Day, cols 1..7 = P1..P7 (skipping header row if row 0 says Day)
            if (!rows.get(0).isEmpty() && rows.get(0).get(0).toLowerCase().contains("day")) {
                headerIdx = 1;
            }
            for (int p = 1; p <= 7; p++) {
                colToPeriod.put(p, p);
            }
        }

        Map<String, Map<String, String>> gridData = new LinkedHashMap<>();
        int nonEmptyCells = 0;
        for (int r = headerIdx; r < rows.size(); r++) {
            List<String> row = rows.get(r);
            if (row == null || dayCol >= row.size()) continue;
            String day = normalizeDayName(row.get(dayCol));
            if (day == null) continue;

            Map<String, String> dayGrid = gridData.computeIfAbsent(day, k -> new LinkedHashMap<>());
            for (Map.Entry<Integer, Integer> mapping : colToPeriod.entrySet()) {
                int colIdx = mapping.getKey();
                int period = mapping.getValue();
                String cellVal = colIdx < row.size() && row.get(colIdx) != null ? row.get(colIdx).trim() : "";
                String upper = cellVal.toUpperCase(Locale.ROOT);
                if (cellVal.isEmpty() || upper.equals("FREE") || upper.equals("BREAK")
                        || upper.equals("TEA BREAK") || upper.equals("LUNCH BREAK") || cellVal.equals("-")) {
                    dayGrid.putIfAbsent("P" + period, "");
                    continue;
                }
                String formattedVal = normalizePeriodCellValue(cellVal);
                dayGrid.put("P" + period, formattedVal);
                if (!formattedVal.isEmpty()) {
                    nonEmptyCells++;
                }
            }
        }

        if (gridData.isEmpty() || nonEmptyCells == 0) {
            throw new Exception("No valid timetable day/period entries found. Ensure columns include Day and P1..P7 (or Period 1..7).");
        }

        int savedCount = replaceSectionTimetableFromGrid(section, semester, gridData);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Imported " + savedCount + " periods for " + section.getSectionName() + " (Sem " + semester + ") into the database.");
        response.put("entriesSaved", savedCount);
        response.put("sectionName", section.getSectionName());
        response.put("sectionId", section.getId());
        response.put("semester", semester);
        response.put("grid", gridData);
        return response;
    }

    private Section resolveOrCreateSectionByName(String sectionName, Integer explicitSemester) {
        String[] tokens = sectionName.trim().split("\\s+");
        String yearStr = "II";
        String deptStr = "CSE";
        String secStr = "A";
        if (tokens.length >= 3) {
            yearStr = tokens[0];
            deptStr = tokens[1];
            secStr = tokens[2];
        } else if (tokens.length == 2) {
            deptStr = tokens[0];
            secStr = tokens[1];
        }
        final String cleanDept = deptStr;
        final String cleanYear = yearStr;
        final String cleanSec = secStr.toUpperCase(Locale.ROOT);
        int yearInt = parseYearToInt(cleanYear);
        int semester = (explicitSemester != null && explicitSemester >= 1 && explicitSemester <= 8)
                ? explicitSemester
                : Math.max(1, Math.min(8, yearInt * 2 - 1));

        Department dept = departmentRepository.findByCode(cleanDept)
                .or(() -> departmentRepository.findByName(cleanDept))
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setCode(cleanDept.toUpperCase(Locale.ROOT));
                    d.setName(cleanDept);
                    return departmentRepository.save(d);
                });

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

        Section created = new Section();
        created.setSectionName(sectionName.trim());
        created.setCourse(course);
        created.setSemester(semester);
        created.setYear(yearInt);
        created.setSectionIdentifier(cleanSec);
        created.setStudentCount(60);
        return sectionRepository.save(created);
    }

    private List<List<String>> readTabularRows(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        if (filename.endsWith(".csv")) {
            return parseCsvRows(file.getInputStream());
        }
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter(Locale.ENGLISH);
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            List<List<String>> rows = new ArrayList<>();
            int lastRow = sheet.getLastRowNum();
            for (int r = 0; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                int lastCol = Math.max(0, row.getLastCellNum());
                List<String> cols = new ArrayList<>(lastCol);
                boolean hasAny = false;
                for (int c = 0; c < lastCol; c++) {
                    Cell cell = row.getCell(c);
                    String val = cell == null ? "" : formatter.formatCellValue(cell, evaluator).trim();
                    if (r == 0 && c == 0 && val.startsWith("\uFEFF")) {
                        val = val.substring(1).trim();
                    }
                    if (!val.isEmpty()) hasAny = true;
                    cols.add(val);
                }
                if (hasAny) rows.add(cols);
            }
            return rows;
        }
    }

    private List<List<String>> parseCsvRows(java.io.InputStream in) throws Exception {
        List<List<String>> rows = new ArrayList<>();
        try (java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(in, java.nio.charset.StandardCharsets.UTF_8))) {
            StringBuilder record = new StringBuilder();
            String line;
            boolean inQuotes = false;
            while ((line = reader.readLine()) != null) {
                if (record.length() > 0) record.append('\n');
                record.append(line);
                for (int i = 0; i < line.length(); i++) {
                    if (line.charAt(i) == '"') inQuotes = !inQuotes;
                }
                if (!inQuotes) {
                    List<String> parsed = splitCsvRecord(record.toString());
                    if (!parsed.isEmpty()) {
                        if (rows.isEmpty() && !parsed.get(0).isEmpty() && parsed.get(0).startsWith("\uFEFF")) {
                            parsed.set(0, parsed.get(0).substring(1).trim());
                        }
                        boolean hasAny = parsed.stream().anyMatch(s -> s != null && !s.trim().isEmpty());
                        if (hasAny) rows.add(parsed);
                    }
                    record.setLength(0);
                }
            }
            if (record.length() > 0) {
                List<String> parsed = splitCsvRecord(record.toString());
                if (parsed.stream().anyMatch(s -> s != null && !s.trim().isEmpty())) {
                    rows.add(parsed);
                }
            }
        }
        return rows;
    }

    private List<String> splitCsvRecord(String line) {
        List<String> cols = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    cur.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch == ',' && !inQuotes) {
                cols.add(cur.toString().trim());
                cur.setLength(0);
            } else {
                cur.append(ch);
            }
        }
        cols.add(cur.toString().trim());
        return cols;
    }

    private int findDayColumn(List<String> headerRow) {
        for (int c = 0; c < headerRow.size(); c++) {
            String h = headerRow.get(c).toLowerCase(Locale.ROOT).trim();
            if (h.equals("day") || h.contains("day")) return c;
        }
        return 0;
    }

    private Map<Integer, Integer> parsePeriodColumnMap(List<String> headerRow) {
        Map<Integer, Integer> map = new LinkedHashMap<>();
        for (int c = 0; c < headerRow.size(); c++) {
            String raw = headerRow.get(c) == null ? "" : headerRow.get(c).trim();
            String norm = raw.toLowerCase(Locale.ROOT).replaceAll("[\\s_]+", " ");
            if (norm.isEmpty() || norm.contains("day") || norm.contains("tea") || norm.contains("lunch")
                    || norm.contains("break") || norm.contains("activity") || norm.equals("act")) {
                continue;
            }
            java.util.regex.Matcher m = java.util.regex.Pattern
                    .compile("(?:period|hour|slot|p)?\\s*([1-7])\\b")
                    .matcher(norm);
            if (m.find()) {
                int period = Integer.parseInt(m.group(1));
                if (!map.containsValue(period)) {
                    map.put(c, period);
                }
            }
        }
        return map;
    }

    private String normalizeDayName(String rawDay) {
        if (rawDay == null) return null;
        String k = rawDay.trim().toLowerCase(Locale.ROOT);
        if (k.startsWith("mon")) return "Monday";
        if (k.startsWith("tue")) return "Tuesday";
        if (k.startsWith("wed")) return "Wednesday";
        if (k.startsWith("thu")) return "Thursday";
        if (k.startsWith("fri")) return "Friday";
        if (k.startsWith("sat")) return "Saturday";
        return null;
    }

    private String normalizePeriodCellValue(String cellVal) {
        String clean = cellVal.trim();
        java.util.regex.Matcher paren = java.util.regex.Pattern
                .compile("^(.+?)\\s*\\(([^)]+)\\)\\s*$")
                .matcher(clean);
        if (paren.matches()) {
            String sub = paren.group(1).trim();
            String meta = paren.group(2).trim();
            String[] metaParts = meta.split("\\s*(?:,|\\s-\\s|/)\\s*");
            String fac = metaParts.length > 0 ? metaParts[0].trim() : "";
            String venue = metaParts.length > 1 ? metaParts[1].trim() : "";
            if (!fac.isEmpty() && !venue.isEmpty()) return sub + ", " + fac + ", " + venue;
            if (!fac.isEmpty()) return sub + ", " + fac;
            return sub;
        }
        return clean.replace(" | ", ", ").replace(" / ", ", ");
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> saveManualTimetable(String sectionName, Map<String, Map<String, String>> gridData) throws Exception {
        return saveManualTimetable(sectionName, null, gridData);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> saveManualTimetable(String sectionName, Integer explicitSemester, Map<String, Map<String, String>> gridData) throws Exception {
        String cleanSection = (sectionName != null && !sectionName.trim().isEmpty()) ? sectionName.trim() : "II CSE C";
        Section section = sectionRepository.findBySectionName(cleanSection).orElse(null);

        if (section == null) {
            String[] tokens = cleanSection.split("\\s+");
            String yr = tokens.length >= 1 ? tokens[0] : "II";
            String dp = tokens.length >= 2 ? tokens[1] : "CSE";
            String sc = tokens.length >= 3 ? tokens[2] : "A";
            return assignUploadedClassTimetable(dp, yr, sc, cleanSection, null, explicitSemester, gridData);
        }

        int semester = (explicitSemester != null && explicitSemester >= 1 && explicitSemester <= 8)
                ? explicitSemester
                : (section.getSemester() != null ? section.getSemester() : 3);
        if (section.getSemester() == null) {
            section.setSemester(semester);
            section = sectionRepository.save(section);
        }
        int savedCount = replaceSectionTimetableFromGrid(section, semester, gridData);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Timetable saved successfully to Database (" + savedCount + " periods for " + section.getSectionName() + ", Sem " + semester + ").");
        response.put("sectionName", section.getSectionName());
        response.put("sectionId", section.getId());
        response.put("semester", semester);
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
        return assignUploadedClassTimetable(deptCodeOrName, yearRomanOrNum, secCode, sectionName, classAdvisorUsernameOrName, null, gridData);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> assignUploadedClassTimetable(
            String deptCodeOrName,
            String yearRomanOrNum,
            String secCode,
            String sectionName,
            String classAdvisorUsernameOrName,
            Integer explicitSemester,
            Map<String, Map<String, String>> gridData) throws Exception {

        String cleanDept = (deptCodeOrName != null && !deptCodeOrName.trim().isEmpty()) ? deptCodeOrName.trim() : "CSE";
        String cleanYear = (yearRomanOrNum != null && !yearRomanOrNum.trim().isEmpty()) ? yearRomanOrNum.trim() : "II";
        String cleanSec = (secCode != null && !secCode.trim().isEmpty()) ? secCode.trim().toUpperCase() : "A";
        String targetSectionName = (sectionName != null && !sectionName.trim().isEmpty())
                ? sectionName.trim()
                : (cleanYear + " " + cleanDept + " " + cleanSec);

        int yearInt = parseYearToInt(cleanYear);
        int defaultSem = Math.max(1, Math.min(8, yearInt * 2 - 1));
        int semester = (explicitSemester != null && explicitSemester >= 1 && explicitSemester <= 8) ? explicitSemester : defaultSem;

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

        // Preserve existing section active semester unless unset so unpromoted students are not dragged to the new semester
        if (section.getSemester() == null) {
            section.setSemester(semester);
            section = sectionRepository.save(section);
        }

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
        response.put("message", "Assigned timetable (" + savedCount + " periods, Sem " + semester + ") to " + targetSectionName + ".");
        response.put("sectionName", targetSectionName);
        response.put("sectionId", section.getId());
        response.put("semester", semester);
        response.put("entriesSaved", savedCount);
        response.put("classAdvisor", assignedAdvisorName);
        return response;
    }

    private int replaceSectionTimetableFromGrid(Section section, int semester, Map<String, Map<String, String>> gridData) {
        List<TimetableEntry> existing = timetableRepository.findBySectionId(section.getId()).stream()
                .filter(e -> e.getSemester() == null || Objects.equals(e.getSemester(), semester))
                .collect(java.util.stream.Collectors.toList());
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
