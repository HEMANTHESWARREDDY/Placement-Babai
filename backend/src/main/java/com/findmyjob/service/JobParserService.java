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
                Job result = parseWithGeminiSearch(url);
                if (result != null && result.getTitle() != null
                        && !result.getTitle().isEmpty()
                        && !result.getTitle().equalsIgnoreCase("Parsed Job")) {
                    System.out.println("== Gemini extraction succeeded: " + result.getTitle());
                    return result;
                }
                System.err.println("== Gemini returned incomplete data, falling back to heuristics");
            } catch (Exception e) {
                System.err.println("== Gemini failed (" + e.getMessage() + "), falling back to heuristics");
            }
        } else {
            System.out.println("== No Gemini key — using Jsoup heuristics");
        }

        return extractWithJsoupFallback(url, job);
    }

    /**
     * Uses Gemini 2.0 Flash with Google Search grounding.
     * Gemini searches the web for the job posting and extracts real data.
     * Asks for a plain-text JSON block to avoid the response_mime_type + tools
     * conflict.
     */
    private Job parseWithGeminiSearch(String url) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        // Extract company/title hints from the URL itself for better search grounding
        String urlHint = "";
        try {
            String path = new URI(url).getPath();
            // e.g. /global/en/job/695817WD/Associate-Deals-Data-Science-Bangalore
            // or /TGnewUI/Search/home/HomeWithPreLoad?partnerid=...&jobid=...
            urlHint = path.replaceAll("[/_\\-]", " ").replaceAll("\\s+", " ").trim();
        } catch (Exception ignored) {
        }

        String prompt = "Search for and find the full details of this specific job posting:\n" +
                "URL: " + url + "\n" +
                "URL hints: " + urlHint + "\n\n" +
                "Based on the actual job posting at that URL (search for it, read it, or use your knowledge of it), " +
                "return ONLY a raw JSON object (no markdown fences, no explanation) with exactly these keys:\n" +
                "{\n" +
                "  \"title\": \"exact job title from the posting\",\n" +
                "  \"company\": \"exact company name (e.g. IBM, PwC, not subsidiary)\",\n" +
                "  \"location\": \"city, country (e.g. Bangalore, India)\",\n" +
                "  \"description\": \"professional summary of the role, max 400 chars\",\n" +
                "  \"skills\": \"comma-separated required technical skills\",\n" +
                "  \"jobType\": \"Full-time (Internship) or Full-time or Part-time\",\n" +
                "  \"experienceLevel\": \"e.g. 0 - 1 Years (Entry Level / Student) or 1 - 3 Years\",\n" +
                "  \"salary\": \"if not stated: Not Specified (Standard industry competitive pay)\",\n" +
                "  \"category\": \"e.g. Data Science or Software Engineering / IT Operations\",\n" +
                "  \"role\": \"e.g. Data Science / Analytics or Developer / Engineer\",\n" +
                "  \"companyType\": \"e.g. MNC (Large Enterprise) or Startup\",\n" +
                "  \"responsibilities\": \"5 lines, one responsibility per line, no bullet symbols\",\n" +
                "  \"requirements\": \"5 lines, one requirement per line, no bullet symbols\",\n" +
                "  \"passoutYear\": \"eligible graduation batch years e.g. 2021, 2022, 2023\",\n" +
                "  \"expiryDate\": \"deadline if shown, else: Don't know\",\n" +
                "  \"companyLogo\": \"official company logo image URL or empty string\"\n" +
                "}\n\n" +
                "CRITICAL: Use real data from the actual job posting. Extract every detail accurately.";

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", new Object[] { textPart });

        // google_search grounding — lets Gemini search the web for accurate data
        Map<String, Object> googleSearchTool = new HashMap<>();
        googleSearchTool.put("google_search", new HashMap<>());

        // Also add url_context as a second tool — Gemini will pick whichever works
        Map<String, Object> urlContextTool = new HashMap<>();
        urlContextTool.put("url_context", new HashMap<>());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", new Object[] { content });
        requestBody.put("tools", new Object[] { googleSearchTool, urlContextTool });
        // NO response_mime_type — conflicts with tools

        String jsonBody = mapper.writeValueAsString(requestBody);
        System.out.println("== Calling Gemini with google_search + url_context tools for: " + url);

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
            System.err.println("== Gemini error body: " +
                    response.body().substring(0, Math.min(600, response.body().length())));
            throw new RuntimeException("Gemini API error: " + response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());

        // Collect all text parts (search-grounded responses may have multiple parts)
        StringBuilder allText = new StringBuilder();
        JsonNode candidates = root.path("candidates");
        if (!candidates.isEmpty()) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            for (JsonNode part : parts) {
                String text = part.path("text").asText("");
                if (!text.isEmpty())
                    allText.append(text);
            }
        }

        String responseText = allText.toString().trim();
        System.out.println("== Gemini response preview: " +
                responseText.substring(0, Math.min(400, responseText.length())));

        String jsonStr = extractJson(responseText);
        System.out.println("== Extracted JSON preview: " +
                jsonStr.substring(0, Math.min(300, jsonStr.length())));

        return mapJsonToJob(url, mapper.readTree(jsonStr));
    }

    /**
     * Robustly extracts a JSON object from a response that may have markdown or
     * prose around it
     */
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
        // Find raw { ... } block
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

        // Fallback: infer company from URL domain
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

    // ──────────────────────────────────────────────────────────────────────────
    // Jsoup heuristic fallback (used when Gemini is not configured or fails)
    // ──────────────────────────────────────────────────────────────────────────

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
            System.err.println("Jsoup fallback failed: " + e.getMessage());
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
