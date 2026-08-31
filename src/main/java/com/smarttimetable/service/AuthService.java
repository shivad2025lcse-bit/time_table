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

    public LoginResponse login(LoginRequest loginRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
        User user = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow();

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
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

        if (!user.getEmail().equalsIgnoreCase(email.trim())) {
            throw new RuntimeException("Email address does not match account record.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setRawPassword(newPassword);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Password reset successfully for " + username + "! You can now log in with your new password.");
        return response;
    }
    public Map<String, Object> changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found."));

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
}
