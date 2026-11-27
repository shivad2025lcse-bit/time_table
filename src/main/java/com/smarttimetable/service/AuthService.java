package com.smarttimetable.service;

import com.smarttimetable.dto.LoginRequest;
import com.smarttimetable.dto.LoginResponse;
import com.smarttimetable.entity.Student;
import com.smarttimetable.entity.Teacher;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.StudentRepository;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.UserRepository;
import com.smarttimetable.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @jakarta.annotation.PostConstruct
    public void restoreTestUsers() {
        String[] tests = {
            "shiva25012007", "smithp012345", "studenta", "studentb", "studentc", "studentd", "25CS315", "25cs315", "25cs316",
            "fkeerj012345", "fsh012345", "fmk012345", "fns012345", "frk012345", "fes012345", "fnm012345", "fms012345", "fbs012345", "fpa012345", "frr012345"
        };
        for(String t : tests) {
            if(!userRepository.findByUsername(t).isPresent()) {
                com.smarttimetable.entity.User u = new com.smarttimetable.entity.User();
                u.setUsername(t);
                u.setEmail(t + "@example.com");
                u.setPassword(passwordEncoder.encode("password123"));
                u.setRawPassword("password123");
                if (t.equals("shiva25012007")) {
                    u.setRole(com.smarttimetable.entity.Role.ROLE_ADMIN);
                } else {
                    u.setRole(t.startsWith("f") || t.startsWith("smith") ? com.smarttimetable.entity.Role.ROLE_FACULTY : com.smarttimetable.entity.Role.ROLE_STUDENT);
                }
                u.setActive(true);
                userRepository.save(u);
            }
        }
    }

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User findUserByUsernameFlexible(String rawUsername) {
        String lookup = rawUsername != null ? rawUsername.trim() : "";
        return userRepository.findByUsername(lookup)
                .or(() -> userRepository.findByUsernameIgnoreCase(lookup))
                .orElse(null);
    }

    public LoginResponse login(LoginRequest loginRequest) {
        User user = findUserByUsernameFlexible(loginRequest.getUsername());
        if (user == null) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid username or password.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), loginRequest.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());

        String token = jwtUtil.generateToken(userDetails, user.getRole().name());

        String name = user.getUsername();
        if ("ROLE_FACULTY".equals(user.getRole().name())) {
            Optional<Teacher> t = teacherRepository.findByUserId(user.getId());
            if (t.isPresent()) name = t.get().getName();
        } else if ("ROLE_STUDENT".equals(user.getRole().name())) {
            Optional<Student> s = studentRepository.findByUserId(user.getId());
            if (s.isPresent()) name = s.get().getName();
        } else {
            name = "System Administrator";
        }

        return new LoginResponse(token, user.getUsername(), user.getRole().name(), user.getEmail(), user.getId(), name);
    }

    public Map<String, Object> resetPassword(String username, String email, String newPassword) {
        User user = findUserByUsernameFlexible(username);
        if (user == null) {
            throw new RuntimeException("User not found with username: " + username);
        }

        if (!user.getEmail().equalsIgnoreCase(email.trim())) {
            throw new RuntimeException("Email address does not match account record.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setRawPassword(newPassword);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Password reset successfully for " + user.getUsername() + "! You can now log in with your new password.");
        return response;
    }
    public Map<String, Object> changePassword(String username, String currentPassword, String newPassword) {
        User user = findUserByUsernameFlexible(username);
        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setRawPassword(newPassword);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Password changed successfully! Your account is now secured with the new password.");
        return response;
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteUserByUsername(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getRole().name().equals("ROLE_STUDENT")) {
                Optional<Student> studentOpt = studentRepository.findByUserId(user.getId());
                studentOpt.ifPresent(student -> studentRepository.delete(student));
            } else if (user.getRole().name().equals("ROLE_FACULTY")) {
                Optional<Teacher> teacherOpt = teacherRepository.findByUserId(user.getId());
                teacherOpt.ifPresent(teacher -> teacherRepository.delete(teacher));
            }
            userRepository.delete(user);
        }
    }
}
