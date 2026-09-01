package com.smarttimetable.dto;

import java.util.List;

public class QuizCreateRequest {
    public Long sectionId;
    public Long teacherId;
    public String title;
    public List<QuestionDto> questions;

    public static class QuestionDto {
        public String questionText;
        public String type;
        public String options;
        public String correctAnswer;
        public Integer marks;
    }
}
