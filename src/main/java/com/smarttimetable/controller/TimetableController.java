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
import org.springframework.web.bind.annotation.*;
import com.smarttimetable.repository.UserRepository;
import com.smarttimetable.repository.StudentRepository;
import com.smarttimetable.entity.User;
import com.smarttimetable.entity.Student;


import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/timetable")
@CrossOrigin(origins = "*")
public class TimetableController {

    @Autowired
    private TimetableGeneratorService timetableGeneratorService;

    @Autowired
    private TimetableRepository timetableRepository;

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
                    List<TimetableEntry> entries = timetableRepository.findBySectionId(student.getSection().getId());
                    return ResponseEntity.ok(entries.stream()
                            .map(timetableGeneratorService::convertToDto)
                            .collect(Collectors.toList()));
                }
            }
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
                if (t != null) entry.setTeacher(t);
            }
            if (classroomId != null) {
                Classroom rm = classroomRepository.findById(classroomId).orElse(null);
                entry.setClassroom(rm);
                entry.setLaboratory(null);
            } else if (laboratoryId != null) {
                Laboratory lab = laboratoryRepository.findById(laboratoryId).orElse(null);
                entry.setLaboratory(lab);
                entry.setClassroom(null);
            }
            if (day != null && !day.isEmpty()) {
                entry.setDay(day);
            }
            TimetableEntry updated = timetableRepository.save(entry);
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
    public ResponseEntity<List<TimetableEntryDto>> getSectionTimetable(@PathVariable Long sectionId, Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))) {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                Student student = studentRepository.findByUserId(user.getId()).orElse(null);
                if (student == null || student.getSection() == null || !student.getSection().getId().equals(sectionId)) {
                    return ResponseEntity.status(403).build();
                }
            }
        }
        List<TimetableEntry> entries = timetableRepository.findBySectionId(sectionId);
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
        return ResponseEntity.noContent().build();
    }
}
