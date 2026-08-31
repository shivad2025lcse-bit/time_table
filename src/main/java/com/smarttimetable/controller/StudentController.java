package com.smarttimetable.controller;

import com.smarttimetable.entity.Student;
import com.smarttimetable.service.StudentService;
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

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<?> createStudent(@RequestBody Student student) {
        try {
            return ResponseEntity.ok(studentService.saveStudent(student));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body("Failed: A student with this Register Number or Email already exists!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY', 'ROLE_STUDENT')")
    public ResponseEntity<Student> updateStudent(@PathVariable Long id, @RequestBody Student studentDetails, Authentication authentication) {
        return studentService.getStudentById(id)
                .map(existing -> {
                    boolean isStudent = authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
                    if (isStudent && (existing.getUser() == null || !existing.getUser().getUsername().equals(authentication.getName()))) {
                        return ResponseEntity.status(403).body((Student) null);
                    }
                    
                    existing.setFirstName(studentDetails.getFirstName());
                    existing.setLastName(studentDetails.getLastName());
                    existing.setEmail(studentDetails.getEmail());
                    existing.setCollegeEmail(studentDetails.getCollegeEmail());
                    existing.setPhone(studentDetails.getPhone());
                    existing.setParentPhone1(studentDetails.getParentPhone1());
                    existing.setParentPhone2(studentDetails.getParentPhone2());
                    existing.setResidentType(studentDetails.getResidentType());
                    existing.setHostelBlock(studentDetails.getHostelBlock());
                    existing.setRoomNumber(studentDetails.getRoomNumber());
                    // Students shouldn't change their semester, only Admin/Faculty
                    if (!isStudent) {
                        existing.setSemester(studentDetails.getSemester());
                    }
                    return ResponseEntity.ok(studentService.saveStudent(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
