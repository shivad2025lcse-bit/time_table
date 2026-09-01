package com.smarttimetable.dto;

import java.util.List;

public class QuizSubmitRequest {
    public Long studentId;
    public List<AnswerDto> answers;

    public static class AnswerDto {
        public Long questionId;
        public String answerText;
    }
}
