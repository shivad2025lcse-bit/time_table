package com.smarttimetable.controller;

import com.smarttimetable.entity.Teacher;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.UserRepository;
import com.smarttimetable.service.TeacherService;
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

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/teachers")
@CrossOrigin(origins = "*")
public class TeacherController {

    @Autowired
    private TeacherService teacherService;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('ROLE_FACULTY')")
    public ResponseEntity<Map<String, Object>> getMyTeacherProfile(Authentication authentication) {
        User user = userRepository.findByUsernameIgnoreCase(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        Teacher teacher = teacherRepository.findByUserId(user.getId()).orElse(null);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", teacher.getId());
        response.put("employeeId", teacher.getEmployeeId());
        response.put("firstName", teacher.getFirstName());
        response.put("lastName", teacher.getLastName());
        response.put("displayName", teacher.getDisplayName());
        response.put("classAdvisorFor", teacher.getClassAdvisorFor());
        response.put("personalEmail", teacher.getPersonalEmail());
        response.put("collegeEmail", teacher.getCollegeEmail());
        if (teacher.getDepartment() != null) {
            Map<String, String> department = new LinkedHashMap<>();
            department.put("code", teacher.getDepartment().getCode());
            department.put("name", teacher.getDepartment().getName());
            response.put("department", department);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Teacher>> getAllTeachers() {
        return ResponseEntity.ok(teacherService.getAllTeachers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Teacher> getTeacherById(@PathVariable Long id) {
        return teacherService.getTeacherById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Teacher> createTeacher(@RequestBody Teacher teacher) {
        return ResponseEntity.ok(teacherService.saveTeacher(teacher));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<Teacher> updateTeacher(@PathVariable Long id, @RequestBody Teacher teacherDetails) {
        return teacherService.getTeacherById(id)
                .map(existing -> {
                    org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                    boolean isFaculty = authentication != null && authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
                    if (isFaculty && (existing.getUser() == null || !existing.getUser().getUsername().equals(authentication.getName()))) {
                        throw new RuntimeException("Faculty can only update their own profile");
                    }
                    if (teacherDetails.getEmployeeId() != null && !teacherDetails.getEmployeeId().isEmpty()) {
                        existing.setEmployeeId(teacherDetails.getEmployeeId());
                    }
                    existing.setFirstName(teacherDetails.getFirstName());
                    existing.setLastName(teacherDetails.getLastName());
                    existing.setPersonalEmail(teacherDetails.getPersonalEmail());
                    existing.setCollegeEmail(teacherDetails.getCollegeEmail());
                    existing.setPhone1(teacherDetails.getPhone1());
                    existing.setPhone2(teacherDetails.getPhone2());
                    existing.setSubjectHandling(teacherDetails.getSubjectHandling());
                    if (teacherDetails.getDepartment() != null) {
                        existing.setDepartment(teacherDetails.getDepartment());
                    }
                    
                    // Also update the linked User if it exists (since emails might be mapped there)
                    if (existing.getUser() != null) {
                        existing.getUser().setEmail(teacherDetails.getCollegeEmail());
                    }
                    
                    return ResponseEntity.ok(teacherService.saveTeacher(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteTeacher(@PathVariable Long id) {
        teacherService.deleteTeacher(id);
        return ResponseEntity.noContent().build();
    }
}
