package com.smarttimetable.controller;

import com.smarttimetable.dto.LoginRequest;
import com.smarttimetable.dto.LoginResponse;
import com.smarttimetable.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @Autowired
    private com.smarttimetable.repository.UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @org.springframework.web.bind.annotation.GetMapping("/restore-tests")
    public String restoreTests() {
        String[] tests = {"studenta", "studentb", "studentc", "studentd", "25CS315", "25cs315", "25cs316"};
        for(String t : tests) {
            if(!userRepository.findByUsername(t).isPresent()) {
                com.smarttimetable.entity.User u = new com.smarttimetable.entity.User();
                u.setUsername(t);
                u.setPassword(passwordEncoder.encode("password123"));
                u.setRawPassword("password123");
                u.setRole(com.smarttimetable.entity.Role.ROLE_STUDENT);
                u.setActive(true);
                userRepository.save(u);
            }
        }
        return "Done";
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException ex) {
            String attemptedUser = loginRequest != null && loginRequest.getUsername() != null
                    ? loginRequest.getUsername().trim() : "";
            log.warn("Failed login attempt for username='{}': {}", attemptedUser, ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password."));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String newPassword
    ) {
        return ResponseEntity.ok(authService.resetPassword(username, email, newPassword));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            Authentication authentication,
            @RequestParam String currentPassword,
            @RequestParam String newPassword
    ) {
        String username = authentication.getName();
        return ResponseEntity.ok(authService.changePassword(username, currentPassword, newPassword));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/user/{username}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteUser(@org.springframework.web.bind.annotation.PathVariable String username) {
        authService.deleteUserByUsername(username);
        return ResponseEntity.ok().build();
    }
}
