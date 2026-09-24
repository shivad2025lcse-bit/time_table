package com.smarttimetable.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarttimetable.entity.QuizQuestion;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiQuizGeneratorService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<QuizQuestion> generateQuestions(String topic, String notes, String difficulty, String type, int count) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            System.out.println("[Quiz AI] No Gemini API key configured. Using enhanced mock generator.");
            return generateMockQuestions(topic, notes, difficulty, type, count);
        }
        try {
            return callGemini(topic, notes, difficulty, type, count);
        } catch (Exception e) {
            System.err.println("[Quiz AI] Gemini API failed: " + e.getMessage() + ". Falling back to mock.");
            return generateMockQuestions(topic, notes, difficulty, type, count);
        }
    }

    private List<QuizQuestion> callGemini(String topic, String notes, String difficulty, String type, int count) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + geminiApiKey;

        String prompt = buildExpertPrompt(topic, notes, difficulty, type, count);
        String escapedPrompt = prompt
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "");

        String requestBody = "{\"contents\":[{\"parts\":[{\"text\":\"" + escapedPrompt + "\"}]}],"
            + "\"generationConfig\":{\"temperature\":0.7,\"topK\":40,\"topP\":0.95,\"maxOutputTokens\":8192}}";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        String rawText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();

        if (rawText.startsWith("```json")) rawText = rawText.substring(7);
        else if (rawText.startsWith("```")) rawText = rawText.substring(3);
        if (rawText.endsWith("```")) rawText = rawText.substring(0, rawText.length() - 3);
        rawText = rawText.trim();

        int arrStart = rawText.indexOf('[');
        int arrEnd   = rawText.lastIndexOf(']');
        if (arrStart >= 0 && arrEnd > arrStart) rawText = rawText.substring(arrStart, arrEnd + 1);

        JsonNode arr = objectMapper.readTree(rawText);
        List<QuizQuestion> result = new ArrayList<>();
        for (JsonNode qNode : arr) {
            QuizQuestion q = new QuizQuestion();
            q.setQuestionText(qNode.path("questionText").asText());
            q.setType(type != null && type.equalsIgnoreCase("DESCRIPTIVE") ? "DESCRIPTIVE" : "MCQ");
            q.setOptions(qNode.path("options").asText(""));
            q.setCorrectAnswer(qNode.path("correctAnswer").asText());
            q.setExplanation(qNode.path("explanation").asText());
            q.setTopicConcept(qNode.path("topicConcept").asText(topic));
            q.setDifficulty(qNode.path("difficulty").asText(difficulty));
            q.setMarks("Hard".equalsIgnoreCase(q.getDifficulty()) ? 15 :
                       "Easy".equalsIgnoreCase(q.getDifficulty()) ? 5 : 10);
            result.add(q);
        }
        return result;
    }

    private String buildExpertPrompt(String topic, String notes, String difficulty, String type, int count) {
        String bloomsGuidance;
        switch (difficulty.toLowerCase()) {
            case "easy":
                bloomsGuidance = "Focus on REMEMBER and UNDERSTAND (Bloom Level 1-2). "
                    + "Test factual recall and basic comprehension. Clear, unambiguous language for beginners.";
                break;
            case "hard":
                bloomsGuidance = "Focus on ANALYZE, EVALUATE and CREATE (Bloom Level 4-6). "
                    + "Test deep understanding, critical thinking, and application in novel/complex scenarios. "
                    + "Include edge cases and expert-level misconceptions as distractors.";
                break;
            default:
                bloomsGuidance = "Focus on APPLY and ANALYZE (Bloom Level 3-4). "
                    + "Test ability to apply concepts to new situations. Moderately challenging with plausible distractors.";
        }

        String notesSection = (notes != null && !notes.trim().isEmpty())
            ? "REFERENCE MATERIAL (base questions on this content only):\n" + notes.trim()
            : "No notes provided. Use authoritative academic knowledge of the subject.";

        return "You are a world-class academic examiner equivalent to GPT-4o, Gemini Ultra, and Perplexity Pro. "
            + "You create university-level exam questions for competitive academic assessments.\n\n"
            + "TASK: Generate exactly " + count + " MCQ questions on: \"" + topic + "\"\n"
            + "DIFFICULTY: " + difficulty + "\n"
            + bloomsGuidance + "\n\n"
            + notesSection + "\n\n"
            + "REQUIREMENTS:\n"
            + "1. Questions must be unique, precise, and unambiguous.\n"
            + ("DESCRIPTIVE".equalsIgnoreCase(type) 
                ? "2. Provide a detailed model answer for 'correctAnswer' and leave 'options' empty.\n" 
                : "2. Exactly 4 comma-separated options. Distractors = plausible misconceptions or near-correct alternatives.\n" 
                + "3. correctAnswer must EXACTLY match one option (character-for-character).\n")
            + "4. explanation: 2-4 sentences explaining the reasoning behind the correct answer.\n"
            + "5. topicConcept: specific sub-concept (e.g. 'Hash Table Collision Resolution').\n"
            + "6. No two questions test the same concept. Cover the breadth of the topic.\n"
            + "7. Output ONLY a raw JSON array. Zero text outside the JSON.\n\n"
            + "JSON FORMAT:\n"
            + "[\n"
            + "  {\n"
            + "    \"questionText\": \"<self-contained question>\",\n"
            + "    \"type\": \"MCQ\",\n"
            + "    \"options\": \"<A>,<B>,<C>,<D>\",\n"
            + "    \"correctAnswer\": \"<exact option text>\",\n"
            + "    \"explanation\": \"<why correct + why distractors wrong>\",\n"
            + "    \"topicConcept\": \"<sub-concept>\",\n"
            + "    \"difficulty\": \"" + difficulty + "\"\n"
            + "  }\n"
            + "]\n\n"
            + "Generate all " + count + " questions:";
    }

    private List<QuizQuestion> generateMockQuestions(String topic, String notes, String difficulty, String type, int count) {
        String[] concepts = {
            "Core Principles", "Fundamental Concepts", "Practical Applications",
            "Theoretical Framework", "Advanced Techniques", "Implementation Details",
            "Common Pitfalls", "Best Practices", "Comparative Analysis", "Real-world Scenarios"
        };
        String[][] mockQA = {
            new String[]{"What is the primary purpose of " + topic + "?",
             "To solve complex computational problems,To manage system resources,To provide UI components,To handle database transactions",
             "To solve complex computational problems"},
            new String[]{"Which characteristic is MOST fundamental to " + topic + "?",
             "Efficiency and correctness,Visual presentation quality,Network bandwidth usage,File system organization",
             "Efficiency and correctness"},
            new String[]{"In the context of " + topic + ", what does abstraction primarily refer to?",
             "Hiding implementation complexity,Increasing code verbosity,Duplicating code for redundancy,Removing all documentation",
             "Hiding implementation complexity"},
            new String[]{"Which approach BEST optimizes performance in " + topic + "?",
             "Caching frequently accessed data,Always increasing hardware only,Writing more lines of code,Avoiding all recursion",
             "Caching frequently accessed data"},
            new String[]{"What is a common pitfall when implementing " + topic + "?",
             "Ignoring edge cases and boundary conditions,Writing too many unit tests,Using version control,Following design patterns",
             "Ignoring edge cases and boundary conditions"}
        };

        List<QuizQuestion> questions = new ArrayList<>();
        boolean isDesc = "DESCRIPTIVE".equalsIgnoreCase(type);
        for (int i = 0; i < count; i++) {
            QuizQuestion q = new QuizQuestion();
            String[] qa = mockQA[i % mockQA.length];
            q.setQuestionText(qa[0] + " [Add gemini.api.key in application.properties for real AI questions]");
            q.setType(isDesc ? "DESCRIPTIVE" : "MCQ");
            q.setOptions(isDesc ? "" : qa[1]);
            q.setCorrectAnswer(isDesc ? "Detailed model answer explaining " + topic + " goes here." : qa[2]);
            q.setMarks("Hard".equalsIgnoreCase(difficulty) ? 15 : "Easy".equalsIgnoreCase(difficulty) ? 5 : 10);
            q.setDifficulty(difficulty);
            q.setTopicConcept(concepts[i % concepts.length]);
            q.setExplanation("Tests " + concepts[i % concepts.length].toLowerCase() + " in " + topic
                + ". " + (isDesc ? "Model answer details." : "The first option is correct per standard academic definitions.")
                + " Configure gemini.api.key in application.properties for expert AI-generated explanations.");
            questions.add(q);
        }
        return questions;
    }
}