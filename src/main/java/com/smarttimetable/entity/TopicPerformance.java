package com.smarttimetable.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "topic_performance")
public class TopicPerformance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"timetableEntries", "notifications", "hibernateLazyInitializer"})
    private Student student;

    @Column(name = "subject_name", nullable = false)
    private String subjectName;

    @Column(name = "topic_name", nullable = false)
    private String topicName;

    @Column(name = "percentage", nullable = false)
    private Double percentage;

    @Column(name = "competency_level")
    private String competencyLevel; // Excellent, Good, Developing, Needs Improvement

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }

    public Double getPercentage() { return percentage; }
    public void setPercentage(Double percentage) { this.percentage = percentage; }

    public String getCompetencyLevel() { return competencyLevel; }
    public void setCompetencyLevel(String competencyLevel) { this.competencyLevel = competencyLevel; }
}
