package com.smarttimetable.service;

import com.smarttimetable.entity.EmailSubscription;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.EmailSubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class EmailSubscriptionService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private EmailSubscriptionRepository subscriptionRepository;

    @Autowired
    private EmailNotificationService emailNotificationService;

    public Map<String, Object> getSubscriptionStatus(User user) {
        EmailSubscription sub = subscriptionRepository.findByUserId(user.getId()).orElse(null);
        return toResponseMap(user, sub);
    }

    @Transactional
    public Map<String, Object> registerOrSendOtp(User user, String rawEmail) {
        String email = rawEmail != null ? rawEmail.trim().toLowerCase() : "";
        if (email.isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Please enter a valid email address.");
        }

        LocalDateTime now = LocalDateTime.now();
        EmailSubscription sub = subscriptionRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    EmailSubscription s = new EmailSubscription();
                    s.setUser(user);
                    return s;
                });

        if (sub.getOtpLockedUntil() != null && sub.getOtpLockedUntil().isAfter(now)) {
            long mins = Math.max(1, Duration.between(now, sub.getOtpLockedUntil()).toMinutes());
            throw new IllegalStateException("Too many invalid OTP attempts. Try again in " + mins + " minute(s).");
        }

        if (sub.getOtpLastSentAt() != null && email.equalsIgnoreCase(sub.getEmail())) {
            long elapsed = Duration.between(sub.getOtpLastSentAt(), now).getSeconds();
            if (elapsed < RESEND_COOLDOWN_SECONDS) {
                long remaining = RESEND_COOLDOWN_SECONDS - elapsed;
                throw new IllegalStateException("Please wait " + remaining + " seconds before requesting a new OTP.");
            }
        }

        if (!email.equalsIgnoreCase(sub.getEmail())) {
            sub.setVerified(false);
        }

        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        sub.setEmail(email);
        sub.setVerified(false);
        sub.setOtpCodeHash(hashOtp(email, otp));
        sub.setOtpExpiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES));
        sub.setOtpLastSentAt(now);
        sub.setOtpAttempts(0);
        sub.setOtpLockedUntil(null);

        sub = subscriptionRepository.save(sub);
        String deliveryStatus = emailNotificationService.sendOtpVerificationEmail(user, email, otp);
        if ("FAILED".equalsIgnoreCase(deliveryStatus)) {
            sub.setOtpLastSentAt(null);
            subscriptionRepository.save(sub);
            throw new IllegalArgumentException("Could not deliver OTP email to " + email + ". Verify SMTP / Brevo settings in Admin Email Settings and retry.");
        }

        Map<String, Object> res = toResponseMap(user, sub);
        res.put("deliveryStatus", deliveryStatus);
        if ("SIMULATED".equalsIgnoreCase(deliveryStatus)) {
            // In local/dev environments without Brevo/SMTP credentials, surface dev OTP so verification can be completed immediately
            res.put("simulatedOtp", otp);
            res.put("message", "No live email provider (Brevo/SMTP) is configured yet, so no external inbox email was sent. Local Dev OTP: " + otp);
        } else {
            res.put("message", "A 6-digit OTP has been sent to " + email + ". Please check your inbox (and spam folder).");
        }
        return res;
    }

    @Transactional
    public Map<String, Object> verifyOtp(User user, String rawOtp) {
        String otp = rawOtp != null ? rawOtp.trim() : "";
        if (!otp.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("OTP must be a 6-digit number.");
        }

        EmailSubscription sub = subscriptionRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("No email registration found. Please request an OTP first."));

        LocalDateTime now = LocalDateTime.now();
        if (sub.getOtpLockedUntil() != null && sub.getOtpLockedUntil().isAfter(now)) {
            long mins = Math.max(1, Duration.between(now, sub.getOtpLockedUntil()).toMinutes());
            throw new IllegalStateException("Account OTP verification temporarily locked. Try again in " + mins + " minute(s).");
        }

        if (sub.getOtpCodeHash() == null || sub.getOtpExpiresAt() == null) {
            throw new IllegalArgumentException("No active OTP found. Please request a new OTP.");
        }

        if (sub.getOtpExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException("OTP has expired. Please request a new 6-digit OTP.");
        }

        String candidateHash = hashOtp(sub.getEmail(), otp);
        if (!MessageDigest.isEqual(candidateHash.getBytes(StandardCharsets.UTF_8), sub.getOtpCodeHash().getBytes(StandardCharsets.UTF_8))) {
            int attempts = (sub.getOtpAttempts() != null ? sub.getOtpAttempts() : 0) + 1;
            sub.setOtpAttempts(attempts);
            if (attempts >= MAX_OTP_ATTEMPTS) {
                sub.setOtpLockedUntil(now.plusMinutes(LOCKOUT_MINUTES));
                subscriptionRepository.save(sub);
                throw new IllegalStateException("Maximum OTP attempts exceeded. Please retry after " + LOCKOUT_MINUTES + " minutes.");
            }
            subscriptionRepository.save(sub);
            throw new IllegalArgumentException("Invalid OTP. " + (MAX_OTP_ATTEMPTS - attempts) + " attempt(s) remaining.");
        }

        sub.setVerified(true);
        sub.setNotificationsEnabled(true);
        sub.setOtpCodeHash(null);
        sub.setOtpExpiresAt(null);
        sub.setOtpAttempts(0);
        sub.setOtpLockedUntil(null);
        sub = subscriptionRepository.save(sub);

        Map<String, Object> res = toResponseMap(user, sub);
        res.put("message", "Email verified successfully! Timetable change notifications are now active.");
        return res;
    }

    @Transactional
    public Map<String, Object> toggleNotifications(User user, boolean enabled) {
        EmailSubscription sub = subscriptionRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Please register and verify your email address first."));
        sub.setNotificationsEnabled(enabled);
        sub = subscriptionRepository.save(sub);
        Map<String, Object> res = toResponseMap(user, sub);
        res.put("message", enabled ? "Email notifications enabled." : "Email notifications paused.");
        return res;
    }

    public String hashOtp(String email, String otp) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest((email.trim().toLowerCase() + ":" + otp).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to hash OTP", ex);
        }
    }

    private Map<String, Object> toResponseMap(User user, EmailSubscription sub) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("username", user.getUsername());
        m.put("provider", emailNotificationService.resolveActiveProvider());
        if (sub == null) {
            m.put("registered", false);
            m.put("email", "");
            m.put("verified", false);
            m.put("notificationsEnabled", false);
            m.put("cooldownSecondsRemaining", 0);
            m.put("attemptsRemaining", MAX_OTP_ATTEMPTS);
            return m;
        }
        LocalDateTime now = LocalDateTime.now();
        long cooldown = 0;
        if (sub.getOtpLastSentAt() != null) {
            long elapsed = Duration.between(sub.getOtpLastSentAt(), now).getSeconds();
            if (elapsed < RESEND_COOLDOWN_SECONDS) cooldown = RESEND_COOLDOWN_SECONDS - elapsed;
        }
        m.put("registered", true);
        m.put("email", sub.getEmail());
        m.put("verified", sub.isVerified());
        m.put("notificationsEnabled", sub.isNotificationsEnabled());
        m.put("cooldownSecondsRemaining", cooldown);
        m.put("otpPending", sub.getOtpExpiresAt() != null && sub.getOtpExpiresAt().isAfter(now));
        m.put("otpExpiresAt", sub.getOtpExpiresAt() != null ? sub.getOtpExpiresAt().toString() : null);
        m.put("attemptsRemaining", Math.max(0, MAX_OTP_ATTEMPTS - (sub.getOtpAttempts() != null ? sub.getOtpAttempts() : 0)));
        m.put("lockedUntil", sub.getOtpLockedUntil() != null && sub.getOtpLockedUntil().isAfter(now) ? sub.getOtpLockedUntil().toString() : null);
        return m;
    }
}
