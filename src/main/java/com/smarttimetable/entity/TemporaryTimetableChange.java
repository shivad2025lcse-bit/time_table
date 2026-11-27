package com.smarttimetable.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "temporary_timetable_changes",
    indexes = {
        @Index(name = "idx_ttc_sec_date_period", columnList = "section_id, change_date, period_number"),
        @Index(name = "idx_ttc_range_status", columnList = "status, start_date, end_date"),
        @Index(name = "idx_ttc_dept_status", columnList = "department_id, status")
    }
)
public class TemporaryTimetableChange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "academic_year", length = 40)
    private String academicYear;

    @Column(name = "batch", length = 40)
    private String batch;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(name = "section_name", nullable = false, length = 80)
    private String sectionName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "timetable_entry_id")
    private TimetableEntry timetableEntry;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 40)
    private TemporaryChangeType changeType;

    @Column(name = "change_date", nullable = false)
    private LocalDate changeDate;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "day_of_week", length = 20)
    private String dayOfWeek;

    @Column(name = "period_number", nullable = false)
    private Integer periodNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "original_subject_id")
    private Subject originalSubject;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "updated_subject_id")
    private Subject updatedSubject;

    @Column(name = "original_subject_name", length = 150)
    private String originalSubjectName;

    @Column(name = "updated_subject_name", length = 150)
    private String updatedSubjectName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "original_faculty_id")
    private Teacher originalFaculty;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "replacement_faculty_id")
    private Teacher replacementFaculty;

    @Column(name = "original_faculty_name", length = 150)
    private String originalFacultyName;

    @Column(name = "replacement_faculty_name", length = 150)
    private String replacementFacultyName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "original_venue_id")
    private Classroom originalClassroom;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "updated_venue_id")
    private Classroom updatedClassroom;

    @Column(name = "original_venue_name", length = 120)
    private String originalVenueName;

    @Column(name = "updated_venue_name", length = 120)
    private String updatedVenueName;

    @Column(name = "original_start_time", length = 20)
    private String originalStartTime;

    @Column(name = "updated_start_time", length = 20)
    private String updatedStartTime;

    @Column(name = "original_end_time", length = 20)
    private String originalEndTime;

    @Column(name = "updated_end_time", length = 20)
    private String updatedEndTime;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "description", length = 1500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private TemporaryChangeStatus status = TemporaryChangeStatus.DRAFT;

    @Column(name = "revision", nullable = false)
    private Integer revision = 1;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (revision == null) revision = 1;
        if (startDate == null && changeDate != null) startDate = changeDate;
        if (endDate == null && startDate != null) endDate = startDate;
        if (changeDate == null && startDate != null) changeDate = startDate;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Checks whether this temporary change covers the provided calendar date.
     */
    public boolean coversDate(LocalDate targetDate) {
        if (targetDate == null) return false;
        LocalDate start = startDate != null ? startDate : changeDate;
        LocalDate end = endDate != null ? endDate : start;
        if (start == null || end == null) return false;
        return !targetDate.isBefore(start) && !targetDate.isAfter(end);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public String getBatch() { return batch; }
    public void setBatch(String batch) { this.batch = batch; }

    public Section getSection() { return section; }
    public void setSection(Section section) { this.section = section; }

    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }

    public TimetableEntry getTimetableEntry() { return timetableEntry; }
    public void setTimetableEntry(TimetableEntry timetableEntry) { this.timetableEntry = timetableEntry; }

    public TemporaryChangeType getChangeType() { return changeType; }
    public void setChangeType(TemporaryChangeType changeType) { this.changeType = changeType; }

    public LocalDate getChangeDate() { return changeDate; }
    public void setChangeDate(LocalDate changeDate) { this.changeDate = changeDate; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public Integer getPeriodNumber() { return periodNumber; }
    public void setPeriodNumber(Integer periodNumber) { this.periodNumber = periodNumber; }

    public Subject getOriginalSubject() { return originalSubject; }
    public void setOriginalSubject(Subject originalSubject) { this.originalSubject = originalSubject; }

    public Subject getUpdatedSubject() { return updatedSubject; }
    public void setUpdatedSubject(Subject updatedSubject) { this.updatedSubject = updatedSubject; }

    public String getOriginalSubjectName() { return originalSubjectName; }
    public void setOriginalSubjectName(String originalSubjectName) { this.originalSubjectName = originalSubjectName; }

    public String getUpdatedSubjectName() { return updatedSubjectName; }
    public void setUpdatedSubjectName(String updatedSubjectName) { this.updatedSubjectName = updatedSubjectName; }

    public Teacher getOriginalFaculty() { return originalFaculty; }
    public void setOriginalFaculty(Teacher originalFaculty) { this.originalFaculty = originalFaculty; }

    public Teacher getReplacementFaculty() { return replacementFaculty; }
    public void setReplacementFaculty(Teacher replacementFaculty) { this.replacementFaculty = replacementFaculty; }

    public String getOriginalFacultyName() { return originalFacultyName; }
    public void setOriginalFacultyName(String originalFacultyName) { this.originalFacultyName = originalFacultyName; }

    public String getReplacementFacultyName() { return replacementFacultyName; }
    public void setReplacementFacultyName(String replacementFacultyName) { this.replacementFacultyName = replacementFacultyName; }

    public Classroom getOriginalClassroom() { return originalClassroom; }
    public void setOriginalClassroom(Classroom originalClassroom) { this.originalClassroom = originalClassroom; }

    public Classroom getUpdatedClassroom() { return updatedClassroom; }
    public void setUpdatedClassroom(Classroom updatedClassroom) { this.updatedClassroom = updatedClassroom; }

    public String getOriginalVenueName() { return originalVenueName; }
    public void setOriginalVenueName(String originalVenueName) { this.originalVenueName = originalVenueName; }

    public String getUpdatedVenueName() { return updatedVenueName; }
    public void setUpdatedVenueName(String updatedVenueName) { this.updatedVenueName = updatedVenueName; }

    public String getOriginalStartTime() { return originalStartTime; }
    public void setOriginalStartTime(String originalStartTime) { this.originalStartTime = originalStartTime; }

    public String getUpdatedStartTime() { return updatedStartTime; }
    public void setUpdatedStartTime(String updatedStartTime) { this.updatedStartTime = updatedStartTime; }

    public String getOriginalEndTime() { return originalEndTime; }
    public void setOriginalEndTime(String originalEndTime) { this.originalEndTime = originalEndTime; }

    public String getUpdatedEndTime() { return updatedEndTime; }
    public void setUpdatedEndTime(String updatedEndTime) { this.updatedEndTime = updatedEndTime; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TemporaryChangeStatus getStatus() { return status; }
    public void setStatus(TemporaryChangeStatus status) { this.status = status; }

    public Integer getRevision() { return revision; }
    public void setRevision(Integer revision) { this.revision = revision; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public LocalDateTime getExpiredAt() { return expiredAt; }
    public void setExpiredAt(LocalDateTime expiredAt) { this.expiredAt = expiredAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
