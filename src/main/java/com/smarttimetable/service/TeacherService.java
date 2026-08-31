package com.smarttimetable.service;

import com.smarttimetable.entity.Teacher;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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
    private com.smarttimetable.repository.UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public Teacher saveTeacher(Teacher teacher) {
        if (teacher.getDepartment() != null && teacher.getDepartment().getId() == null) {
            if (teacher.getDepartment().getCode() != null) {
                departmentRepository.findByCode(teacher.getDepartment().getCode())
                    .ifPresent(teacher::setDepartment);
            } else if (teacher.getDepartment().getName() != null) {
                departmentRepository.findByName(teacher.getDepartment().getName())
                    .ifPresent(teacher::setDepartment);
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
        teacherRepository.deleteById(id);
    }
}
