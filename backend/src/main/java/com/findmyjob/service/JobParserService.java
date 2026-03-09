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
import java.util.HashMap;
import java.util.Map;

@Service
public class JobParserService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    public boolean isGeminiConfigured() {
        return geminiApiKey != null && !geminiApiKey.trim().isEmpty();
    }

    public Job extractJobFromUrl(String url) {
        Job job = new Job();
        job.setApplyLink(url);

        // If Gemini is configured, let Gemini browse the URL directly (same as Gemini
        // chat)
        if (isGeminiConfigured()) {
            try {
                System.out.println("== Using Gemini URL context to browse: " + url);
                Job geminiResult = parseWithGeminiUrlContext(url);
                if (geminiResult.getTitle() != null
                        && !geminiResult.getTitle().isEmpty()
                        && !geminiResult.getTitle().equalsIgnoreCase("Parsed Job")
                        && !geminiResult.getTitle().equalsIgnoreCase("Unable to automatically extract details")) {
                    System.out.println("== Gemini URL context succeeded: " + geminiResult.getTitle());
                    return geminiResult;
                }
                System.err.println("== Gemini URL context returned incomplete data, trying Jsoup fallback");
            } catch (Exception e) {
                System.err.println("== Gemini URL context failed: " + e.getMessage() + " — trying Jsoup fallback");
            }
        } else {
            System.out.println("== Gemini key not configured — using Jsoup heuristic extraction");
        }

        // Fallback: Jsoup + heuristics for when Gemini is not configured or fails
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.5")
                    .timeout(12000)
                    .followRedirects(true)
                    .get();
            String bodyText = doc.body() != null ? doc.body().text() : "";
            return parseWithHeuristics(job, url, doc, bodyText);
        } catch (Exception e) {
            System.err.println("Jsoup fallback also failed for: " + url + " — " + e.getMessage());
            job.setTitle("Unable to automatically extract details");
            job.setCompany("Unknown");
        }

        return job;
    }

    /**
     * Uses Gemini's built-in URL context tool to browse the page directly —
     * exactly the same as when a user pastes a link into Gemini chat.
     */
    private Job parseWithGeminiUrlContext(String url) throws Exception {
        String prompt = "Visit this job posting URL and extract ALL job details into a valid JSON object.\n" +
                "URL: " + url + "\n\n" +
                "The JSON must have EXACTLY these keys (use 'Don\\'t know' or 'Not Specified' if missing):\n" +
                "- title      (exact job title, e.g., Associate - Deals, Data Science)\n" +
                "- company    (hiring company name, e.g., PwC)\n" +
                "- location   (city and country, e.g., Bangalore, India)\n" +
                "- description (max 400 chars, professional summary of the role)\n" +
                "- skills     (comma separated required skills, e.g., Python, R, SQL, Machine Learning)\n" +
                "- jobType    (e.g., Full-time, Full-time (Internship), Part-time, Contract)\n" +
                "- experienceLevel (e.g., 1 - 3 Years, 0 - 1 Years (Entry Level / Student))\n" +
                "- salary     (e.g., Not Specified (Standard industry competitive pay), 10 - 20 LPA)\n" +
                "- category   (e.g., Data Science, Technology, Software Engineering / IT Operations)\n" +
                "- role       (e.g., Data Science / Analytics, Developer / Engineer, Analyst)\n" +
                "- companyType (e.g., MNC (Large Enterprise), Startup, Product Company)\n" +
                "- responsibilities (max 5 lines, one per line, no bullet symbols)\n" +
                "- requirements (max 5 lines, one per line, no bullet symbols)\n" +
                "- passoutYear (eligible graduation batch years, e.g., 2021, 2022, 2023)\n" +
                "- expiryDate (application deadline if available, else 'Don\\'t know')\n" +
                "- companyLogo (direct URL to company logo image if visible, else '')\n\n" +
                "CRITICAL: Actually browse and read the page. Do NOT make up generic placeholder content.";

        // Build Gemini request with url_context tool enabled
        ObjectMapper mapper = new ObjectMapper();

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", new Object[] { textPart });

        // url_context tool allows Gemini to browse URLs directly
        Map<String, Object> urlContextTool = new HashMap<>();
        urlContextTool.put("url_context", new HashMap<>());

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("response_mime_type", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", new Object[] { content });
        requestBody.put("tools", new Object[] { urlContextTool });
        requestBody.put("generationConfig", generationConfig);

        String jsonBody = mapper.writeValueAsString(requestBody);
        System.out.println("== Calling Gemini with url_context tool for: " + url);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
                                + geminiApiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("== Gemini response status: " + response.statusCode());

        if (response.statusCode() != 200) {
            System.err.println(
                    "== Gemini error body: " + response.body().substring(0, Math.min(500, response.body().length())));
            throw new RuntimeException("Gemini API error: " + response.statusCode());
        }

        JsonNode rootNode = mapper.readTree(response.body());
        JsonNode candidates = rootNode.path("candidates");

        if (candidates.isEmpty()) {
            throw new RuntimeException("Gemini returned no candidates");
        }

        String responseText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        System.out.println("== Gemini raw response (first 300 chars): "
                + responseText.substring(0, Math.min(300, responseText.length())));

        // Strip markdown code fences if present
        if (responseText.startsWith("```json")) {
            responseText = responseText.substring(7).trim();
            if (responseText.endsWith("```"))
                responseText = responseText.substring(0, responseText.length() - 3).trim();
        } else if (responseText.startsWith("```")) {
            responseText = responseText.substring(3).trim();
            if (responseText.endsWith("```"))
                responseText = responseText.substring(0, responseText.length() - 3).trim();
        }

        return mapJsonToJob(url, mapper.readTree(responseText));
    }

    private Job mapJsonToJob(String url, JsonNode jobData) {
        Job job = new Job();
        job.setApplyLink(url);
        job.setTitle(clean(jobData, "title", "Parsed Job"));
        job.setCompany(clean(jobData, "company", "Unknown Company"));

        // If company is generic, infer from URL domain
        if (job.getCompany().equalsIgnoreCase("Not Specified")
                || job.getCompany().equalsIgnoreCase("Unknown Company")) {
            try {
                String domain = new URI(url).getHost();
                job.setCompany(domain.startsWith("www.") ? domain.substring(4) : domain);
            } catch (Exception ignored) {
            }
        }

        job.setLocation(clean(jobData, "location", "Remote / Local"));
        job.setDescription(clean(jobData, "description", ""));
        job.setSkills(clean(jobData, "skills", ""));
        job.setJobType(clean(jobData, "jobType", "Full-time"));
        job.setExperienceLevel(clean(jobData, "experienceLevel", "0 - 2 Years"));
        job.setSalary(clean(jobData, "salary", "To be discussed"));
        job.setCategory(clean(jobData, "category", "Technology"));
        job.setRole(clean(jobData, "role", "Developer / Engineer"));
        job.setCompanyType(clean(jobData, "companyType", "Corporate"));
        job.setResponsibilities(clean(jobData, "responsibilities", ""));
        job.setRequirements(clean(jobData, "requirements", ""));
        job.setPassoutYear(clean(jobData, "passoutYear", ""));
        job.setCompanyLogo(clean(jobData, "companyLogo", ""));

        String expiryText = clean(jobData, "expiryDate", "");
        if (!expiryText.isEmpty()) {
            job.setExpiryDate(expiryText);
        }

        return job;
    }

    private String clean(JsonNode node, String field, String defaultVal) {
        String val = node.path(field).asText(defaultVal);
        return (val == null || val.trim().isEmpty()) ? defaultVal : val.trim();
    }

    private Job parseWithHeuristics(Job job, String url, Document doc, String pageText) {
        // 1. Title
        String title = "";
        if (doc.select("meta[property=og:title]").first() != null) {
            title = doc.select("meta[property=og:title]").first().attr("content");
        } else if (doc.title() != null && !doc.title().isEmpty()) {
            title = doc.title();
        }
        if (title.contains("|"))
            title = title.split("\\|")[0].trim();
        if (title.contains("-"))
            title = title.split("-")[0].trim();
        job.setTitle(title.isEmpty() ? "Parsed Job" : title);

        // 2. Company
        String company = "";
        if (doc.select("meta[property=og:site_name]").first() != null) {
            company = doc.select("meta[property=og:site_name]").first().attr("content");
        } else {
            try {
                String domain = new java.net.URI(url).getHost();
                company = domain.startsWith("www.") ? domain.substring(4) : domain;
            } catch (Exception ignored) {
            }
        }
        job.setCompany(company.isEmpty() ? "Unknown Company" : company);

        // 3. Description
        String description = "";
        if (doc.select("meta[property=og:description]").first() != null) {
            description = doc.select("meta[property=og:description]").first().attr("content");
        } else if (doc.select("meta[name=description]").first() != null) {
            description = doc.select("meta[name=description]").first().attr("content");
        }
        job.setDescription(description.length() > 500 ? description.substring(0, 497) + "..." : description);

        // 4. Defaults + keyword guesses
        job.setLocation("Remote / Local");
        job.setJobType("Full-time");
        job.setExperienceLevel("0-2 Years");
        job.setSalary("To be discussed");
        job.setCompanyType("Corporate");
        job.setCategory("Technology");
        job.setRole("Developer / Engineer");

        String lower = pageText.toLowerCase();
        if (lower.contains("part-time") || lower.contains("part time"))
            job.setJobType("Part-time");
        else if (lower.contains("internship") || lower.contains("intern"))
            job.setJobType("Internship");

        if (lower.contains("bengaluru") || lower.contains("bangalore"))
            job.setLocation("Bangalore, India");
        else if (lower.contains("hyderabad"))
            job.setLocation("Hyderabad, India");
        else if (lower.contains("pune"))
            job.setLocation("Pune, India");
        else if (lower.contains("remote"))
            job.setLocation("Remote");

        if (lower.contains("python") && lower.contains("java"))
            job.setSkills("Java, Python");
        else if (lower.contains("react") && lower.contains("node"))
            job.setSkills("React, Node.js");
        else if (lower.contains("data science") || lower.contains("machine learning")) {
            job.setCategory("Data Science");
            job.setRole("Data Science / Analytics");
        } else if (lower.contains("sales") || lower.contains("marketing")) {
            job.setCategory("Marketing");
            job.setRole("Specialist");
        }

        return job;
    }
}
