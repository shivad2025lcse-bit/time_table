package com.smarttimetable.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "quiz_questions")
public class QuizQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(nullable = false, length = 1000)
    private String questionText;

    // Type of question: MCQ or DESCRIPTIVE
    @Column(nullable = false)
    private String type;

    // For MCQ, store comma-separated options or JSON
    @Column(length = 1000)
    private String options; 

    // The correct answer for auto-grading
    @Column(length = 1000)
    private String correctAnswer;

    @Column(nullable = false)
    private Integer marks;

    @Column(name = "topic_concept")
    private String topicConcept;

    @Column(length = 2000)
    private String explanation;

    @Column(name = "difficulty")
    private String difficulty; // Easy, Medium, Hard

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks; }

    public String getTopicConcept() { return topicConcept; }
    public void setTopicConcept(String topicConcept) { this.topicConcept = topicConcept; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
}
