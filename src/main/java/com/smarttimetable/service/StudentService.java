package com.smarttimetable.service;

import com.smarttimetable.entity.Student;
import com.smarttimetable.repository.StudentRepository;
import org.springframework.stereotype.Service;
import com.smarttimetable.repository.DepartmentRepository;
import com.smarttimetable.repository.CourseRepository;
import com.smarttimetable.repository.SectionRepository;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    @org.springframework.beans.factory.annotation.Autowired
    private StudentRepository studentRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private DepartmentRepository departmentRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private CourseRepository courseRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private SectionRepository sectionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.smarttimetable.repository.UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }

    @org.springframework.transaction.annotation.Transactional
    public Student saveStudent(Student student) {
        if (student.getDepartment() != null && student.getDepartment().getId() == null && student.getDepartment().getName() != null) {
            student.setDepartment(departmentRepository.findByCode(student.getDepartment().getName())
                    .orElseGet(() -> departmentRepository.findByName(student.getDepartment().getName())
                    .orElseGet(() -> {
                        com.smarttimetable.entity.Department d = new com.smarttimetable.entity.Department();
                        d.setName(student.getDepartment().getName());
                        d.setCode(student.getDepartment().getName().toUpperCase());
                        return departmentRepository.save(d);
                    })));
        }
        if (student.getCourse() != null && student.getCourse().getId() == null && student.getCourse().getName() != null) {
            student.setCourse(courseRepository.findByCode(student.getCourse().getName())
                    .orElseGet(() -> courseRepository.findByName(student.getCourse().getName())
                    .orElseGet(() -> {
                        com.smarttimetable.entity.Course c = new com.smarttimetable.entity.Course();
                        c.setName(student.getCourse().getName());
                        c.setCode(student.getCourse().getName().toUpperCase());
                        c.setDepartment(student.getDepartment());
                        return courseRepository.save(c);
                    })));
        }
        if (student.getSection() != null && student.getSection().getId() == null && student.getSection().getSectionName() != null) {
            student.setSection(sectionRepository.findBySectionName(student.getSection().getSectionName())
                    .orElseGet(() -> {
                        com.smarttimetable.entity.Section s = new com.smarttimetable.entity.Section();
                        s.setSectionName(student.getSection().getSectionName());
                        s.setCourse(student.getCourse());
                        s.setSemester(student.getSemester());
                        return sectionRepository.save(s);
                    }));
        }

        if (student.getId() == null && student.getSection() != null && student.getSection().getId() != null) {
            long currentCount = studentRepository.countBySectionId(student.getSection().getId());
            if (currentCount >= 80) {
                throw new IllegalStateException("Section has reached its maximum capacity of 80 students.");
            }
        }
        
        if (student.getId() == null && student.getUser() == null) {
            String username = student.getRegisterNumber().toLowerCase();
            String firstName = student.getFirstName() != null ? student.getFirstName().toUpperCase().split(" ")[0] : "";
            String phone = student.getPhone() != null ? student.getPhone().replaceAll("\\D", "") : "";
            String last4 = phone.length() >= 4 ? phone.substring(phone.length() - 4) : "0000";
            String password = firstName + last4;
            
            // Check for orphaned user record from previous deletion before cascade was added
            com.smarttimetable.entity.User user = userRepository.findByUsername(username).orElse(null);
            
            if (user == null) {
                user = new com.smarttimetable.entity.User(
                    username,
                    passwordEncoder.encode(password),
                    com.smarttimetable.entity.Role.ROLE_STUDENT,
                    student.getEmail(),
                    true
                );
            } else {
                // Reuse orphaned user and reset password/email
                user.setPassword(passwordEncoder.encode(password));
                user.setEmail(student.getEmail());
                user.setRole(com.smarttimetable.entity.Role.ROLE_STUDENT);
                user.setActive(true);
            }
            user = userRepository.save(user);
            student.setUser(user);
        }
        
        return studentRepository.save(student);
    }

    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }
}
