package com.findmyjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.findmyjob.model.Question;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class GeminiInterviewService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    public List<Question> generateQuestions(String company, String role, String category) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.equals("${GEMINI_API_KEY:}")) {
            throw new RuntimeException("Gemini API Key is missing or not configured correctly in application.properties!");
        }

        String actualRole = (role == null || role.trim().isEmpty()) ? "Fresher" : role;
        
        // Build a simpler prompt for better reliability
        String prompt = String.format(
            "Generate 15 interview questions and answers for %s (Role: %s). \n" +
            "If category is 'Technical', only generate technical. If 'Managerial', only managerial. If 'HR', only HR. If 'All', mix them.\n" +
            "Return ONLY a JSON array of objects with keys: category, content, answer. \n" +
            "Categories MUST be exactly 'Technical', 'Managerial', or 'HR'.\n" +
            "Difficulty: beginner to intermediate. Response must be ONLY valid JSON.",
            company, actualRole
        );

        try {
            System.out.println("[Gemini Prompt] " + prompt);
            String response = callGemini(prompt);
            System.out.println("[Gemini Response] " + response);
            
            // Log to file for AI assistant to read
            try (java.io.FileWriter writer = new java.io.FileWriter("gemini_log.json")) {
                writer.write(response);
            } catch (Exception e) {}

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            List<Question> questions = new ArrayList<>();
            
            JsonNode arrayNode = root.isArray() ? root : root.path("questions");
            if (!arrayNode.isArray()) {
                // Try finding any array in the object
                Iterator<Map.Entry<String, JsonNode>> fields = root.fields();
                while (fields.hasNext()) {
                    JsonNode node = fields.next().getValue();
                    if (node.isArray()) {
                        arrayNode = node;
                        break;
                    }
                }
            }

            if (arrayNode.isArray()) {
                for (JsonNode node : arrayNode) {
                    Question q = new Question();
                    q.setCompany(company.toLowerCase());
                    q.setRole(actualRole);
                    String rawCategory = node.path("category").asText("General");
                    String normalizedCategory = "General";
                    if (rawCategory.toLowerCase().contains("technical")) normalizedCategory = "Technical";
                    else if (rawCategory.toLowerCase().contains("managerial") || rawCategory.toLowerCase().contains("leadership")) normalizedCategory = "Managerial";
                    else if (rawCategory.toLowerCase().contains("hr") || rawCategory.toLowerCase().contains("behavioral")) normalizedCategory = "HR";
                    
                    q.setCategory(normalizedCategory);
                    q.setContent(node.path("content").asText(""));
                    q.setAnswer(node.path("answer").asText(""));
                    if (!q.getContent().isEmpty()) questions.add(q);
                }
            } else {
                System.err.println("[Gemini Interview] No array found in response");
            }

            // TEST QUESTIONS
            for(int i=1; i<=5; i++) {
                Question q = new Question();
                q.setCompany(company.toLowerCase());
                q.setRole(actualRole);
                q.setCategory(i % 2 == 0 ? "Technical" : "HR");
                q.setContent("PROMPT TEST Q" + i + ": " + company + " Interview?");
                q.setAnswer("This is test answer " + i);
                questions.add(q);
            }

            return questions;
        } catch (Exception e) {
            System.err.println("[Gemini Interview] Error: " + e.getMessage());
            throw new RuntimeException("AI generation error: " + e.getMessage(), e);
        }
    }

    private String callGemini(String prompt) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", new Object[] { textPart });
        Map<String, Object> genConfig = Map.of("response_mime_type", "application/json");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", new Object[] { content });
        body.put("generationConfig", genConfig);

        String jsonBody = mapper.writeValueAsString(body);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_ENDPOINT + geminiApiKey))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini error: " + response.statusCode() + " - " + response.body());
        }

        JsonNode root = mapper.readTree(response.body());
        String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();
        
        // Strip markdown backticks if present
        if (text.startsWith("```")) {
            text = text.replaceAll("^```(?:json)?\\n?|\\n?```$", "");
        }
        
        return text.trim();
    }
}
