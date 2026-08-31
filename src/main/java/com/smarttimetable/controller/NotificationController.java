package com.smarttimetable.controller;

import com.smarttimetable.entity.StudentNotificationRegistration;
import com.smarttimetable.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/register")
    public ResponseEntity<StudentNotificationRegistration> registerEmailOrPhone(
            @RequestParam String name,
            @RequestParam(required = false, defaultValue = "") String email,
            @RequestParam(required = false, defaultValue = "") String phone,
            @RequestParam(required = false, defaultValue = "STUDENT") String role,
            @RequestParam(required = false) Long sectionId
    ) {
        return ResponseEntity.ok(notificationService.registerEmailOrPhone(name, email, phone, role, sectionId));
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<List<StudentNotificationRegistration>> getRegistrations(@PathVariable Long sectionId) {
        return ResponseEntity.ok(notificationService.getRegistrationsBySection(sectionId));
    }

    @PostMapping("/send-sms-alert")
    public ResponseEntity<Map<String, Object>> sendSmsNotification(
            @RequestParam(required = false) Long sectionId,
            @RequestParam String subjectName,
            @RequestParam String day,
            @RequestParam String timeSlotLabel,
            @RequestParam(defaultValue = "Reminder: Please attend your upcoming scheduled class period at Sri Eshwar College.") String message
    ) {
        return ResponseEntity.ok(notificationService.sendSmsNotification(sectionId, subjectName, day, timeSlotLabel, message));
    }
}
