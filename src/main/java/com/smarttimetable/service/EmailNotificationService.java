package com.smarttimetable.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);
    private static final List<String> DELIVERED_STATUSES = List.of("SENT", "SIMULATED");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private TemporaryTimetableChangeRepository changeRepository;

    @Autowired
    private EmailSubscriptionRepository subscriptionRepository;

    @Autowired
    private EmailNotificationLogRepository logRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private EmailProviderConfigRepository providerConfigRepository;

    @Value("${app.email.provider:AUTO}")
    private String configuredProvider;

    @Value("${app.email.from-address:noreply@smarttimetable.edu}")
    private String fromAddress;

    @Value("${app.email.from-name:College Timetable Management System}")
    private String fromName;

    @Value("${app.email.brevo.api-key:}")
    private String brevoApiKey;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${spring.mail.port:587}")
    private Integer smtpPort;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public record RecipientTarget(User user, String name, String email, String roleLabel) {}

    private record EffectiveMailSettings(
            String mode, String fromAddr, String fromDisp, String brevoKey,
            String host, int port, String user, String pass
    ) {}

    private EffectiveMailSettings getEffectiveSettings() {
        EmailProviderConfig db = providerConfigRepository.findTopByOrderByIdDesc().orElse(null);
        String mode = (db != null && db.getProvider() != null && !db.getProvider().isBlank()) ? db.getProvider().trim().toUpperCase() : (configuredProvider != null ? configuredProvider.trim().toUpperCase() : "AUTO");
        String fAddr = (db != null && db.getFromAddress() != null && !db.getFromAddress().isBlank()) ? db.getFromAddress().trim() : fromAddress;
        String fName = (db != null && db.getFromName() != null && !db.getFromName().isBlank()) ? db.getFromName().trim() : fromName;
        String bKey = (db != null && db.getBrevoApiKey() != null && !db.getBrevoApiKey().isBlank()) ? db.getBrevoApiKey().trim() : (brevoApiKey != null ? brevoApiKey.trim() : "");
        String host = (db != null && db.getSmtpHost() != null && !db.getSmtpHost().isBlank()) ? db.getSmtpHost().trim() : (smtpHost != null ? smtpHost.trim() : "");
        int port = (db != null && db.getSmtpPort() != null && db.getSmtpPort() > 0) ? db.getSmtpPort() : (smtpPort != null ? smtpPort : 587);
        String user = (db != null && db.getSmtpUsername() != null && !db.getSmtpUsername().isBlank()) ? db.getSmtpUsername().trim() : (smtpUsername != null ? smtpUsername.trim() : "");
        String pass = (db != null && db.getSmtpPassword() != null && !db.getSmtpPassword().isBlank()) ? db.getSmtpPassword().trim() : (smtpPassword != null ? smtpPassword.trim() : "");
        return new EffectiveMailSettings(mode, fAddr, fName, bKey, host, port, user, pass);
    }

    public String resolveActiveProvider() {
        EffectiveMailSettings s = getEffectiveSettings();
        boolean hasBrevo = !s.brevoKey().isBlank();
        boolean hasSmtp = !s.host().isBlank() && !s.user().isBlank() && !s.pass().isBlank();
        if ("BREVO".equals(s.mode()) && hasBrevo) return "BREVO";
        if ("SMTP".equals(s.mode()) && (hasSmtp || (mailSender != null && !s.host().isBlank()))) return "SMTP";
        if ("AUTO".equals(s.mode())) {
            if (hasBrevo) return "BREVO";
            if (hasSmtp) return "SMTP";
        }
        return "SIMULATED";
    }

    public Map<String, Object> getMaskedProviderConfig() {
        EffectiveMailSettings s = getEffectiveSettings();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("activeProvider", resolveActiveProvider());
        m.put("configuredMode", s.mode());
        m.put("fromAddress", s.fromAddr());
        m.put("fromName", s.fromDisp());
        m.put("brevoConfigured", !s.brevoKey().isBlank());
        m.put("smtpHost", s.host());
        m.put("smtpPort", s.port());
        m.put("smtpUsername", s.user());
        m.put("smtpPasswordConfigured", !s.pass().isBlank());
        return m;
    }

    @Transactional
    public Map<String, Object> saveProviderConfig(Map<String, Object> req, String actor) {
        EmailProviderConfig cfg = providerConfigRepository.findTopByOrderByIdDesc().orElseGet(EmailProviderConfig::new);
        if (req.get("provider") != null) cfg.setProvider(req.get("provider").toString().trim().toUpperCase());
        if (req.get("fromAddress") != null) cfg.setFromAddress(req.get("fromAddress").toString().trim());
        if (req.get("fromName") != null) cfg.setFromName(req.get("fromName").toString().trim());
        if (req.get("brevoApiKey") != null && !req.get("brevoApiKey").toString().trim().isEmpty()) {
            cfg.setBrevoApiKey(req.get("brevoApiKey").toString().trim());
        }
        if (req.get("smtpHost") != null) cfg.setSmtpHost(req.get("smtpHost").toString().trim());
        if (req.get("smtpPort") != null && !req.get("smtpPort").toString().trim().isEmpty()) {
            cfg.setSmtpPort(Integer.parseInt(req.get("smtpPort").toString().trim()));
        }
        if (req.get("smtpUsername") != null) cfg.setSmtpUsername(req.get("smtpUsername").toString().trim());
        if (req.get("smtpPassword") != null && !req.get("smtpPassword").toString().trim().isEmpty()) {
            cfg.setSmtpPassword(req.get("smtpPassword").toString().trim());
        }
        cfg.setUpdatedBy(actor);
        providerConfigRepository.save(cfg);
        return getMaskedProviderConfig();
    }

    @Transactional
    public Map<String, Object> sendTestEmail(User actorUser, String toEmail) {
        String html = buildOtpHtmlTemplate(actorUser != null ? actorUser.getUsername() : "Admin", "123456")
                .replace("Email Verification OTP", "Timetable Email Test Delivery");
        EmailNotificationLog entry = sendAndLog(
                actorUser,
                actorUser != null ? actorUser.getUsername() : toEmail,
                "ADMIN_TEST",
                toEmail.trim().toLowerCase(),
                null,
                1,
                "ADMIN_TEST_EMAIL",
                "Test Email - College Timetable Notification System",
                html
        );
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("status", entry.getNotificationStatus());
        res.put("provider", entry.getProvider());
        res.put("errorMessage", entry.getErrorMessage() != null ? entry.getErrorMessage() : "");
        return res;
    }

    @Async
    @Transactional
    public void dispatchTemporaryChangeEmailsAsync(Long changeId, String eventType, Integer revision) {
        try {
            TemporaryTimetableChange change = changeRepository.findById(changeId).orElse(null);
            if (change == null) return;
            dispatchTemporaryChangeEmailsSync(change, eventType, revision != null ? revision : change.getRevision());
        } catch (Exception ex) {
            log.error("Async email dispatch failed for changeId={}: {}", changeId, ex.getMessage());
        }
    }

    @Transactional
    public int dispatchTemporaryChangeEmailsSync(TemporaryTimetableChange change, String eventType, int revision) {
        if (change == null) return 0;
        List<RecipientTarget> recipients = resolveAffectedRecipients(change);
        int processed = 0;

        String subject = buildEmailSubject(change, eventType);

        for (RecipientTarget target : recipients) {
            String normalizedEmail = target.email().trim().toLowerCase();
            boolean alreadySent = logRepository.existsByTemporaryChangeIdAndEmailIgnoreCaseAndEventTypeAndChangeRevisionAndNotificationStatusIn(
                    change.getId(), normalizedEmail, eventType, revision, DELIVERED_STATUSES
            );
            if (alreadySent) {
                continue;
            }

            String htmlBody = buildChangeHtmlTemplate(change, target, eventType);
            sendAndLog(target.user(), target.name(), target.roleLabel(), normalizedEmail, change, revision, eventType, subject, htmlBody);
            processed++;
        }
        return processed;
    }

    @Transactional
    public String sendOtpVerificationEmail(User user, String email, String otpCode) {
        String subject = "Email Verification OTP - College Timetable Viewer";
        String html = buildOtpHtmlTemplate(user != null ? user.getUsername() : "User", otpCode);
        EmailNotificationLog entry = sendAndLog(
                user,
                user != null ? user.getUsername() : email,
                user != null && user.getRole() != null ? user.getRole().name() : "USER",
                email.trim().toLowerCase(),
                null,
                1,
                "OTP_VERIFICATION",
                subject,
                html
        );
        return entry.getNotificationStatus();
    }

    public List<RecipientTarget> resolveAffectedRecipients(TemporaryTimetableChange change) {
        Map<String, RecipientTarget> uniqueByEmail = new LinkedHashMap<>();

        List<EmailSubscription> activeSubs = subscriptionRepository.findByVerifiedTrueAndNotificationsEnabledTrue();
        Map<Long, EmailSubscription> subByUserId = new HashMap<>();
        for (EmailSubscription sub : activeSubs) {
            if (sub.getUser() != null && sub.getUser().getId() != null) {
                subByUserId.put(sub.getUser().getId(), sub);
            }
        }

        // 1. Affected Students in the target section (verified + notifications enabled)
        if (change.getSection() != null && change.getSection().getId() != null) {
            List<Student> sectionStudents = studentRepository.findBySectionId(change.getSection().getId());
            for (Student st : sectionStudents) {
                if (st.getUser() == null) continue;
                EmailSubscription sub = subByUserId.get(st.getUser().getId());
                if (sub != null) {
                    String email = sub.getEmail().trim().toLowerCase();
                    uniqueByEmail.putIfAbsent(email, new RecipientTarget(
                            st.getUser(),
                            (st.getFirstName() + " " + st.getLastName()).trim(),
                            email,
                            "STUDENT"
                    ));
                }
            }
        }

        // 2. Original Faculty
        addTeacherRecipient(change.getOriginalFaculty(), "ORIGINAL_FACULTY", subByUserId, uniqueByEmail);
        // 3. Replacement Faculty
        addTeacherRecipient(change.getReplacementFaculty(), "REPLACEMENT_FACULTY", subByUserId, uniqueByEmail);

        return new ArrayList<>(uniqueByEmail.values());
    }

    private void addTeacherRecipient(
            Teacher teacher,
            String roleLabel,
            Map<Long, EmailSubscription> subByUserId,
            Map<String, RecipientTarget> out
    ) {
        if (teacher == null || teacher.getUser() == null || teacher.getUser().getId() == null) return;
        EmailSubscription sub = subByUserId.get(teacher.getUser().getId());
        if (sub != null) {
            String email = sub.getEmail().trim().toLowerCase();
            String disp = (teacher.getDisplayName() != null && !teacher.getDisplayName().isBlank())
                    ? teacher.getDisplayName()
                    : ((teacher.getFirstName() != null ? teacher.getFirstName() : "") + " " +
                       (teacher.getLastName() != null ? teacher.getLastName() : "")).trim();
            out.putIfAbsent(email, new RecipientTarget(teacher.getUser(), disp, email, roleLabel));
        }
    }

    private EmailNotificationLog sendAndLog(
            User user,
            String recipientName,
            String recipientRole,
            String email,
            TemporaryTimetableChange change,
            int revision,
            String eventType,
            String subject,
            String htmlBody
    ) {
        EmailNotificationLog record = new EmailNotificationLog();
        record.setUser(user);
        record.setRecipientName(recipientName);
        record.setRecipientRole(recipientRole);
        record.setEmail(email);
        record.setTemporaryChange(change);
        record.setChangeRevision(revision);
        record.setEventType(eventType);
        record.setEmailSubject(subject);

        String provider = resolveActiveProvider();
        record.setProvider(provider);

        try {
            if ("BREVO".equals(provider)) {
                sendViaBrevo(email, recipientName, subject, htmlBody);
                record.setNotificationStatus("SENT");
            } else if ("SMTP".equals(provider)) {
                sendViaSmtp(email, subject, htmlBody);
                record.setNotificationStatus("SENT");
            } else {
                log.info("[EMAIL SIMULATION] To={} <{}> | Subject={} | Event={}", recipientName, email, subject, eventType);
                record.setNotificationStatus("SIMULATED");
            }
        } catch (Exception ex) {
            log.error("Email delivery failed to {}: {}", email, ex.getMessage());
            record.setNotificationStatus("FAILED");
            String msg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            record.setErrorMessage(msg.length() > 950 ? msg.substring(0, 950) : msg);
        }
        return logRepository.save(record);
    }

    protected void sendViaBrevo(String toEmail, String toName, String subject, String htmlContent) throws Exception {
        EffectiveMailSettings s = getEffectiveSettings();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sender", Map.of("name", s.fromDisp(), "email", s.fromAddr()));
        payload.put("to", List.of(Map.of("email", toEmail, "name", toName != null && !toName.isBlank() ? toName : toEmail)));
        payload.put("subject", subject);
        payload.put("htmlContent", htmlContent);

        String json = objectMapper.writeValueAsString(payload);
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .timeout(Duration.ofSeconds(15))
                .header("accept", "application/json")
                .header("content-type", "application/json")
                .header("api-key", s.brevoKey())
                .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            throw new IllegalStateException("Brevo API returned HTTP " + resp.statusCode() + ": " + resp.body());
        }
    }

    protected void sendViaSmtp(String toEmail, String subject, String htmlContent) throws Exception {
        EffectiveMailSettings s = getEffectiveSettings();
        JavaMailSender senderToUse = mailSender;
        if (!s.host().isBlank() && !s.user().isBlank() && !s.pass().isBlank()) {
            JavaMailSenderImpl dynamicSender = new JavaMailSenderImpl();
            dynamicSender.setHost(s.host());
            dynamicSender.setPort(s.port());
            dynamicSender.setUsername(s.user());
            dynamicSender.setPassword(s.pass());
            dynamicSender.setDefaultEncoding("UTF-8");
            Properties props = dynamicSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.timeout", "12000");
            props.put("mail.smtp.connectiontimeout", "12000");
            senderToUse = dynamicSender;
        }
        if (senderToUse == null) {
            throw new IllegalStateException("SMTP mail sender is not configured");
        }
        MimeMessage message = senderToUse.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        String effectiveFrom = !s.fromAddr().isBlank() ? s.fromAddr() : s.user();
        helper.setFrom(effectiveFrom, s.fromDisp());
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        senderToUse.send(message);
    }

    public String buildEmailSubject(TemporaryTimetableChange change, String eventType) {
        String sec = change.getSectionName() != null ? change.getSectionName() : "Class";
        if ("TEMP_CHANGE_CANCELLED".equals(eventType)) {
            return "Temporary Timetable Change Cancelled - " + sec;
        }
        if ("TEMP_CHANGE_MODIFIED".equals(eventType)) {
            return "Updated Temporary Timetable Change - " + sec;
        }
        return switch (change.getChangeType()) {
            case PERIOD_CANCELLATION -> "Period Cancelled Notification - " + sec;
            case FACULTY_SUBSTITUTION -> "Faculty Substitution Alert - " + sec;
            case CLASSROOM_CHANGE -> "Classroom Change Notice - " + sec;
            case EXTRA_CLASS -> "Extra Class Scheduled - " + sec;
            case PERIOD_TIME_CHANGE -> "Period Timing Change - " + sec;
            case FREE_PERIOD -> "Free Period Notice - " + sec;
            case SPECIAL_CLASS -> "Special Class / Event Schedule - " + sec;
            default -> "Temporary Timetable Change - " + sec;
        };
    }

    public String buildChangeHtmlTemplate(TemporaryTimetableChange c, RecipientTarget target, String eventType) {
        String deptCode = c.getDepartment() != null && c.getDepartment().getCode() != null ? c.getDepartment().getCode() : "-";
        String yearStr = c.getAcademicYear() != null ? c.getAcademicYear() : "-";
        String dateRange = (c.getStartDate() != null && c.getEndDate() != null && !c.getStartDate().equals(c.getEndDate()))
                ? DATE_FMT.format(c.getStartDate()) + " to " + DATE_FMT.format(c.getEndDate())
                : (c.getChangeDate() != null ? DATE_FMT.format(c.getChangeDate()) : "-");

        String greeting = "Dear " + (target.name() != null && !target.name().isBlank() ? esc(target.name()) : "Member") + ",";
        String headline;
        String accent;
        if ("TEMP_CHANGE_CANCELLED".equals(eventType)) {
            headline = "A previously published temporary timetable change has been <strong>CANCELLED</strong>. The regular permanent timetable is restored.";
            accent = "#6c757d";
        } else if ("TEMP_CHANGE_MODIFIED".equals(eventType)) {
            headline = "An active temporary timetable change has been <strong>MODIFIED</strong>. Please review the latest details below.";
            accent = "#f59e0b";
        } else {
            headline = switch (c.getChangeType()) {
                case PERIOD_CANCELLATION -> "A scheduled period has been temporarily <strong>CANCELLED</strong> for the date below.";
                case FACULTY_SUBSTITUTION -> "A <strong>FACULTY SUBSTITUTION</strong> has been arranged for your schedule.";
                case CLASSROOM_CHANGE -> "There is a temporary <strong>CLASSROOM / VENUE CHANGE</strong> for the period below.";
                case EXTRA_CLASS -> "An <strong>EXTRA CLASS</strong> has been added to your schedule.";
                case PERIOD_TIME_CHANGE -> "The <strong>TIMING</strong> for a scheduled period has been temporarily modified.";
                case FREE_PERIOD -> "The specified period has been marked as a <strong>FREE PERIOD</strong>.";
                case SPECIAL_CLASS -> "A <strong>SPECIAL CLASS / ACADEMIC EVENT</strong> has been scheduled.";
                default -> "An important <strong>TEMPORARY TIMETABLE CHANGE</strong> has been published.";
            };
            accent = "#0ea5e9";
        }

        String origTime = (c.getOriginalStartTime() != null ? c.getOriginalStartTime() : "") +
                (c.getOriginalEndTime() != null && !c.getOriginalEndTime().isBlank() ? " - " + c.getOriginalEndTime() : "");
        String updTime = (c.getUpdatedStartTime() != null ? c.getUpdatedStartTime() : "") +
                (c.getUpdatedEndTime() != null && !c.getUpdatedEndTime().isBlank() ? " - " + c.getUpdatedEndTime() : "");

        return "<!DOCTYPE html><html><body style='margin:0;padding:16px;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;'>" +
                "<div style='max-width:620px;margin:0 auto;background:#1e293b;border-radius:10px;overflow:hidden;border:1px solid #334155;'>" +
                "<div style='background:" + accent + ";padding:16px 22px;color:#ffffff;'>" +
                "<h2 style='margin:0;font-size:18px;'>College Timetable Viewer &mdash; Temporary Schedule Notice</h2>" +
                "</div>" +
                "<div style='padding:22px;font-size:14px;line-height:1.6;'>" +
                "<p style='margin-top:0;'>" + greeting + "</p>" +
                "<p>" + headline + "</p>" +
                "<table style='width:100%;border-collapse:collapse;margin:16px 0;background:#0f172a;border-radius:6px;'>" +
                row("Date", esc(dateRange)) +
                row("Department", esc(deptCode)) +
                row("Academic Year / Batch", esc(yearStr + (c.getBatch() != null && !c.getBatch().isBlank() ? " (" + c.getBatch() + ")" : ""))) +
                row("Section", esc(c.getSectionName())) +
                row("Period", "Period " + (c.getPeriodNumber() != null ? c.getPeriodNumber() : "-")) +
                row("Change Type", esc(c.getChangeType().name().replace('_', ' '))) +
                row("Original Subject", esc(orDash(c.getOriginalSubjectName()))) +
                row("Updated Subject", esc(orDash(c.getUpdatedSubjectName()))) +
                row("Original Faculty", esc(orDash(c.getOriginalFacultyName()))) +
                row("Updated / Replacement Faculty", esc(orDash(c.getReplacementFacultyName()))) +
                row("Original Classroom", esc(orDash(c.getOriginalVenueName()))) +
                row("Updated Classroom", esc(orDash(c.getUpdatedVenueName()))) +
                (!origTime.isBlank() || !updTime.isBlank() ? row("Timing", esc((origTime.isBlank() ? "-" : origTime) + " -> " + (updTime.isBlank() ? "-" : updTime))) : "") +
                row("Reason", esc(orDash(c.getReason()))) +
                (c.getDescription() != null && !c.getDescription().isBlank() ? row("Announcement", esc(c.getDescription())) : "") +
                "</table>" +
                "<p style='color:#94a3b8;font-size:13px;'>This change applies only to the specified date(s) and does not modify the permanent timetable.</p>" +
                "<p style='margin-bottom:0;'>Regards,<br/><strong>College Timetable Management System</strong></p>" +
                "</div></div></body></html>";
    }

    public Section resolveSectionByName(String sectionName) {
        if (sectionName == null || sectionName.isBlank()) return null;
        String norm = sectionName.trim().replaceAll("\\s+", " ").toUpperCase();
        for (Section sec : sectionRepository.findAll()) {
            if (sec.getSectionName() != null) {
                String candidate = sec.getSectionName().trim().replaceAll("\\s+", " ").toUpperCase();
                if (candidate.equals(norm)) {
                    return sec;
                }
            }
        }
        return null;
    }

    public List<RecipientTarget> resolveSectionStudentRecipientsOnly(String sectionName) {
        Section section = resolveSectionByName(sectionName);
        if (section == null || section.getId() == null) return List.of();

        List<EmailSubscription> activeSubs = subscriptionRepository.findByVerifiedTrueAndNotificationsEnabledTrue();
        Map<Long, EmailSubscription> subByUserId = new HashMap<>();
        for (EmailSubscription sub : activeSubs) {
            if (sub.getUser() != null && sub.getUser().getId() != null) {
                subByUserId.put(sub.getUser().getId(), sub);
            }
        }

        Map<String, RecipientTarget> uniqueByEmail = new LinkedHashMap<>();
        for (Student st : studentRepository.findBySectionId(section.getId())) {
            if (st.getUser() == null || st.getUser().getId() == null) continue;
            EmailSubscription sub = subByUserId.get(st.getUser().getId());
            if (sub != null && sub.getEmail() != null && !sub.getEmail().isBlank()) {
                String email = sub.getEmail().trim().toLowerCase();
                String fullName = ((st.getFirstName() != null ? st.getFirstName() : "") + " " +
                        (st.getLastName() != null ? st.getLastName() : "")).trim();
                if (fullName.isEmpty()) fullName = st.getRegisterNumber() != null ? st.getRegisterNumber() : "Student";
                uniqueByEmail.putIfAbsent(email, new RecipientTarget(st.getUser(), fullName, email, "STUDENT"));
            }
        }
        return new ArrayList<>(uniqueByEmail.values());
    }

    @Transactional
    public Map<String, Object> dispatchClassLeaveOrSubstitutionEmails(
            String eventType,
            String sectionName,
            String dateStr,
            String dayName,
            Integer periodNumber,
            String subjectName,
            String venueName,
            String originalFaculty,
            String substituteFaculty,
            String reason
    ) {
        boolean isSub = "SUBSTITUTION".equalsIgnoreCase(eventType);
        List<RecipientTarget> recipients = resolveSectionStudentRecipientsOnly(sectionName);
        String cleanSection = (sectionName != null && !sectionName.isBlank()) ? sectionName.trim() : "Class";
        String emailSubject = isSub
                ? "Faculty Substitution Notice - " + cleanSection + " (Period " + (periodNumber != null ? periodNumber : "-") + ")"
                : "Faculty Leave Notice - " + cleanSection + " (Period " + (periodNumber != null ? periodNumber : "-") + ")";

        int sent = 0;
        int simulated = 0;
        int failed = 0;
        for (RecipientTarget target : recipients) {
            String html = buildClassLeaveOrSubHtml(target.name(), isSub, cleanSection, dateStr, dayName, periodNumber, subjectName, venueName, originalFaculty, substituteFaculty, reason);
            EmailNotificationLog logEntry = sendAndLog(
                    target.user(),
                    target.name(),
                    "STUDENT",
                    target.email(),
                    null,
                    1,
                    isSub ? "CLASS_FACULTY_SUBSTITUTION" : "CLASS_FACULTY_ABSENT",
                    emailSubject,
                    html
            );
            String st = logEntry.getNotificationStatus();
            if ("SENT".equals(st)) sent++;
            else if ("SIMULATED".equals(st)) simulated++;
            else failed++;
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("sectionName", cleanSection);
        out.put("eventType", isSub ? "SUBSTITUTION" : "ABSENT");
        out.put("provider", resolveActiveProvider());
        out.put("totalRecipients", recipients.size());
        out.put("sentCount", sent);
        out.put("simulatedCount", simulated);
        out.put("failedCount", failed);
        return out;
    }

    private String buildClassLeaveOrSubHtml(
            String studentName,
            boolean isSub,
            String sectionName,
            String dateStr,
            String dayName,
            Integer periodNumber,
            String subjectName,
            String venueName,
            String originalFaculty,
            String substituteFaculty,
            String reason
    ) {
        String accent = isSub ? "#f59e0b" : "#ef4444";
        String heading = isSub ? "Faculty Substitution Notification" : "Faculty Leave / Absence Notification";
        String bodyIntro = isSub
                ? "<strong>" + esc(orDash(originalFaculty)) + "</strong> is absent today. <strong>" + esc(orDash(substituteFaculty)) + "</strong> has been assigned as the substitute faculty for your class."
                : "<strong>" + esc(orDash(originalFaculty)) + "</strong> is on leave / absent today for your scheduled class period.";
        return "<!DOCTYPE html><html><body style='margin:0;padding:16px;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;'>" +
                "<div style='max-width:600px;margin:0 auto;background:#1e293b;border-radius:10px;overflow:hidden;border:1px solid #334155;'>" +
                "<div style='background:" + accent + ";padding:15px 20px;color:#0f172a;'><h2 style='margin:0;font-size:18px;'>" + heading + " &mdash; " + esc(sectionName) + "</h2></div>" +
                "<div style='padding:22px;font-size:14px;line-height:1.6;'>" +
                "<p style='margin-top:0;'>Dear " + esc(studentName != null && !studentName.isBlank() ? studentName : "Student") + ",</p>" +
                "<p>" + bodyIntro + "</p>" +
                "<table style='width:100%;border-collapse:collapse;margin:16px 0;background:#0f172a;border-radius:6px;'>" +
                row("Class / Section", esc(sectionName)) +
                row("Date / Day", esc(orDash(dateStr) + (dayName != null && !dayName.isBlank() ? " (" + dayName + ")" : ""))) +
                row("Period", "Period " + (periodNumber != null ? periodNumber : "-")) +
                row("Subject", esc(orDash(subjectName))) +
                row("Venue", esc(orDash(venueName))) +
                row("Absent Faculty", esc(orDash(originalFaculty))) +
                (isSub ? row("Substitute Faculty", esc(orDash(substituteFaculty))) : "") +
                row("Reason", esc(orDash(reason))) +
                "</table>" +
                "<p style='color:#94a3b8;font-size:13px;'>This update applies only to today&apos;s schedule for " + esc(sectionName) + ". Please check Period Notifications in the College Timetable Viewer.</p>" +
                "<p style='margin-bottom:0;'>Regards,<br/><strong>College Timetable Management System</strong></p>" +
                "</div></div></body></html>";
    }

    private String buildOtpHtmlTemplate(String username, String otpCode) {
        return "<!DOCTYPE html><html><body style='margin:0;padding:16px;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;'>" +
                "<div style='max-width:520px;margin:0 auto;background:#1e293b;border-radius:10px;overflow:hidden;border:1px solid #334155;'>" +
                "<div style='background:#0ea5e9;padding:14px 20px;color:#fff;'><h2 style='margin:0;font-size:17px;'>Email Verification OTP</h2></div>" +
                "<div style='padding:22px;font-size:14px;line-height:1.6;'>" +
                "<p>Hello <strong>" + esc(username) + "</strong>,</p>" +
                "<p>Use this 6-digit One-Time Password (OTP) to verify your email address for Timetable Notifications:</p>" +
                "<div style='text-align:center;margin:18px 0;'><span style='display:inline-block;padding:12px 26px;font-size:26px;letter-spacing:6px;font-weight:bold;background:#0f172a;color:#38bdf8;border:1px solid #38bdf8;border-radius:8px;'>" + esc(otpCode) + "</span></div>" +
                "<p style='color:#94a3b8;font-size:13px;'>This OTP expires in 10 minutes. Never share your OTP with anyone.</p>" +
                "</div></div></body></html>";
    }

    private String row(String label, String val) {
        return "<tr><td style='padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;width:40%;'><strong>" + label + "</strong></td>" +
               "<td style='padding:8px 12px;border-bottom:1px solid #1e293b;color:#f8fafc;'>" + val + "</td></tr>";
    }

    private String orDash(String s) {
        return (s != null && !s.isBlank()) ? s : "-";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
