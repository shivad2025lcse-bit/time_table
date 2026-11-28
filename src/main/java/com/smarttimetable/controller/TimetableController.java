package com.smarttimetable.controller;

import com.smarttimetable.dto.ConflictReportDto;
import com.smarttimetable.dto.TimetableEntryDto;
import com.smarttimetable.dto.TimetableGenerateRequest;
import com.smarttimetable.dto.TimetableResponse;
import com.smarttimetable.entity.Classroom;
import com.smarttimetable.entity.Laboratory;
import com.smarttimetable.entity.Teacher;
import com.smarttimetable.entity.TimetableEntry;
import com.smarttimetable.repository.ClassroomRepository;
import com.smarttimetable.repository.LaboratoryRepository;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.TimetableRepository;
import com.smarttimetable.service.ConflictService;
import com.smarttimetable.service.TimetableGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.smarttimetable.repository.UserRepository;
import com.smarttimetable.repository.StudentRepository;
import com.smarttimetable.entity.User;
import com.smarttimetable.entity.Student;


import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;
import com.smarttimetable.service.AiTimetableParserService;

@RestController
@RequestMapping("/api/timetable")
@CrossOrigin(origins = "*")
public class TimetableController {

    @Autowired
    private TimetableGeneratorService timetableGeneratorService;

    @Autowired
    private TimetableRepository timetableRepository;
    
    @Autowired
    private AiTimetableParserService aiTimetableParserService;

    @Autowired
    private com.smarttimetable.service.ExcelImportService excelImportService;

    @Autowired
    private com.smarttimetable.service.FacultyTimetableSyncService facultyTimetableSyncService;

