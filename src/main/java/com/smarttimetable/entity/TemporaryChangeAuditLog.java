package com.smarttimetable.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "temporary_change_audit_logs", indexes = {
    @Index(name = "idx_tcal_change_id", columnList = "temporary_change_id")
})
public class TemporaryChangeAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "temporary_change_id", nullable = false)
    private Long temporaryChangeId;

    @Column(name = "section_name", length = 80)
    private String sectionName;

    @Column(name = "action_type", nullable = false, length = 40)
    private String actionType;

    @Column(name = "actor_username", length = 100)
    private String actorUsername;

    @Column(name = "details", length = 1200)
    private String details;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTemporaryChangeId() { return temporaryChangeId; }
    public void setTemporaryChangeId(Long temporaryChangeId) { this.temporaryChangeId = temporaryChangeId; }

    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getActorUsername() { return actorUsername; }
    public void setActorUsername(String actorUsername) { this.actorUsername = actorUsername; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
