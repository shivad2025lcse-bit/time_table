package com.smarttimetable.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "timetable_entries")
public class TimetableEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entry_day", nullable = false)
    private String day; // Monday, Tuesday, Wednesday, Thursday, Friday

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "time_slot_id", nullable = false)
    private TimeSlot timeSlot;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "laboratory_id")
    private Laboratory laboratory;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    private Integer semester;

    @Column(name = "academic_year")
    private String academicYear = "2025-2026";

    @Column(name = "assigned_faculty", length = 120)
    private String assignedFaculty;

    @Column(name = "assigned_venue", length = 120)
    private String assignedVenue;

    public TimetableEntry() {}

    public TimetableEntry(String day, TimeSlot timeSlot, Subject subject, Teacher teacher, Classroom classroom, Laboratory laboratory, Section section, Integer semester, String academicYear) {
        this.day = day;
        this.timeSlot = timeSlot;
        this.subject = subject;
        this.teacher = teacher;
        this.classroom = classroom;
        this.laboratory = laboratory;
        this.section = section;
        this.semester = semester;
        this.academicYear = academicYear;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public TimeSlot getTimeSlot() { return timeSlot; }
    public void setTimeSlot(TimeSlot timeSlot) { this.timeSlot = timeSlot; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher) { this.teacher = teacher; }

    public Classroom getClassroom() { return classroom; }
    public void setClassroom(Classroom classroom) { this.classroom = classroom; }

    public Laboratory getLaboratory() { return laboratory; }
    public void setLaboratory(Laboratory laboratory) { this.laboratory = laboratory; }

    public Section getSection() { return section; }
    public void setSection(Section section) { this.section = section; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public String getAssignedFaculty() { return assignedFaculty; }
    public void setAssignedFaculty(String assignedFaculty) { this.assignedFaculty = assignedFaculty; }

    public String getAssignedVenue() { return assignedVenue; }
    public void setAssignedVenue(String assignedVenue) { this.assignedVenue = assignedVenue; }
}
