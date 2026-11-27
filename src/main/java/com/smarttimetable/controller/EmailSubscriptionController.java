package com.smarttimetable.controller;

import com.smarttimetable.entity.User;
import com.smarttimetable.repository.UserRepository;
import com.smarttimetable.service.EmailNotificationService;
import com.smarttimetable.service.EmailSubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email-subscriptions")
@CrossOrigin(origins = "*")
public class EmailSubscriptionController {

    @Autowired private EmailSubscriptionService subscriptionService;
    @Autowired private EmailNotificationService emailNotificationService;
    @Autowired private UserRepository userRepository;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMySubscription(Authentication authentication) {
        User user = requireUser(authentication);
        return ResponseEntity.ok(subscriptionService.getSubscriptionStatus(user));
    }

    @PostMapping("/send-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            User user = requireUser(authentication);
            String email = request.get("email") != null ? request.get("email").toString() : "";
            return ResponseEntity.ok(subscriptionService.registerOrSendOtp(user, email));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            User user = requireUser(authentication);
            String otp = request.get("otp") != null ? request.get("otp").toString() : "";
            return ResponseEntity.ok(subscriptionService.verifyOtp(user, otp));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.LOCKED).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/toggle")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> toggle(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            User user = requireUser(authentication);
            boolean enabled = Boolean.TRUE.equals(request.get("enabled"));
            return ResponseEntity.ok(subscriptionService.toggleNotifications(user, enabled));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/admin/config")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> getProviderConfig() {
        return ResponseEntity.ok(emailNotificationService.getMaskedProviderConfig());
    }

    @PostMapping("/admin/config")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> saveProviderConfig(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            User admin = requireUser(authentication);
            return ResponseEntity.ok(emailNotificationService.saveProviderConfig(request, admin.getUsername()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/admin/test-email")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> sendAdminTestEmail(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            User admin = requireUser(authentication);
            String toEmail = request.get("toEmail") != null ? request.get("toEmail").toString().trim() : "";
            if (toEmail.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Recipient email address is required."));
            }
            return ResponseEntity.ok(emailNotificationService.sendTestEmail(admin, toEmail));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    private User requireUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found."));
    }
}
