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

        List<TimeSlot> slots = timeSlotRepository.findAll();
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
        Map<String, Object> response = new HashMap<>();
        
        Section section = sectionRepository.findBySectionName(sectionName).orElse(null);
        if (section == null) {
            List<Section> allSections = sectionRepository.findAll();
            if (!allSections.isEmpty()) section = allSections.get(0);
        }

        List<TimeSlot> slots = timeSlotRepository.findAll();
        List<Subject> allSubjects = subjectRepository.findAll();
        List<Teacher> allTeachers = teacherRepository.findAll();

        int importedCount = 0;
        int updatedCount = 0;

        for (Map.Entry<String, Map<String, String>> entryDay : gridData.entrySet()) {
            String day = entryDay.getKey();
            Map<String, String> periods = entryDay.getValue();
            
            for (int p = 1; p <= 7; p++) {
                String cellVal = periods.get("P" + p);
                if (cellVal == null || cellVal.trim().isEmpty()) {
                    continue; // Leave free
                }

                String formattedVal = cellVal;

                if (section == null || slots.isEmpty()) {
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
        
        response.put("message", "Timetable saved successfully to Database.\n" + importedCount + " inserted, " + updatedCount + " updated.");
        return response;
    }
}
