package com.smarttimetable.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_visibility_config")
public class QuizVisibilityConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "global_quiz_enabled", nullable = false)
    private Boolean globalQuizEnabled = true;

    @Column(name = "download_tt_enabled")
    private Boolean downloadTtEnabled = true;

    @Column(name = "updated_by", length = 120)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Boolean getGlobalQuizEnabled() {
        return globalQuizEnabled == null ? Boolean.TRUE : globalQuizEnabled;
    }

    public void setGlobalQuizEnabled(Boolean globalQuizEnabled) {
        this.globalQuizEnabled = globalQuizEnabled == null ? Boolean.TRUE : globalQuizEnabled;
    }

    public Boolean getDownloadTtEnabled() {
        return downloadTtEnabled == null ? Boolean.TRUE : downloadTtEnabled;
    }

    public void setDownloadTtEnabled(Boolean downloadTtEnabled) {
        this.downloadTtEnabled = downloadTtEnabled == null ? Boolean.TRUE : downloadTtEnabled;
    }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
