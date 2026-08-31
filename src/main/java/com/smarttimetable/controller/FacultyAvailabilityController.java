package com.smarttimetable.controller;

import com.smarttimetable.entity.FacultyAvailability;
import com.smarttimetable.service.FacultyAvailabilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    @GetMapping
    public ResponseEntity<List<FacultyAvailability>> getAllAvailabilities() {
        return ResponseEntity.ok(facultyAvailabilityService.getAllAvailabilities());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<FacultyAvailability>> getByTeacherId(@PathVariable Long teacherId) {
        return ResponseEntity.ok(facultyAvailabilityService.getByTeacherId(teacherId));
    }

    @PostMapping
    public ResponseEntity<FacultyAvailability> updateAvailability(
            @RequestParam Long teacherId,
            @RequestParam String day,
            @RequestParam Long timeSlotId,
            @RequestParam boolean available
    ) {
        return ResponseEntity.ok(facultyAvailabilityService.updateAvailability(teacherId, day, timeSlotId, available));
    }
}
