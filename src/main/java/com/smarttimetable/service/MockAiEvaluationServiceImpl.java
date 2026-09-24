package com.smarttimetable.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarttimetable.entity.StudentAnswer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MockAiEvaluationServiceImpl implements AiEvaluationService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String analyzeWeakness(List<StudentAnswer> incorrectAnswers) {
        if (incorrectAnswers == null || incorrectAnswers.isEmpty()) {
            return "No significant weaknesses detected. Good job!";
        }

        String concepts = incorrectAnswers.stream()
                .map(a -> a.getQuestion().getQuestionText() + " (Topic: " + a.getQuestion().getTopicConcept() + ")")
                .collect(Collectors.joining(", "));

        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return "AI Analysis: The student seems to struggle with the following concepts based on incorrect answers: [" 
                    + concepts + "]. Recommend reviewing these topics and practicing similar problems.";
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            String prompt = "You are an expert AI tutor. A student has answered the following questions incorrectly in their recent quiz:\n" 
                            + concepts + "\n\n"
                            + "Please provide a brief, encouraging, and highly specific analysis of their weaknesses based ONLY on these failed concepts. "
                            + "Provide actionable steps on how they can improve. Keep it under 3-4 sentences. Do not use markdown format, just plain text.";

            String requestBody = "{\"contents\":[{\"parts\":[{\"text\":\"" + prompt.replace("\"", "\\\"").replace("\n", " ") + "\"}]}]}";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            JsonNode rootNode = objectMapper.readTree(response.getBody());
            JsonNode textNode = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            
            return textNode.asText().trim();

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Gemini API failed for evaluation, falling back to basic mock.");
            return "AI Analysis (Fallback): The student struggles with these concepts: [" 
                    + concepts + "]. Please review them.";
        }
    }
}
