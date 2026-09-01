package com.smarttimetable.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "sections")
public class Section {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_name", nullable = false)
    private String sectionName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private Integer semester;

    @Column(name = "student_count")
    private Integer studentCount = 40;

    @Column(name = "batch_start_year")
    private Integer batchStartYear;

    @Column(name = "batch_end_year")
    private Integer batchEndYear;

    @Column(name = "academic_year_level")
    private Integer year;

    @Column(name = "section_identifier")
    private String sectionIdentifier;

    public Section() {}

    public Section(String sectionName, Course course, Integer semester, Integer studentCount) {
        this.sectionName = sectionName;
        this.course = course;
        this.semester = semester;
        this.studentCount = studentCount;
    }

    public Section(String sectionName, Course course, Integer semester, Integer studentCount, Integer batchStartYear, Integer batchEndYear, Integer year, String sectionIdentifier) {
        this.sectionName = sectionName;
        this.course = course;
        this.semester = semester;
        this.studentCount = studentCount;
        this.batchStartYear = batchStartYear;
        this.batchEndYear = batchEndYear;
        this.year = year;
        this.sectionIdentifier = sectionIdentifier;
    }

    public Section(String sectionName, Course course, Integer semester, Integer studentCount) {
        this.sectionName = sectionName;
        this.course = course;
        this.semester = semester;
        this.studentCount = studentCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public Integer getStudentCount() { return studentCount; }
    public void setStudentCount(Integer studentCount) { this.studentCount = studentCount; }

    public Integer getBatchStartYear() { return batchStartYear; }
    public void setBatchStartYear(Integer batchStartYear) { this.batchStartYear = batchStartYear; }

    public Integer getBatchEndYear() { return batchEndYear; }
    public void setBatchEndYear(Integer batchEndYear) { this.batchEndYear = batchEndYear; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getSectionIdentifier() { return sectionIdentifier; }
    public void setSectionIdentifier(String sectionIdentifier) { this.sectionIdentifier = sectionIdentifier; }
}
