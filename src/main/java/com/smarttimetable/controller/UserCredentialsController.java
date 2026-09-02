package com.smarttimetable.controller;

import com.smarttimetable.entity.Role;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/credentials")
@CrossOrigin(origins = "*")
public class UserCredentialsController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Returns username + rawPassword for all users, grouped by role.
     * Restricted to ADMIN only.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Map<String, String>>> getAllCredentials(
            @RequestParam(required = false) String role) {

        List<User> users;
        if (role != null && !role.isBlank()) {
            try {
                Role r = Role.valueOf(role.toUpperCase());
                users = userRepository.findAll().stream()
                        .filter(u -> u.getRole() == r)
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                users = userRepository.findAll();
            }
        } else {
            users = userRepository.findAll();
        }

        List<Map<String, String>> result = users.stream().map(u -> {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("username", u.getUsername());
            m.put("rawPassword", u.getRawPassword() != null ? u.getRawPassword() : "(encrypted)");
            m.put("role", u.getRole() != null ? u.getRole().name() : "");
            m.put("email", u.getEmail() != null ? u.getEmail() : "");
            m.put("active", String.valueOf(u.isActive()));
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
