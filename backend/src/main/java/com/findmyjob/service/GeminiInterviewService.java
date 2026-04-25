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

    public List<Question> generateQuestions(String company, String role) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            String prompt = String.format(
                "User selected the company: %s. Role: %s.\n\n" +
                "Generate a list of interview questions and answers specific to this company. Focus on common roles like Software Developer, Analyst, and Consultant.\n\n" +
                "Include:\n" +
                "- 10 Technical questions (coding, core subjects, problem-solving)\n" +
                "- 5 HR/Behavioral questions\n" +
                "- 5 Company-specific questions (about company, values, projects)\n\n" +
                "Also consider:\n" +
                "- Recent hiring patterns\n" +
                "- Typical campus placement questions\n" +
                "- Frequently asked coding topics (arrays, strings, DBMS, OOPS)\n\n" +
                "Make the answers clear, concise, and suitable for quick revision before interviews. Keep difficulty at beginner to intermediate level.\n\n" +
                "Return ONLY a JSON array of objects with this structure:\n" +
                "[{\"category\": \"Technical\", \"content\": \"Question text\", \"answer\": \"Detailed answer text\"}, {\"category\": \"HR\", \"content\": \"...\", \"answer\": \"...\"}, {\"category\": \"Company-specific\", \"content\": \"...\", \"answer\": \"...\"}]\n\n" +
                "Return exactly 20 items. Respond ONLY with valid JSON.",
                company, role != null ? role : "Professional"
            );

            String response = callGemini(prompt);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            
            List<Question> questions = new ArrayList<>();
            if (root.isArray()) {
                for (JsonNode node : root) {
                    Question q = new Question();
                    q.setCompany(company.toLowerCase());
                    q.setCategory(node.path("category").asText("General"));
                    q.setContent(node.path("content").asText(""));
                    q.setAnswer(node.path("answer").asText(""));
                    if (!q.getContent().isEmpty()) {
                        questions.add(q);
                    }
                }
            }
            return questions;

        } catch (Exception e) {
            System.err.println("[Gemini Interview] Error: " + e.getMessage());
            return Collections.emptyList();
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
            throw new RuntimeException("Gemini error: " + response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());
        return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();
    }
}
