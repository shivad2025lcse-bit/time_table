package com.smarttimetable.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@Service
public class AiTimetableParserService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    public String parseTimetableImage(MultipartFile imageFile) throws Exception {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            System.out.println("[AiTimetableParser] AI scanning service is not configured. Using OCR fallback.");
            throw new Exception("AI scanning service is not configured. Using OCR fallback. Could not detect a timetable table in this image. Please upload a clear timetable screenshot.");
        }

        String base64Image = Base64.getEncoder().encodeToString(imageFile.getBytes());
        String mimeType = imageFile.getContentType();
        if (mimeType == null || !mimeType.startsWith("image/")) {
            mimeType = "image/png";
        }

        RestTemplate restTemplate = new RestTemplate();
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mimeType", mimeType);
        inlineData.put("data", base64Image);

        Map<String, Object> inlinePart = new HashMap<>();
        inlinePart.put("inlineData", inlineData);

        Map<String, Object> textPart = new HashMap<>();
        String prompt = "Extract the timetable information from this image. "
                + "Return ONLY a valid JSON format. The JSON should be an object containing a single key 'data'. "
                + "The 'data' key should contain an object where keys are the Days of the week (Monday, Tuesday, etc.) "
                + "and the values are an array of 7 objects representing the 7 periods. "
                + "If a period is a break (Tea Break/Lunch Break), or empty, you can output it as FREE. "
                + "Each period object must have exactly these keys: "
                + "'sub' (subject name or shortcode), 'code' (subject code, can be empty), "
                + "'faculty' (teacher name), 'venue' (room number). "
                + "Leave them empty strings if not found. If it's a break/free, 'sub' should be 'FREE'. "
                + "DO NOT include markdown formatting like ```json in the output, just raw JSON.";
        textPart.put("text", prompt);

        Map<String, Object> parts = new HashMap<>();
        parts.put("parts", Arrays.asList(textPart, inlinePart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(parts));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map<String, Object> body = response.getBody();
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
                if (resParts != null && !resParts.isEmpty()) {
                    String jsonText = (String) resParts.get(0).get("text");
                    jsonText = jsonText.trim();
                    if (jsonText.startsWith("```json")) {
                        jsonText = jsonText.substring(7);
                    }
                    if (jsonText.startsWith("```")) {
                        jsonText = jsonText.substring(3);
                    }
                    if (jsonText.endsWith("```")) {
                        jsonText = jsonText.substring(0, jsonText.length() - 3);
                    }
                    return jsonText.trim();
                }
            }
        }

        throw new Exception("Failed to parse image from Gemini API.");
    }
}
