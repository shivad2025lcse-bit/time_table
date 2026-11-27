package com.smarttimetable.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "email_notification_logs",
    indexes = {
        @Index(name = "idx_enl_dedup", columnList = "temporary_change_id, email, event_type, change_revision"),
        @Index(name = "idx_enl_status_sent", columnList = "notification_status, sent_at")
    }
)
public class EmailNotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "recipient_name", length = 150)
    private String recipientName;

    @Column(name = "recipient_role", length = 40)
    private String recipientRole;

    @Column(name = "email", nullable = false, length = 180)
    private String email;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "temporary_change_id")
    private TemporaryTimetableChange temporaryChange;

    @Column(name = "change_revision", nullable = false)
    private Integer changeRevision = 1;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "email_subject", length = 250)
    private String emailSubject;

    @Column(name = "notification_status", nullable = false, length = 30)
    private String notificationStatus;

    @Column(name = "provider", length = 30)
    private String provider;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) sentAt = LocalDateTime.now();
        if (changeRevision == null) changeRevision = 1;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String recipientRole) { this.recipientRole = recipientRole; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public TemporaryTimetableChange getTemporaryChange() { return temporaryChange; }
    public void setTemporaryChange(TemporaryTimetableChange temporaryChange) { this.temporaryChange = temporaryChange; }

    public Integer getChangeRevision() { return changeRevision; }
    public void setChangeRevision(Integer changeRevision) { this.changeRevision = changeRevision; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEmailSubject() { return emailSubject; }
    public void setEmailSubject(String emailSubject) { this.emailSubject = emailSubject; }

    public String getNotificationStatus() { return notificationStatus; }
    public void setNotificationStatus(String notificationStatus) { this.notificationStatus = notificationStatus; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
