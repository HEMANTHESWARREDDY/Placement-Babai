package com.findmyjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.findmyjob.model.DailyGameQuiz;
import com.findmyjob.repository.DailyGameQuizRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DailyGameService {

    private static final Logger logger = LoggerFactory.getLogger(DailyGameService.class);

    private static final String GEMINI_ENDPOINT =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Autowired
    private DailyGameQuizRepository dailyGameQuizRepository;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getDailyQuiz(String gameType) {
        String dateStamp = todayIST();
        Optional<DailyGameQuiz> existing =
            dailyGameQuizRepository.findByGameTypeAndDateStamp(gameType, dateStamp);
        if (existing.isPresent()) {
            return existing.get().getQuestions();
        }
        logger.info("[DailyGame] No quiz found for {} on {}, generating…", gameType, dateStamp);
        return generateAndSave(gameType, dateStamp);
    }

    public synchronized List<Map<String, Object>> generateAndSave(String gameType, String dateStamp) {
        // Double-check (another thread may have already generated)
        Optional<DailyGameQuiz> existing =
            dailyGameQuizRepository.findByGameTypeAndDateStamp(gameType, dateStamp);
        if (existing.isPresent()) return existing.get().getQuestions();

        // Collect titles from last 4 days to exclude
        List<DailyGameQuiz> recent =
            dailyGameQuizRepository.findTop4ByGameTypeOrderByDateStampDesc(gameType);
        List<String> excludedTitles = new ArrayList<>();
        for (DailyGameQuiz q : recent) {
            if (q.getQuestions() != null) {
                for (Map<String, Object> item : q.getQuestions()) {
                    Object t = item.get("title");
                    if (t != null) excludedTitles.add(t.toString());
                }
            }
        }

        List<Map<String, Object>> questions = generateViaGemini(gameType, excludedTitles);

        DailyGameQuiz quiz = new DailyGameQuiz();
        quiz.setGameType(gameType);
        quiz.setDateStamp(dateStamp);
        quiz.setQuestions(questions);
        quiz.setCreatedAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
        dailyGameQuizRepository.save(quiz);

        logger.info("[DailyGame] Saved {} questions for {} on {}", questions.size(), gameType, dateStamp);
        return questions;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Prompt builders
    // ─────────────────────────────────────────────────────────────────────────

    private List<Map<String, Object>> generateViaGemini(String gameType, List<String> excludedTitles) {
        String prompt = buildPrompt(gameType, excludedTitles);
        try {
            String raw = callGemini(prompt);
            logger.debug("[DailyGame][{}] Gemini raw: {}", gameType, raw);
            return parseQuestions(raw);
        } catch (Exception e) {
            logger.error("[DailyGame][{}] Gemini failed: {}", gameType, e.getMessage());
            return fallback(gameType);
        }
    }

    private String buildPrompt(String gameType, List<String> excludedTitles) {
        String exclude = excludedTitles.isEmpty() ? "none" : excludedTitles.toString();
        
        if (gameType.startsWith("daily-quiz-")) {
            String topic = gameType.substring("daily-quiz-".length());
            return "Generate exactly 1 multiple choice question about " + topic + " programming/concepts.\n" +
                   "Return ONLY a valid JSON array with 1 object containing:\n" +
                   "- \"q\": the question text\n" +
                   "- \"a\": array of exactly 4 string options\n" +
                   "- \"c\": 0-based index of the correct option\n" +
                   "Crucial rule: Do NOT generate questions similar to: " + exclude + "\n" +
                   "Response MUST be ONLY valid JSON array.";
        }
        if (gameType.startsWith("arena-battle-")) {
            String topic = gameType.substring("arena-battle-".length());
            return "Generate exactly 3 multiple choice questions about " + topic + " programming/concepts for an arena battle.\n" +
                   "Return ONLY a valid JSON array of objects containing:\n" +
                   "- \"q\": the question text\n" +
                   "- \"a\": array of exactly 4 string options\n" +
                   "- \"c\": 0-based index of the correct option\n" +
                   "Crucial rule: Do NOT generate questions similar to: " + exclude + "\n" +
                   "Response MUST be ONLY valid JSON array.";
        }
        if (gameType.equals("company-quiz")) {
            return "Generate exactly 3 multiple choice questions (1 for MNC, 1 for Product Based, 1 for Startup level) for a company interview prep game.\n" +
                   "Return ONLY a valid JSON array of objects containing:\n" +
                   "- \"q\": the question text\n" +
                   "- \"a\": array of exactly 4 string options\n" +
                   "- \"c\": 0-based index of the correct option\n" +
                   "Crucial rule: Do NOT generate questions similar to: " + exclude + "\n" +
                   "Response MUST be ONLY valid JSON array.";
        }

        switch (gameType) {

            case "output-predictor":
                return """
Generate exactly 3 coding quiz questions for an 'Output Predictor' game.
For each question show a short code snippet (Java, Python, or JavaScript) and ask the player to predict the output.
Return ONLY a valid JSON array of objects with these fields:
- "title": short descriptive title (e.g. "Python List Nesting Length")
- "code": the code snippet as a plain string (NO markdown, NO backticks)
- "options": array of exactly 4 strings that are possible outputs
- "correctOption": the correct string from options
- "explanation": why that output occurs
- "xp": integer (15 or 20)
- "timeLimit": integer seconds (25-35)
Crucial rule: Do NOT generate questions with titles similar to: """ + exclude + """
Response MUST be ONLY valid JSON array.""";

            case "code-sprint":
                return """
Generate exactly 3 coding MCQ questions for a 'Code Sprint' game (pick-the-correct-code-snippet format).
For each question give a task/problem and 4 code snippet options where only one is correct.
Return ONLY a valid JSON array of objects with these fields:
- "title": the problem statement (e.g. "Correct implementation of String Reversal in JavaScript")
- "options": array of exactly 4 code-snippet strings (short, 1-2 lines each)
- "correctIndex": 0-based index of the correct option
- "explanation": why that answer is correct
- "xp": integer (20 or 25)
- "timeLimit": integer seconds (20-30)
Crucial rule: Do NOT generate questions with titles similar to: """ + exclude + """
Response MUST be ONLY valid JSON array.""";

            case "sql-detective":
                return """
Generate exactly 3 SQL Detective questions.
Each question gives a table schema and a task, and the player picks the correct SQL query.
Return ONLY a valid JSON array of objects with these fields:
- "title": short title (e.g. "Find the Second Highest Salary")
- "schema": table/schema description as a plain string
- "task": the SQL task description
- "options": array of exactly 4 SQL query strings
- "correctIndex": 0-based index of the correct query
- "explanation": why that query is correct
- "xp": integer (20)
- "timeLimit": integer seconds (40-50)
Crucial rule: Do NOT generate questions with titles similar to: """ + exclude + """
Response MUST be ONLY valid JSON array.""";

            case "error-fix":
                return """
Generate exactly 3 Error Fix questions.
Each question shows a broken code snippet and asks the player to pick the correct fix.
Return ONLY a valid JSON array of objects with these fields:
- "title": short descriptive title (e.g. "TypeScript Null Check Crash")
- "codeSnippet": the buggy code as a plain string (NO markdown, NO backticks)
- "description": brief description of what is wrong
- "options": array of exactly 4 strings — the proposed fixes (text or short code)
- "correctIndex": 0-based index of the correct fix
- "explanation": why that fix works
- "xp": integer (15 or 20)
- "timeLimit": integer seconds (35-45)
Crucial rule: Do NOT generate questions with titles similar to: """ + exclude + """
Response MUST be ONLY valid JSON array.""";

            default:
                throw new IllegalArgumentException("Unknown game type: " + gameType);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Parse / Fallback
    // ─────────────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseQuestions(String raw) throws Exception {
        JsonNode root = mapper.readTree(raw);
        JsonNode array = root.isArray() ? root : findFirstArray(root);
        if (array == null || !array.isArray()) throw new RuntimeException("No JSON array found in response");
        List<Map<String, Object>> result = new ArrayList<>();
        for (JsonNode node : array) {
            result.add(mapper.convertValue(node, Map.class));
        }
        return result;
    }

    private JsonNode findFirstArray(JsonNode root) {
        Iterator<JsonNode> it = root.elements();
        while (it.hasNext()) {
            JsonNode n = it.next();
            if (n.isArray()) return n;
        }
        return null;
    }

    private List<Map<String, Object>> fallback(String gameType) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (gameType.startsWith("daily-quiz-")) {
            list.add(Map.of("q", "Fallback daily question?", "a", List.of("Yes", "No", "Maybe", "Unknown"), "c", 0));
            return list;
        }
        if (gameType.startsWith("arena-battle-") || gameType.equals("company-quiz")) {
            list.add(Map.of("q", "Fallback Q1?", "a", List.of("A", "B", "C", "D"), "c", 0));
            list.add(Map.of("q", "Fallback Q2?", "a", List.of("A", "B", "C", "D"), "c", 1));
            list.add(Map.of("q", "Fallback Q3?", "a", List.of("A", "B", "C", "D"), "c", 2));
            return list;
        }
        switch (gameType) {
            case "output-predictor" -> {
                list.add(Map.of(
                    "title", "Python List Nesting Length",
                    "code", "lst = [1, 2, 3]\nlst.append([4, 5])\nprint(len(lst))",
                    "options", List.of("3", "4", "5", "TypeError"),
                    "correctOption", "4",
                    "explanation", "lst.append() inserts the entire list as one element, giving length 4.",
                    "xp", 15, "timeLimit", 30
                ));
                list.add(Map.of(
                    "title", "JavaScript Coercion Magic",
                    "code", "const result = '5' - 3 + '2';\nconsole.log(result);",
                    "options", List.of("'22'", "'4'", "'8'", "NaN"),
                    "correctOption", "'22'",
                    "explanation", "'5' - 3 = 2 (number), then 2 + '2' = '22' (string concat).",
                    "xp", 20, "timeLimit", 30
                ));
                list.add(Map.of(
                    "title", "Java Post-Increment",
                    "code", "int x = 5;\nint y = x++;\nint z = ++x;\nSystem.out.println(x + y + z);",
                    "options", List.of("17", "18", "19", "20"),
                    "correctOption", "19",
                    "explanation", "y=5, x becomes 6, ++x makes x=7 and z=7. Sum = 7+5+7 = 19.",
                    "xp", 15, "timeLimit", 30
                ));
            }
            case "code-sprint" -> {
                list.add(Map.of(
                    "title", "String Reversal in JavaScript",
                    "options", List.of("str.split('').reverse().join('')", "str.reverse().split('').join('')", "str.join('').reverse().split('')", "str.split().reverse().join()"),
                    "correctIndex", 0,
                    "explanation", "Strings must be split to array, reversed, then joined.",
                    "xp", 25, "timeLimit", 30
                ));
                list.add(Map.of(
                    "title", "Check even number without modulo",
                    "options", List.of("(num & 1) === 0", "(num | 1) === 0", "(num ^ 1) === 0", "~num === 0"),
                    "correctIndex", 0,
                    "explanation", "Bitwise AND with 1 checks the least significant bit.",
                    "xp", 30, "timeLimit", 25
                ));
                list.add(Map.of(
                    "title", "Swap two variables without temp",
                    "options", List.of("a = a ^ b; b = a ^ b; a = a ^ b;", "a = b; b = a;", "b = a + b; a = b - a; b = b - a;", "Both A and C"),
                    "correctIndex", 3,
                    "explanation", "Both XOR and arithmetic approaches work without a temp variable.",
                    "xp", 20, "timeLimit", 30
                ));
            }
            case "sql-detective" -> {
                list.add(Map.of(
                    "title", "Find the Second Highest Salary",
                    "schema", "Employee Table: { id: INT, name: VARCHAR, salary: INT }",
                    "task", "Find the employee with the second highest salary.",
                    "options", List.of("SELECT name FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1;", "SELECT name FROM Employee WHERE salary = (SELECT MAX(salary) FROM Employee);", "SELECT name FROM Employee ORDER BY salary ASC LIMIT 1 OFFSET 1;", "SELECT name FROM Employee GROUP BY salary HAVING COUNT(*) > 1;"),
                    "correctIndex", 0,
                    "explanation", "ORDER BY salary DESC LIMIT 1 OFFSET 1 skips the top salary.",
                    "xp", 20, "timeLimit", 45
                ));
                list.add(Map.of(
                    "title", "Find Duplicate Emails",
                    "schema", "Person Table: { id: INT, email: VARCHAR }",
                    "task", "Find all duplicate emails.",
                    "options", List.of("SELECT email FROM Person GROUP BY email HAVING COUNT(email) > 1;", "SELECT DISTINCT email FROM Person WHERE id > 1;", "SELECT email FROM Person WHERE COUNT(email) > 1;", "SELECT email FROM Person ORDER BY email HAVING UNIQUE = FALSE;"),
                    "correctIndex", 0,
                    "explanation", "GROUP BY + HAVING COUNT > 1 finds duplicates.",
                    "xp", 20, "timeLimit", 45
                ));
                list.add(Map.of(
                    "title", "Count Records by Category",
                    "schema", "Orders Table: { id: INT, category: VARCHAR, amount: DECIMAL }",
                    "task", "Count how many orders exist in each category.",
                    "options", List.of("SELECT category, COUNT(*) FROM Orders GROUP BY category;", "SELECT COUNT(*) FROM Orders WHERE category IS NOT NULL;", "SELECT category FROM Orders COUNT(*);", "SELECT category, SUM(*) FROM Orders GROUP BY category;"),
                    "correctIndex", 0,
                    "explanation", "GROUP BY category + COUNT(*) gives the count per category.",
                    "xp", 20, "timeLimit", 45
                ));
            }
            case "error-fix" -> {
                list.add(Map.of(
                    "title", "TypeScript Null Check Crash",
                    "codeSnippet", "function greet(user: { name: string } | null) {\n  console.log(\"Hello, \" + user.name.toUpperCase());\n}",
                    "description", "Throws a runtime error if user is null.",
                    "options", List.of("console.log(\"Hello, \" + (user?.name?.toUpperCase() ?? 'Guest'));", "console.log(\"Hello, \" + user.name!.toUpperCase());", "console.log(\"Hello, \" + user.name.toUpperCase() || 'Guest');", "console.log(\"Hello, \" + user.name.toUpperCase() as any);"),
                    "correctIndex", 0,
                    "explanation", "Optional chaining user?.name?.toUpperCase() safely handles null.",
                    "xp", 15, "timeLimit", 40
                ));
                list.add(Map.of(
                    "title", "Python UnboundLocalError",
                    "codeSnippet", "count = 0\ndef increment():\n    count += 1\nincrement()",
                    "description", "Throws UnboundLocalError when modifying outer scope variable.",
                    "options", List.of("Add 'global count' inside the increment() function body.", "Pass count as a default argument.", "Change count += 1 to count = count + 1.", "Rename the variable count."),
                    "correctIndex", 0,
                    "explanation", "The 'global' keyword allows modifying outer scope variables in Python.",
                    "xp", 20, "timeLimit", 40
                ));
                list.add(Map.of(
                    "title", "Java NullPointerException",
                    "codeSnippet", "String s = null;\nSystem.out.println(s.length());",
                    "description", "Calling .length() on a null String throws NullPointerException.",
                    "options", List.of("Check s != null before calling .length()", "Use s.equals(null) before calling .length()", "Use s == null && s.length()", "Catch NullPointerException and ignore"),
                    "correctIndex", 0,
                    "explanation", "A null check before accessing methods prevents NullPointerException.",
                    "xp", 15, "timeLimit", 40
                ));
            }
        }
        return list;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Gemini HTTP
    // ─────────────────────────────────────────────────────────────────────────

    private String callGemini(String prompt) throws Exception {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new RuntimeException("Gemini API key not configured");
        }
        String body = String.format(
            "{\"contents\":[{\"parts\":[{\"text\":%s}]}]}",
            mapper.writeValueAsString(prompt)
        );
        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(GEMINI_ENDPOINT + geminiApiKey))
            .header("Content-Type", "application/json")
            .timeout(Duration.ofSeconds(30))
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("Gemini error " + resp.statusCode() + ": " + resp.body());
        }
        JsonNode root = mapper.readTree(resp.body());
        String text = root.path("candidates").get(0)
            .path("content").path("parts").get(0).path("text").asText().trim();
        if (text.startsWith("```")) {
            text = text.replaceAll("^```(?:json)?\\n?|\\n?```$", "");
        }
        return text.trim();
    }

    private String todayIST() {
        return LocalDate.now(ZoneId.of("Asia/Kolkata"))
            .format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
