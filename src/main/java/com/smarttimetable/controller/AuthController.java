package com.smarttimetable.controller;

import com.smarttimetable.dto.LoginRequest;
import com.smarttimetable.dto.LoginResponse;
import com.smarttimetable.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
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
}
