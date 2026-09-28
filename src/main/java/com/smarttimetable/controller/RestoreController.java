package com.smarttimetable.controller;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class RestoreController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @GetMapping("/restore-data")
    public ResponseEntity<String> restoreData() {
        Department dept = departmentRepository.findAll().stream().findFirst().orElse(null);
        if (dept == null) return ResponseEntity.badRequest().body("Department not found");

        Course course = courseRepository.findAll().stream().findFirst().orElse(null);
        if (course == null) return ResponseEntity.badRequest().body("Course not found");

        var sections = sectionRepository.findAll();
        if (sections.isEmpty()) return ResponseEntity.badRequest().body("Sections not found");
        Section sectionC = sections.get(0);
        Section sectionD = sections.size() > 1 ? sections.get(1) : sections.get(0);

        // Restore Teachers
        String[][] teachers = {
            {"smithp012345", "Smith", "P", "smithp@example.com", "smithp@college.edu", "II CSE C"},
            {"fkeerj012345", "Keerthika", "J", "keer@example.com", "keer@college.edu", "II CSE C"},
            {"fsh012345", "Harikarthick", "S.K.", "hari@example.com", "hari@college.edu", ""},
            {"fmk012345", "Karthickraja", "M", "karthickraja@example.com", "karthickraja@college.edu", ""},
            {"fns012345", "Saranya", "N", "saranya.n@example.com", "saranya.n@college.edu", ""},
            {"frk012345", "Karthick", "R", "karthick.r@example.com", "karthick.r@college.edu", ""},
            {"fes012345", "Saranya", "E", "sara@example.com", "sara@college.edu", ""},
            {"fnm012345", "Murugavelli", "N", "muru@example.com", "muru@college.edu", ""},
            {"fms012345", "Sindhu", "M.P.", "sindhu@example.com", "sindhu@college.edu", ""},
            {"fbs012345", "Saravanan", "B", "sara.b@example.com", "sara.b@college.edu", ""},
            {"fpa012345", "Arunprakash", "P", "arun@example.com", "arun@college.edu", ""},
            {"frr012345", "Rajeswari", "R", "rajeswari@example.com", "rajeswari@college.edu", ""}
        };

        for (String[] t : teachers) {
            Optional<User> uOpt = userRepository.findByUsername(t[0]);
            if (uOpt.isPresent()) {
                Teacher teacher = teacherRepository.findByEmployeeId(t[0]).orElse(new Teacher());
                teacher.setEmployeeId(t[0]);
                teacher.setFirstName(t[1]);
                teacher.setLastName(t[2]);
                teacher.setPersonalEmail(t[3]);
                teacher.setCollegeEmail(t[4]);
                teacher.setClassAdvisorFor(t[5]);
                teacher.setDepartment(dept);
                teacher.setUser(uOpt.get());
                teacherRepository.save(teacher);
            }
        }

        // Restore Students
        String[][] students = {
            {"studenta", "StudentA", "A", "a@ex.com", "a@c.com", "1"},
            {"studentb", "StudentB", "B", "b@ex.com", "b@c.com", "1"},
            {"studentc", "StudentC", "C", "c@ex.com", "c@c.com", "1"},
            {"studentd", "StudentD", "D", "d@ex.com", "d@c.com", "2"},
            {"25CS315", "Shiva", "D", "s@ex.com", "s@c.com", "1"},
            {"25cs315", "SHIVA", "D", "s2@ex.com", "s2@c.com", "1"},
            {"25cs316", "SHIVA9293", "X", "s3@ex.com", "s3@c.com", "1"}
        };

        for (String[] s : students) {
            Optional<User> uOpt = userRepository.findByUsername(s[0]);
            if (uOpt.isPresent() && !studentRepository.findByRegisterNumber(s[0]).isPresent()) {
                Student student = new Student();
                student.setRegisterNumber(s[0]);
                student.setFirstName(s[1]);
                student.setLastName(s[2]);
                student.setEmail(s[3]);
                student.setCollegeEmail(s[4]);
                student.setDepartment(dept);
                student.setCourse(course);
                student.setSection(s[5].equals("1") ? sectionC : sectionD);
                student.setUser(uOpt.get());
                studentRepository.save(student);
            }
        }

        return ResponseEntity.ok("Restored test teachers and students successfully!");
    }
}
