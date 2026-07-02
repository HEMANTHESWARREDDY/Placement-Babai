package com.findmyjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.findmyjob.model.Question;
import com.findmyjob.model.BugHunterQuestion;
import com.findmyjob.model.DailyBugHunterQuiz;
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

    public List<BugHunterQuestion> generateBugHunterQuestions(List<String> excludedTitles) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.equals("${GEMINI_API_KEY:}")) {
            throw new RuntimeException("Gemini API Key is missing or not configured correctly in application.properties!");
        }

        String prompt = "Generate exactly 3 coding interview questions for a game called 'Bug Hunter'.\n" +
            "For each question, provide a snippet of code (in java, python, or javascript) containing exactly one logical or syntax bug.\n" +
            "Format the response strictly as a JSON array of objects with these keys:\n" +
            "- 'title': The name of the question/puzzle (e.g. 'Recursive Factorial (Java)', 'List Appender (Python)')\n" +
            "- 'language': The programming language in lowercase (e.g. 'java', 'python', 'javascript')\n" +
            "- 'description': Short description of the goal or the error type (e.g. 'Identify the line with the bug that causes an infinite loop / stack overflow error.')\n" +
            "- 'codeLines': An array of strings where each element represents one line of the code snippet. Make sure it is short (4 to 12 lines) and readable.\n" +
            "- 'buggyLineIndex': The 0-indexed line number in the 'codeLines' array where the bug resides.\n" +
            "- 'explanation': Explanation of the bug and how to fix it.\n" +
            "- 'xp': Always 15\n" +
            "- 'timeLimit': Time limit in seconds (typically 45 or 60)\n\n" +
            "Crucial rule: Do NOT generate questions with titles/topics that match or are extremely similar to any of these: " + excludedTitles.toString() + "\n" +
            "Response must be ONLY valid JSON.";

        try {
            System.out.println("[Gemini BugHunter Prompt] " + prompt);
            String response = callGemini(prompt);
            System.out.println("[Gemini BugHunter Response] " + response);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            List<BugHunterQuestion> questions = new ArrayList<>();

            JsonNode arrayNode = root.isArray() ? root : root.path("questions");
            if (!arrayNode.isArray()) {
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
                    BugHunterQuestion q = new BugHunterQuestion();
                    q.setTitle(node.path("title").asText("Bug Hunter Challenge"));
                    q.setLanguage(node.path("language").asText("java"));
                    q.setDescription(node.path("description").asText("Identify the buggy line."));
                    
                    List<String> lines = new ArrayList<>();
                    JsonNode linesNode = node.path("codeLines");
                    if (linesNode.isArray()) {
                        for (JsonNode line : linesNode) {
                            lines.add(line.asText());
                        }
                    }
                    q.setCodeLines(lines);
                    q.setBuggyLineIndex(node.path("buggyLineIndex").asInt(0));
                    q.setExplanation(node.path("explanation").asText(""));
                    q.setXp(node.path("xp").asInt(15));
                    q.setTimeLimit(node.path("timeLimit").asInt(45));
                    
                    if (!q.getCodeLines().isEmpty()) {
                        questions.add(q);
                    }
                }
            }

            // Fallback seed if Gemini fails or returns empty array
            if (questions.isEmpty()) {
                questions.add(new BugHunterQuestion(
                    "Recursive Factorial (Java)", "java",
                    "Identify the line with the bug that causes an infinite loop / stack overflow error.",
                    List.of("public int factorial(int n) {", "    if (n <= 1) return 1;", "    return n * factorial(n);", "}"),
                    2, "Line 3 should call factorial(n - 1) instead of factorial(n). Calling factorial(n) causes infinite recursion.",
                    15, 45
                ));
                questions.add(new BugHunterQuestion(
                    "List Appender (Python)", "python",
                    "Identify the line with the bug where loop counters share the same global variable scope, outputting 3 thrice.",
                    List.of("def append_to_list(val, my_list=[]):", "    my_list.append(val)", "    return my_list"),
                    0, "Default arguments in Python are evaluated once at function definition. A mutable default value like my_list=[] persists across calls.",
                    15, 45
                ));
                questions.add(new BugHunterQuestion(
                    "Scope Binding (JavaScript)", "javascript",
                    "Identify the line with the bug where loop counters share the same global variable scope, outputting 3 thrice.",
                    List.of("for (var i = 0; i < 3; i++) {", "    setTimeout(() => console.log(i), 100);", "}"),
                    0, "Using var i creates a function-scoped or globally-scoped variable. After the loop completes, i equals 3, so all timeouts print 3. Change var to let.",
                    15, 45
                ));
            }

            return questions;
        } catch (Exception e) {
            System.err.println("[Gemini BugHunter] Error generating questions: " + e.getMessage());
            throw new RuntimeException("AI generation error: " + e.getMessage(), e);
        }
    }
}
