package com.findmyjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.findmyjob.model.Job;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class JobParserService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    public boolean isGeminiConfigured() {
        return geminiApiKey != null && !geminiApiKey.trim().isEmpty();
    }

    public Job extractJobFromUrl(String url) {
        Job job = new Job();
        job.setApplyLink(url);

        if (isGeminiConfigured()) {
            try {
                Job result = parseWithGemini(url);
                if (result != null && result.getTitle() != null
                        && !result.getTitle().isEmpty()
                        && !result.getTitle().equalsIgnoreCase("Parsed Job")) {
                    System.out.println("== Gemini extraction succeeded: " + result.getTitle());
                    return result;
                }
                System.err.println("== Gemini returned incomplete data, falling back to heuristics");
            } catch (Exception e) {
                System.err.println("== Gemini failed: " + e.getMessage() + " — trying heuristics");
            }
        } else {
            System.out.println("== No Gemini key — using Jsoup heuristics");
        }

        return extractWithJsoupFallback(url, job);
    }

    /**
     * Single Gemini API call using url_context tool (so Gemini browses the page
     * directly)
     * and asks Gemini to return data as a JSON block in plain text.
     * We then parse that JSON block ourselves.
     *
     * This avoids the conflict between "tools" and "response_mime_type:
     * application/json".
     */
    private Job parseWithGemini(String url) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        String prompt = "Visit the following job posting URL and extract all job details.\n" +
                "URL: " + url + "\n\n" +
                "Return ONLY a JSON object (no explanation, no extra text) with exactly these keys:\n" +
                "{\n" +
                "  \"title\": \"exact job title, e.g., Intern - Associate Systems Management Specialist\",\n" +
                "  \"company\": \"hiring company name, e.g., IBM\",\n" +
                "  \"location\": \"city, country, e.g., Bangalore, India\",\n" +
                "  \"description\": \"max 400 char professional summary of the role\",\n" +
                "  \"skills\": \"comma-separated required skills, e.g., Linux, Python, SQL\",\n" +
                "  \"jobType\": \"e.g., Full-time (Internship), Full-time, Part-time\",\n" +
                "  \"experienceLevel\": \"e.g., 0 - 1 Years (Entry Level / Student), 1 - 3 Years\",\n" +
                "  \"salary\": \"e.g., Not Specified (Standard industry internship stipend), 10 - 20 LPA\",\n" +
                "  \"category\": \"e.g., Software Engineering / IT Operations, Data Science, Technology\",\n" +
                "  \"role\": \"e.g., Developer / Engineer, Data Science / Analytics\",\n" +
                "  \"companyType\": \"e.g., MNC (Large Enterprise), Startup, Product Company\",\n" +
                "  \"responsibilities\": \"max 5 items, one per line, no bullet symbols\",\n" +
                "  \"requirements\": \"max 5 items, one per line, no bullet symbols\",\n" +
                "  \"passoutYear\": \"eligible graduation years, e.g., 2024, 2025\",\n" +
                "  \"expiryDate\": \"application deadline if shown, else: Don't know\",\n" +
                "  \"companyLogo\": \"direct URL to company logo if visible, else empty string\"\n" +
                "}\n\n" +
                "IMPORTANT: Actually browse and read the live page. Do NOT guess or use generic data.";

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", new Object[] { textPart });

        // url_context allows Gemini to browse the URL — same as Gemini chat
        Map<String, Object> urlContextTool = new HashMap<>();
        urlContextTool.put("url_context", new HashMap<>());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", new Object[] { content });
        requestBody.put("tools", new Object[] { urlContextTool });
        // NOTE: NO response_mime_type — it conflicts with tool use

        String jsonBody = mapper.writeValueAsString(requestBody);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + geminiApiKey))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("== Gemini status: " + response.statusCode());

        if (response.statusCode() != 200) {
            System.err.println(
                    "== Gemini error: " + response.body().substring(0, Math.min(500, response.body().length())));
            throw new RuntimeException("Gemini API error: " + response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());

        // Collect all text from all parts (tool-enabled responses can have multiple
        // parts)
        StringBuilder fullText = new StringBuilder();
        JsonNode parts = root.path("candidates").get(0).path("content").path("parts");
        for (JsonNode part : parts) {
            String text = part.path("text").asText("");
            if (!text.isEmpty())
                fullText.append(text);
        }

        String responseText = fullText.toString().trim();
        System.out.println(
                "== Gemini response preview: " + responseText.substring(0, Math.min(300, responseText.length())));

        // Extract JSON from response (Gemini may wrap in markdown code fences)
        String jsonStr = extractJson(responseText);
        System.out.println("== Parsed JSON preview: " + jsonStr.substring(0, Math.min(200, jsonStr.length())));

        return mapJsonToJob(url, mapper.readTree(jsonStr));
    }

    /** Extracts the JSON object string from a possibly markdown-wrapped response */
    private String extractJson(String text) {
        // Remove ```json ... ``` fences
        if (text.contains("```json")) {
            int start = text.indexOf("```json") + 7;
            int end = text.lastIndexOf("```");
            if (end > start)
                return text.substring(start, end).trim();
        }
        if (text.contains("```")) {
            int start = text.indexOf("```") + 3;
            int end = text.lastIndexOf("```");
            if (end > start)
                return text.substring(start, end).trim();
        }
        // Try to find raw { ... } block
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end > start)
            return text.substring(start, end + 1).trim();
        return text.trim();
    }

    private Job mapJsonToJob(String url, JsonNode d) {
        Job job = new Job();
        job.setApplyLink(url);
        job.setTitle(get(d, "title", "Parsed Job"));
        job.setCompany(get(d, "company", "Unknown Company"));

        // Fallback company from URL domain if AI failed
        if (job.getCompany().equalsIgnoreCase("Not Specified")
                || job.getCompany().equalsIgnoreCase("Unknown Company")) {
            try {
                String domain = new URI(url).getHost();
                job.setCompany(domain.startsWith("www.") ? domain.substring(4) : domain);
            } catch (Exception ignored) {
            }
        }

        job.setLocation(get(d, "location", "Remote / Local"));
        job.setDescription(get(d, "description", ""));
        job.setSkills(get(d, "skills", ""));
        job.setJobType(get(d, "jobType", "Full-time"));
        job.setExperienceLevel(get(d, "experienceLevel", "0-2 Years"));
        job.setSalary(get(d, "salary", "To be discussed"));
        job.setCategory(get(d, "category", "Technology"));
        job.setRole(get(d, "role", "Developer / Engineer"));
        job.setCompanyType(get(d, "companyType", "MNC (Large Enterprise)"));
        job.setResponsibilities(get(d, "responsibilities", ""));
        job.setRequirements(get(d, "requirements", ""));
        job.setPassoutYear(get(d, "passoutYear", ""));
        job.setCompanyLogo(get(d, "companyLogo", ""));

        String expiry = get(d, "expiryDate", "");
        if (!expiry.isEmpty())
            job.setExpiryDate(expiry);

        return job;
    }

    private String get(JsonNode node, String field, String def) {
        String v = node.path(field).asText(def);
        return (v == null || v.trim().isEmpty()) ? def : v.trim();
    }

    // ─── Jsoup heuristic fallback (no Gemini) ────────────────────────────────

    private Job extractWithJsoupFallback(String url, Job job) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .timeout(12000)
                    .followRedirects(true)
                    .get();
            return parseWithHeuristics(job, url, doc, doc.body() != null ? doc.body().text() : "");
        } catch (Exception e) {
            System.err.println("Jsoup fallback also failed: " + e.getMessage());
            job.setTitle("Unable to automatically extract details");
            job.setCompany("Unknown");
            return job;
        }
    }

    private Job parseWithHeuristics(Job job, String url, Document doc, String pageText) {
        String title = "";
        if (doc.select("meta[property=og:title]").first() != null)
            title = doc.select("meta[property=og:title]").first().attr("content");
        else if (!doc.title().isEmpty())
            title = doc.title();
        if (title.contains("|"))
            title = title.split("\\|")[0].trim();
        if (title.contains("-"))
            title = title.split("-")[0].trim();
        job.setTitle(title.isEmpty() ? "Parsed Job" : title);

        String company = "";
        if (doc.select("meta[property=og:site_name]").first() != null)
            company = doc.select("meta[property=og:site_name]").first().attr("content");
        if (company.isEmpty()) {
            try {
                String d = new java.net.URI(url).getHost();
                company = d.startsWith("www.") ? d.substring(4) : d;
            } catch (Exception ignored) {
            }
        }
        job.setCompany(company.isEmpty() ? "Unknown Company" : company);

        String desc = "";
        if (doc.select("meta[property=og:description]").first() != null)
            desc = doc.select("meta[property=og:description]").first().attr("content");
        else if (doc.select("meta[name=description]").first() != null)
            desc = doc.select("meta[name=description]").first().attr("content");
        job.setDescription(desc.length() > 500 ? desc.substring(0, 497) + "..." : desc);

        job.setLocation("Remote / Local");
        job.setJobType("Full-time");
        job.setExperienceLevel("0-2 Years");
        job.setSalary("To be discussed");
        job.setCompanyType("Corporate");
        job.setCategory("Technology");
        job.setRole("Developer / Engineer");

        String lower = pageText.toLowerCase();
        if (lower.contains("part-time"))
            job.setJobType("Part-time");
        else if (lower.contains("internship"))
            job.setJobType("Internship");
        if (lower.contains("bengaluru") || lower.contains("bangalore"))
            job.setLocation("Bangalore, India");
        else if (lower.contains("hyderabad"))
            job.setLocation("Hyderabad, India");
        else if (lower.contains("remote"))
            job.setLocation("Remote");
        if (lower.contains("data science") || lower.contains("machine learning")) {
            job.setCategory("Data Science");
            job.setRole("Data Science / Analytics");
        }
        return job;
    }
}
