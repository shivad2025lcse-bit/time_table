package com.smarttimetable.service;

import com.smarttimetable.entity.Teacher;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import com.smarttimetable.repository.QuizRepository;
import com.smarttimetable.repository.TimetableRepository;
import com.smarttimetable.repository.FacultyAvailabilityRepository;
import com.smarttimetable.repository.UserRepository;
import com.smarttimetable.service.QuizService;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    public Optional<Teacher> getTeacherById(Long id) {
        return teacherRepository.findById(id);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private TimetableRepository timetableRepository;
    
    @Autowired
    private FacultyAvailabilityRepository facultyAvailabilityRepository;
    
    @Autowired
    private QuizService quizService;
    
    @Autowired
    private QuizRepository quizRepository;

    public Teacher saveTeacher(Teacher teacher) {
        if (teacher.getDepartment() != null && teacher.getDepartment().getId() == null) {
            Department existingDept = null;
            if (teacher.getDepartment().getCode() != null) {
                existingDept = departmentRepository.findByCode(teacher.getDepartment().getCode()).orElse(null);
            } else if (teacher.getDepartment().getName() != null) {
                existingDept = departmentRepository.findByName(teacher.getDepartment().getName()).orElse(null);
            }
            
            if (existingDept != null) {
                teacher.setDepartment(existingDept);
            } else {
                // Auto-create department if it doesn't exist
                if (teacher.getDepartment().getName() == null && teacher.getDepartment().getCode() != null) {
                    teacher.getDepartment().setName(teacher.getDepartment().getCode());
                } else if (teacher.getDepartment().getCode() == null && teacher.getDepartment().getName() != null) {
                    teacher.getDepartment().setCode(teacher.getDepartment().getName().substring(0, Math.min(4, teacher.getDepartment().getName().length())).toUpperCase());
                }
                departmentRepository.save(teacher.getDepartment());
            }
        }
        if (teacher.getId() == null && teacher.getUser() == null) {
            String firstName = teacher.getFirstName() != null ? teacher.getFirstName().toLowerCase().replaceAll("[^a-z]", "") : "";
            String lastName = teacher.getLastName() != null ? teacher.getLastName().toLowerCase().replaceAll("[^a-z]", "") : "";
            
            String firstPart = firstName.length() >= 4 ? firstName.substring(0, 4) : firstName;
            String lastPart = lastName.length() >= 1 ? lastName.substring(0, 1) : lastName;
            
            String baseUser = firstPart + lastPart + "012345";
            String username = "f" + baseUser;
            
            com.smarttimetable.entity.User user = userRepository.findByUsername(username).orElse(null);
            
            if (user == null) {
                user = new com.smarttimetable.entity.User(
                    username, 
                    passwordEncoder.encode(baseUser), 
                    baseUser,
                    com.smarttimetable.entity.Role.ROLE_FACULTY, 
                    teacher.getCollegeEmail(), 
                    true
                );
            } else {
                user.setPassword(passwordEncoder.encode(baseUser));
                user.setRawPassword(baseUser);
                user.setEmail(teacher.getCollegeEmail());
                user.setRole(com.smarttimetable.entity.Role.ROLE_FACULTY);
                user.setActive(true);
            }
            
            user = userRepository.save(user);
            teacher.setUser(user);
        }
        return teacherRepository.save(teacher);
    }

    public void deleteTeacher(Long id) {
        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher != null) {
            // Cascade delete quizzes
            quizRepository.findByTeacherId(id).forEach(q -> {
                quizService.deleteQuiz(q.getId());
            });
            
            // Cascade delete timetables
            timetableRepository.deleteAll(timetableRepository.findByTeacherId(id));
            
            // Cascade delete availability
            facultyAvailabilityRepository.deleteAll(facultyAvailabilityRepository.findByTeacherId(id));
            
            // Delete teacher
            teacherRepository.deleteById(id);
            
            // Delete user if exists
            if (teacher.getUser() != null) {
                userRepository.deleteById(teacher.getUser().getId());
            }
        }
    }
}
