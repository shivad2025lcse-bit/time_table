package com.smarttimetable.controller;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student/dashboard")
@CrossOrigin(origins = "*")
public class StudentDashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TimetableRepository timetableRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentTimetable(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }

        Student student = studentRepository.findByUserId(user.getId()).orElse(null);
        if (student == null || student.getSection() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "NO_PROFILE",
                "message", "Your academic class/section is not configured. Please contact the administrator."
            ));
        }

        Section section = student.getSection();
        
        LocalDate today = LocalDate.now();
        String currentDay = today.getDayOfWeek().name();
        String dayFormatted = currentDay.substring(0, 1).toUpperCase() + currentDay.substring(1).toLowerCase(); // e.g., "Monday"
        
        LocalTime currentTime = LocalTime.now();

        List<TimeSlot> allSlots = timeSlotRepository.findAll();
        // Sort by parsed start time
        allSlots.sort(Comparator.comparing(slot -> parseTime(slot.getStartTime())));

        List<TimetableEntry> sectionEntries = timetableRepository.findBySectionId(section.getId());
        List<TimetableEntry> todayEntries = sectionEntries.stream()
                .filter(e -> e.getDay().equalsIgnoreCase(dayFormatted))
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        
        Map<String, Object> studentInfo = new HashMap<>();
        studentInfo.put("id", student.getId());
        studentInfo.put("year", student.getSemester() != null ? (student.getSemester() + 1) / 2 : "Unknown"); // e.g., II Year
        studentInfo.put("department", student.getDepartment().getCode());
        studentInfo.put("section", section.getSectionName().substring(section.getSectionName().lastIndexOf(" ") + 1));
        studentInfo.put("fullSectionName", section.getSectionName());
        response.put("student", studentInfo);
        
        response.put("date", today.toString());
        response.put("day", dayFormatted);

        if (today.getDayOfWeek().name().equals("SUNDAY")) {
            response.put("status", "HOLIDAY");
            response.put("message", "HOLIDAY. No classes scheduled today.");
            return ResponseEntity.ok(response);
        }

        // Determine current period
        Map<String, Object> currentPeriod = null;
        Map<String, Object> nextPeriod = null;
        String status = "BEFORE_COLLEGE";

        if (allSlots.isEmpty()) {
             response.put("status", "HOLIDAY");
             return ResponseEntity.ok(response);
        }

        LocalTime firstStart = parseTime(allSlots.get(0).getStartTime());
        LocalTime lastEnd = parseTime(allSlots.get(allSlots.size() - 1).getEndTime());

        if (currentTime.isBefore(firstStart)) {
            status = "BEFORE_COLLEGE";
            nextPeriod = extractPeriodDetails(allSlots.get(0), todayEntries);
        } else if (currentTime.isAfter(lastEnd) || currentTime.equals(lastEnd)) {
            status = "AFTER_COLLEGE";
        } else {
            // Find current active slot or break
            for (int i = 0; i < allSlots.size(); i++) {
                TimeSlot slot = allSlots.get(i);
                LocalTime start = parseTime(slot.getStartTime());
                LocalTime end = parseTime(slot.getEndTime());

                if ((currentTime.isAfter(start) || currentTime.equals(start)) && currentTime.isBefore(end)) {
                    currentPeriod = extractPeriodDetails(slot, todayEntries);
                    status = currentPeriod.get("subject") == null || currentPeriod.get("subject").equals("FREE") 
                        ? "NO_CLASS" 
                        : "CURRENT_PERIOD";
                    
                    if (i + 1 < allSlots.size()) {
                        nextPeriod = extractPeriodDetails(allSlots.get(i + 1), todayEntries);
                    }
                    break;
                } else if (currentTime.isAfter(end) && i + 1 < allSlots.size()) {
                    TimeSlot nextSlot = allSlots.get(i + 1);
                    LocalTime nextStart = parseTime(nextSlot.getStartTime());
                    if (currentTime.isBefore(nextStart)) {
                        // It's a break
                        status = determineBreakName(end, nextStart);
                        currentPeriod = new HashMap<>();
                        currentPeriod.put("name", status);
                        currentPeriod.put("startTime", slot.getEndTime());
                        currentPeriod.put("endTime", nextSlot.getStartTime());
                        currentPeriod.put("subject", status);
                        nextPeriod = extractPeriodDetails(nextSlot, todayEntries);
                        break;
                    }
                }
            }
        }

        response.put("status", status);
        response.put("currentPeriod", currentPeriod);
        response.put("nextPeriod", nextPeriod);
        
        // Populate today's timetable
        List<Map<String, Object>> todaySchedule = new ArrayList<>();
        for (TimeSlot slot : allSlots) {
            todaySchedule.add(extractPeriodDetails(slot, todayEntries));
        }
        response.put("todayTimetable", todaySchedule);

        return ResponseEntity.ok(response);
    }

    private LocalTime parseTime(String timeStr) {
        if (timeStr == null) return LocalTime.MIN;
        timeStr = timeStr.trim().replace(".", ":").toUpperCase();
        try {
            if (timeStr.contains("AM") || timeStr.contains("PM")) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.US);
                return LocalTime.parse(timeStr, formatter);
            } else {
                return LocalTime.parse(timeStr);
            }
        } catch (java.time.format.DateTimeParseException e) {
            return LocalTime.MIN;
        }
    }

    private String determineBreakName(LocalTime breakStart, LocalTime breakEnd) {
        if (breakStart.getHour() < 12) {
            return "TEA_BREAK";
        } else if (breakStart.getHour() == 12 || (breakStart.getHour() >= 13 && breakStart.getHour() < 15)) {
            return "LUNCH_BREAK";
        } else {
            return "ACTIVITY";
        }
    }

    private Map<String, Object> extractPeriodDetails(TimeSlot slot, List<TimetableEntry> entries) {
        Map<String, Object> period = new HashMap<>();
        period.put("name", "Period " + slot.getSlotNumber());
        period.put("startTime", slot.getStartTime());
        period.put("endTime", slot.getEndTime());
        
        TimetableEntry entry = entries.stream()
            .filter(e -> e.getTimeSlot().getId().equals(slot.getId()))
            .findFirst()
            .orElse(null);
            
        if (entry != null && entry.getSubject() != null && !entry.getSubject().getSubjectName().equalsIgnoreCase("FREE")) {
            period.put("subject", entry.getSubject().getSubjectName());
            period.put("faculty", entry.getTeacher() != null ? entry.getTeacher().getName() : "TBA");
            period.put("room", entry.getClassroom() != null ? entry.getClassroom().getRoomNumber() : "TBA");
        } else {
            period.put("subject", "FREE");
        }
        return period;
    }
}
