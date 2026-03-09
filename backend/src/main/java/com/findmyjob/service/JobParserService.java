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

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    public boolean isGeminiConfigured() {
        return geminiApiKey != null && !geminiApiKey.trim().isEmpty();
    }

    public Job extractJobFromUrl(String url) {
        Job job = new Job();
        job.setApplyLink(url);

        if (isGeminiConfigured()) {
            try {
                // Step 1: Let Gemini browse the URL and dump all job details as text
                String browsedContent = browseUrlWithGemini(url);
                System.out.println("== Gemini browsed content length: " + browsedContent.length());
                System.out
                        .println("== Preview: " + browsedContent.substring(0, Math.min(400, browsedContent.length())));

                if (browsedContent.length() > 100) {
                    // Step 2: Ask Gemini to convert that text content to strict JSON
                    Job result = extractStructuredDataFromText(url, browsedContent);
                    if (result != null && result.getTitle() != null
                            && !result.getTitle().isEmpty()
                            && !result.getTitle().equalsIgnoreCase("Parsed Job")) {
                        System.out.println("== Two-step Gemini extraction succeeded: " + result.getTitle());
                        return result;
                    }
                }
                System.err.println("== Gemini two-step extraction returned incomplete data, using heuristics");
            } catch (Exception e) {
                System.err.println("== Gemini extraction failed: " + e.getMessage());
            }
        } else {
            System.out.println("== No Gemini key — using Jsoup heuristics");
        }

        // Last resort: Jsoup heuristic extraction
        return extractWithJsoupFallback(url, job);
    }

    /**
     * Step 1: Call Gemini with url_context tool (NO JSON mode) to get raw job page
     * text.
     * This is exactly what Gemini does when you paste a link in chat.
     */
    private String browseUrlWithGemini(String url) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        String promptText = "Please visit this URL and extract ALL visible text content from the job posting page. " +
                "Include every detail visible on the page: job title, company, location, salary, experience, " +
                "job description, responsibilities, qualifications, skills, and any other information. " +
                "DO NOT summarize — give me all the raw detail from the page.\n\nURL: " + url;

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", promptText);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", new Object[] { textPart });

        // url_context lets Gemini open and read the URL directly
        Map<String, Object> urlContextTool = new HashMap<>();
        urlContextTool.put("url_context", new HashMap<>());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", new Object[] { content });
        requestBody.put("tools", new Object[] { urlContextTool });
        // NOTE: Do NOT set response_mime_type here — tools and JSON mode conflict

        String jsonBody = mapper.writeValueAsString(requestBody);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(30))
                .build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + geminiApiKey))
                .header("Content-Type", "application/json")
                .timeout(java.time.Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("== Step 1 Gemini status: " + response.statusCode());

        if (response.statusCode() != 200) {
            System.err.println(
                    "== Step 1 error: " + response.body().substring(0, Math.min(600, response.body().length())));
            throw new RuntimeException("Gemini browse failed: " + response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());
        // Collect all text parts from all candidates (tool responses can have multiple
        // parts)
        StringBuilder extractedText = new StringBuilder();
        JsonNode candidates = root.path("candidates");
        if (!candidates.isEmpty()) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            for (JsonNode part : parts) {
                String text = part.path("text").asText("");
                if (!text.isEmpty()) {
                    extractedText.append(text).append("\n");
                }
            }
        }
        return extractedText.toString().trim();
    }

    /**
     * Step 2: Take the browsed text content and ask Gemini to extract it as strict
     * JSON.
     */
    private Job extractStructuredDataFromText(String url, String pageContent) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        String prompt = "You are an expert job data extractor. Based on the following job posting content, " +
                "extract data into a strict JSON object with EXACTLY these keys:\n" +
                "- title: exact job title\n" +
                "- company: company name (e.g., IBM, PwC)\n" +
                "- location: city and country (e.g., Bangalore, India)\n" +
                "- description: max 400 char professional summary\n" +
                "- skills: comma-separated required skills\n" +
                "- jobType: e.g., Full-time (Internship), Full-time, Part-time\n" +
                "- experienceLevel: e.g., 0 - 1 Years (Entry Level / Student), 1 - 3 Years\n" +
                "- salary: e.g., Not Specified (Standard industry internship stipend), 10 - 20 LPA\n" +
                "- category: e.g., Software Engineering / IT Operations, Data Science, Technology\n" +
                "- role: e.g., Developer / Engineer, Data Science / Analytics\n" +
                "- companyType: e.g., MNC (Large Enterprise), Startup\n" +
                "- responsibilities: max 5 lines, one per line, no bullets\n" +
                "- requirements: max 5 lines, one per line, no bullets\n" +
                "- passoutYear: eligible graduation years (e.g., 2024, 2025)\n" +
                "- expiryDate: deadline or 'Don't know'\n" +
                "- companyLogo: URL to company logo image if mentioned, else empty string\n\n" +
                "Apply Link (always this value): " + url + "\n\n" +
                "Job Posting Content:\n" + pageContent;

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", new Object[] { textPart });

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("response_mime_type", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", new Object[] { content });
        requestBody.put("generationConfig", generationConfig);

        String jsonBody = mapper.writeValueAsString(requestBody);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + geminiApiKey))
                .header("Content-Type", "application/json")
                .timeout(java.time.Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("== Step 2 Gemini status: " + response.statusCode());

        if (response.statusCode() != 200) {
            System.err.println(
                    "== Step 2 error: " + response.body().substring(0, Math.min(600, response.body().length())));
            throw new RuntimeException("Gemini JSON extraction failed: " + response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());
        String responseText = root.path("candidates").get(0)
                .path("content").path("parts").get(0).path("text").asText();

        // Strip markdown fences if present
        if (responseText.startsWith("```json")) {
            responseText = responseText.substring(7).trim();
            if (responseText.endsWith("```"))
                responseText = responseText.substring(0, responseText.length() - 3).trim();
        } else if (responseText.startsWith("```")) {
            responseText = responseText.substring(3).trim();
            if (responseText.endsWith("```"))
                responseText = responseText.substring(0, responseText.length() - 3).trim();
        }

        System.out
                .println("== Step 2 JSON preview: " + responseText.substring(0, Math.min(300, responseText.length())));
        return mapJsonToJob(url, mapper.readTree(responseText));
    }

    private Job mapJsonToJob(String url, JsonNode jobData) {
        Job job = new Job();
        job.setApplyLink(url);
        job.setTitle(get(jobData, "title", "Parsed Job"));
        job.setCompany(get(jobData, "company", "Unknown Company"));

        if (job.getCompany().equalsIgnoreCase("Not Specified")
                || job.getCompany().equalsIgnoreCase("Unknown Company")) {
            try {
                String domain = new URI(url).getHost();
                job.setCompany(domain.startsWith("www.") ? domain.substring(4) : domain);
            } catch (Exception ignored) {
            }
        }

        job.setLocation(get(jobData, "location", "Remote / Local"));
        job.setDescription(get(jobData, "description", ""));
        job.setSkills(get(jobData, "skills", ""));
        job.setJobType(get(jobData, "jobType", "Full-time"));
        job.setExperienceLevel(get(jobData, "experienceLevel", "0-2 Years"));
        job.setSalary(get(jobData, "salary", "To be discussed"));
        job.setCategory(get(jobData, "category", "Technology"));
        job.setRole(get(jobData, "role", "Developer / Engineer"));
        job.setCompanyType(get(jobData, "companyType", "MNC (Large Enterprise)"));
        job.setResponsibilities(get(jobData, "responsibilities", ""));
        job.setRequirements(get(jobData, "requirements", ""));
        job.setPassoutYear(get(jobData, "passoutYear", ""));
        job.setCompanyLogo(get(jobData, "companyLogo", ""));

        String expiry = get(jobData, "expiryDate", "");
        if (!expiry.isEmpty())
            job.setExpiryDate(expiry);

        return job;
    }

    private String get(JsonNode node, String field, String def) {
        String v = node.path(field).asText(def);
        return (v == null || v.trim().isEmpty()) ? def : v.trim();
    }

    private Job extractWithJsoupFallback(String url, Job job) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .timeout(12000)
                    .followRedirects(true)
                    .get();
            String bodyText = doc.body() != null ? doc.body().text() : "";
            return parseWithHeuristics(job, url, doc, bodyText);
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
        else if (doc.title() != null && !doc.title().isEmpty())
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
