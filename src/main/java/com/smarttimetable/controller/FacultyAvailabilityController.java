package com.smarttimetable.controller;

import com.smarttimetable.entity.FacultyAvailability;
import com.smarttimetable.entity.Role;
import com.smarttimetable.entity.Teacher;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.UserRepository;
import com.smarttimetable.service.FacultyAvailabilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

import java.util.List;

@RestController
@RequestMapping("/api/faculty-availability")
@CrossOrigin(origins = "*")
public class FacultyAvailabilityController {

    @Autowired
    private FacultyAvailabilityService facultyAvailabilityService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @GetMapping
    public ResponseEntity<List<FacultyAvailability>> getAllAvailabilities() {
        return ResponseEntity.ok(facultyAvailabilityService.getAllAvailabilities());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<FacultyAvailability>> getByTeacherId(@PathVariable Long teacherId) {
        return ResponseEntity.ok(facultyAvailabilityService.getByTeacherId(teacherId));
    }

    @PostMapping
    public ResponseEntity<?> updateAvailability(
            @RequestParam Long teacherId,
            @RequestParam String day,
            @RequestParam Long timeSlotId,
            @RequestParam boolean available,
            Authentication authentication
    ) {
        if (authentication != null) {
            User actor = userRepository.findByUsernameIgnoreCase(authentication.getName()).orElse(null);
            if (actor != null && actor.getRole() == Role.ROLE_FACULTY) {
                Teacher self = teacherRepository.findByUserId(actor.getId()).orElse(null);
                if (self == null || !self.getId().equals(teacherId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(java.util.Map.of("error", "Faculty can only update their own leave / availability status."));
                }
            }
        }
        return ResponseEntity.ok(facultyAvailabilityService.updateAvailability(teacherId, day, timeSlotId, available));
    }
}
