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
public class ChatGPTInterviewService {

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    private static final String OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

    public List<Question> generateQuestions(String company, String role, String category) {
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String actualRole = (role == null || role.trim().isEmpty()) ? "Fresher" : role;
        
        // Build the prompt based on user requirements
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append(String.format("User selected the following:\n\nCompany: %s\nRole: %s\nQuestion Type: Frequently Asked\nCategory Filter: %s\n\n", 
                company, actualRole, category));
        
        promptBuilder.append("Task:\nGenerate frequently asked interview questions and answers based on real interview trends for the selected company and role.\n\n");
        
        promptBuilder.append("Instructions:\n");
        if (category.equalsIgnoreCase("All")) {
            promptBuilder.append("- Include Technical, Managerial, and HR sections.\n");
        } else if (category.equalsIgnoreCase("Technical")) {
            promptBuilder.append("- Only generate technical questions.\n");
        } else if (category.equalsIgnoreCase("Managerial")) {
            promptBuilder.append("- Only generate managerial questions.\n");
        } else if (category.equalsIgnoreCase("HR")) {
            promptBuilder.append("- Only generate HR questions.\n");
        }
        
        promptBuilder.append("\nRequirements:\n");
        promptBuilder.append("- Questions must be well-framed and realistic (as asked in interviews)\n");
        promptBuilder.append("- Focus on fresher-level hiring patterns\n");
        promptBuilder.append("- Avoid repetition\n");
        promptBuilder.append("- Keep difficulty beginner to intermediate\n");
        promptBuilder.append("- Answers must be clear, concise, and easy for quick revision (3–5 lines max)\n\n");
        
        promptBuilder.append("Return ONLY a JSON array of objects with this structure:\n");
        promptBuilder.append("[{\"category\": \"Technical\", \"content\": \"Question text\", \"answer\": \"Detailed answer text\"}, {\"category\": \"HR\", \"content\": \"...\", \"answer\": \"...\"}]\n\n");
        promptBuilder.append("Ensure the category field in JSON matches the actual category (Technical, Managerial, or HR).\n");
        promptBuilder.append("Return exactly 15 items in total. Respond ONLY with valid JSON.");

        try {
            String response = callChatGPT(promptBuilder.toString());
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            List<Question> questions = new ArrayList<>();
            if (root.isArray()) {
                for (JsonNode node : root) {
                    Question q = new Question();
                    q.setCompany(company.toLowerCase());
                    q.setRole(actualRole);
                    q.setCategory(node.path("category").asText("General"));
                    q.setContent(node.path("content").asText(""));
                    q.setAnswer(node.path("answer").asText(""));
                    if (!q.getContent().isEmpty()) questions.add(q);
                }
            }
            return questions;
        } catch (Exception e) {
            System.err.println("[ChatGPT Interview] Error: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    private String callChatGPT(String prompt) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        
        Map<String, Object> message = Map.of(
            "role", "user",
            "content", prompt
        );
        
        Map<String, Object> body = Map.of(
            "model", "gpt-3.5-turbo", // or gpt-4
            "messages", List.of(message),
            "temperature", 0.7
        );

        String jsonBody = mapper.writeValueAsString(body);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENAI_ENDPOINT))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + openaiApiKey)
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("OpenAI error: " + response.statusCode() + " - " + response.body());
        }

        JsonNode root = mapper.readTree(response.body());
        return root.path("choices").get(0).path("message").path("content").asText().trim();
    }
}
