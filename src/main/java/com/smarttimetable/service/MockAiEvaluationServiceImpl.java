package com.smarttimetable.service;

import com.smarttimetable.entity.StudentAnswer;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MockAiEvaluationServiceImpl implements AiEvaluationService {
    @Override
    public String analyzeWeakness(List<StudentAnswer> incorrectAnswers) {
        if (incorrectAnswers == null || incorrectAnswers.isEmpty()) {
            return "No significant weaknesses detected. Good job!";
        }
        
        String concepts = incorrectAnswers.stream()
                .map(a -> a.getQuestion().getQuestionText())
                .collect(Collectors.joining(", "));
        
        return "AI Analysis: The student seems to struggle with the following concepts based on incorrect answers: [" 
                + concepts + "]. Recommend reviewing these topics and practicing similar problems.";
    }
}
