package com.smarttimetable.service;

import com.smarttimetable.entity.QuizQuestion;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiQuizGeneratorService {

    public List<QuizQuestion> generateQuestions(String topic, String notes, String difficulty, int count) {
        List<QuizQuestion> generatedQuestions = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            QuizQuestion q = new QuizQuestion();
            q.setQuestionText("AI Generated Question " + (i + 1) + " about " + topic);
            q.setType("MCQ");
            q.setOptions("Option A,Option B,Option C,Option D");
            q.setCorrectAnswer("Option A");
            q.setMarks(10);
            q.setDifficulty(difficulty);
            q.setTopicConcept(topic);
            q.setExplanation("This is an AI generated explanation for this question based on the provided notes.");
            generatedQuestions.add(q);
        }

        return generatedQuestions;
    }
}