    @PostMapping("/upload-image")
    public ResponseEntity<?> parseTimetableImage(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(aiTimetableParserService.parseTimetableFile(file));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Upload parsing failed"));
        }
    }

    @PostMapping("/assign-class")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<?> assignUploadedClassTimetable(@RequestBody java.util.Map<String, Object> request) {
        try {
            String dept = (String) request.get("department");
            String year = (String) request.get("year");
            String sec = (String) request.get("sectionCode");
            String sectionName = (String) request.get("sectionName");
            String classAdvisor = (String) request.get("classAdvisor");
            Integer semester = request.get("semester") != null ? Integer.valueOf(request.get("semester").toString()) : null;
            @SuppressWarnings("unchecked")
            java.util.Map<String, java.util.Map<String, String>> gridData =
                    (java.util.Map<String, java.util.Map<String, String>>) request.get("grid");
            return ResponseEntity.ok(excelImportService.assignUploadedClassTimetable(
                    dept, year, sec, sectionName, classAdvisor, semester, gridData));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Class assignment failed"));
        }
    }

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private ConflictService conflictService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public ResponseEntity<List<TimetableEntryDto>> getAllTimetableEntries(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))) {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                Student student = studentRepository.findByUserId(user.getId()).orElse(null);
                if (student != null && student.getSection() != null) {
                    Integer targetSem = student.getSemester() != null ? student.getSemester() : student.getSection().getSemester();
                    List<TimetableEntry> entries = timetableRepository.findBySectionId(student.getSection().getId()).stream()
                            .filter(e -> targetSem == null || java.util.Objects.equals(e.getSemester(), targetSem))
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(entries.stream()
                            .map(timetableGeneratorService::convertToDto)
                            .collect(Collectors.toList()));
                }
            }
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        
        if (authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"))) {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                Teacher teacher = teacherRepository.findByUserId(user.getId()).orElse(null);
                if (teacher != null) {
                    List<TimetableEntry> entries = timetableRepository.findByTeacherId(teacher.getId());
                    return ResponseEntity.ok(entries.stream()
                            .map(timetableGeneratorService::convertToDto)
                            .collect(Collectors.toList()));
                }
            }
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        
        List<TimetableEntry> entries = timetableRepository.findAll();
        return ResponseEntity.ok(entries.stream()
                .map(timetableGeneratorService::convertToDto)
                .collect(Collectors.toList()));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<TimetableResponse> generateTimetable(@RequestBody TimetableGenerateRequest request) {
        TimetableResponse response = timetableGeneratorService.generateTimetable(request);
        facultyTimetableSyncService.syncAllFacultyTimetablesFromStudentTimetables();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/regenerate")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<TimetableResponse> regenerateTimetable(@RequestBody TimetableGenerateRequest request) {
        return generateTimetable(request);
    }

    // Faculty & Admin Period Update Access
    @PutMapping("/entry/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<TimetableEntryDto> updatePeriodEntry(
            @PathVariable Long id,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) Long classroomId,
            @RequestParam(required = false) Long laboratoryId,
            @RequestParam(required = false) String day
    ) {
        return timetableRepository.findById(id).map(entry -> {
            if (teacherId != null) {
                Teacher t = teacherRepository.findById(teacherId).orElse(null);
                if (t != null) {
                    entry.setTeacher(t);
                    entry.setAssignedFaculty(t.getDisplayName() != null && !t.getDisplayName().isBlank() ? t.getDisplayName() : t.getName());
                }
            }
            if (classroomId != null) {
                Classroom rm = classroomRepository.findById(classroomId).orElse(null);
                entry.setClassroom(rm);
                entry.setLaboratory(null);
                if (rm != null) entry.setAssignedVenue(rm.getRoomNumber());
            } else if (laboratoryId != null) {
                Laboratory lab = laboratoryRepository.findById(laboratoryId).orElse(null);
                entry.setLaboratory(lab);
                entry.setClassroom(null);
                if (lab != null) entry.setAssignedVenue(lab.getLabName());
            }
            if (day != null && !day.isEmpty()) {
                entry.setDay(day);
            }
            TimetableEntry updated = timetableRepository.save(entry);
            facultyTimetableSyncService.syncAllFacultyTimetablesFromStudentTimetables();
            return ResponseEntity.ok(timetableGeneratorService.convertToDto(updated));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/conflicts")
    public ResponseEntity<ConflictReportDto> getConflicts() {
        return ResponseEntity.ok(conflictService.checkConflicts(null));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TimetableEntryDto>> getTeacherTimetable(@PathVariable Long teacherId, Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))) {
            return ResponseEntity.status(403).build();
        }
        List<TimetableEntry> entries = timetableRepository.findByTeacherId(teacherId);
        return ResponseEntity.ok(entries.stream()
                .map(timetableGeneratorService::convertToDto)
                .collect(Collectors.toList()));
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<List<TimetableEntryDto>> getSectionTimetable(
            @PathVariable Long sectionId,
            @RequestParam(required = false) Integer semester,
            Authentication authentication) {
        Integer studentSem = null;
        if (authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))) {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                Student student = studentRepository.findByUserId(user.getId()).orElse(null);
                if (student == null || student.getSection() == null || !student.getSection().getId().equals(sectionId)) {
                    return ResponseEntity.status(403).build();
                }
                studentSem = student.getSemester() != null ? student.getSemester() : student.getSection().getSemester();
            }
        }
        final Integer filterSem = studentSem != null ? studentSem : semester;
        List<TimetableEntry> entries = timetableRepository.findBySectionId(sectionId);
        if (filterSem != null) {
            entries = entries.stream()
                    .filter(e -> java.util.Objects.equals(e.getSemester(), filterSem))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(entries.stream()
                .map(timetableGeneratorService::convertToDto)
                .collect(Collectors.toList()));
    }

    @GetMapping("/room/{classroomId}")
    public ResponseEntity<List<TimetableEntryDto>> getClassroomTimetable(@PathVariable Long classroomId, Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))) {
            return ResponseEntity.status(403).build();
        }
        List<TimetableEntry> entries = timetableRepository.findByClassroomId(classroomId);
        return ResponseEntity.ok(entries.stream()
                .map(timetableGeneratorService::convertToDto)
                .collect(Collectors.toList()));
    }

    @GetMapping("/lab/{laboratoryId}")
    public ResponseEntity<List<TimetableEntryDto>> getLaboratoryTimetable(@PathVariable Long laboratoryId, Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))) {
            return ResponseEntity.status(403).build();
        }
        List<TimetableEntry> entries = timetableRepository.findByLaboratoryId(laboratoryId);
        return ResponseEntity.ok(entries.stream()
                .map(timetableGeneratorService::convertToDto)
                .collect(Collectors.toList()));
    }

    @DeleteMapping("/clear")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<Void> clearTimetable() {
        timetableRepository.deleteAll();
        facultyTimetableSyncService.syncAllFacultyTimetablesFromStudentTimetables();
        return ResponseEntity.noContent().build();
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    @PostMapping("/import-excel")
    public ResponseEntity<?> importExcel(@RequestParam("file") MultipartFile file,
                                         @RequestParam("section") String sectionName,
                                         @RequestParam(value = "semester", required = false) Integer semester) {
        try {
            java.util.Map<String, Object> result = excelImportService.importTimetableExcel(file, sectionName, semester);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Excel import failed: " + e.getMessage()));
        }
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    @PostMapping("/save-manual")
    public ResponseEntity<?> saveManualTimetable(@org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> request) {
        try {
            String sectionName = (String) request.get("section");
            Integer semester = request.get("semester") != null ? Integer.valueOf(request.get("semester").toString()) : null;
            @SuppressWarnings("unchecked")
            java.util.Map<String, java.util.Map<String, String>> gridData = (java.util.Map<String, java.util.Map<String, String>>) request.get("grid");
            java.util.Map<String, Object> result = excelImportService.saveManualTimetable(sectionName, semester, gridData);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Manual save failed: " + e.getMessage()));
        }
    }
}
