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

        try {
            // Fetch page as a browser would
            Document doc = Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.5")
                    .timeout(12000)
                    .followRedirects(true)
                    .get();

            // 1. Get visible body text
            String bodyText = doc.body() != null ? doc.body().text() : "";

            // 2. Extract ALL script tag contents (includes JSON data in SPAs like
            // brassring/Angular)
            StringBuilder scriptContent = new StringBuilder();
            doc.select("script").forEach(script -> {
                String content = script.html();
                // Only include scripts that look like they have job data (not pure JS logic)
                if (content != null && content.length() > 50 &&
                        (content.contains("jobTitle") || content.contains("job_title") ||
                                content.contains("positionTitle") || content.contains("ReqTitle") ||
                                content.contains("JobTitle") || content.contains("title") ||
                                content.contains("company") || content.contains("description") ||
                                content.contains("location") || content.contains("salary") ||
                                content.contains("\"@type\"") // JSON-LD structured data
                )) {
                    scriptContent.append(content).append("\n\n");
                }
            });

            // 3. Also grab JSON-LD structured data specifically
            StringBuilder jsonLd = new StringBuilder();
            doc.select("script[type='application/ld+json']").forEach(s -> {
                jsonLd.append(s.html()).append("\n");
            });
            doc.select("script[type='application/json']").forEach(s -> {
                jsonLd.append(s.html()).append("\n");
            });

            // 4. Combine everything — prioritize JSON data over generic visible body text
            String combinedContent = "";
            if (jsonLd.length() > 0) {
                combinedContent = "=== STRUCTURED JSON DATA ===\n" + jsonLd + "\n\n";
            }
            if (scriptContent.length() > 0) {
                combinedContent += "=== SCRIPT/APP DATA ===\n" + scriptContent + "\n\n";
            }
            combinedContent += "=== VISIBLE PAGE TEXT ===\n" + bodyText;

            // Limit total content size
            if (combinedContent.length() > 100000) {
                combinedContent = combinedContent.substring(0, 100000);
            }

            System.out.println("== Extracted content length: " + combinedContent.length() +
                    " (JSON-LD: " + jsonLd.length() + ", Scripts: " + scriptContent.length() +
                    ", Body: " + bodyText.length() + ")");

            // If Gemini API Key is provided, use AI to parse!
            if (isGeminiConfigured()) {
                try {
                    Job geminiResult = parseWithGemini(url, combinedContent, doc.title());
                    // Validate Gemini didn't just hallucinate generic content
                    if (geminiResult.getTitle() != null &&
                            !geminiResult.getTitle().equalsIgnoreCase("Parsed Job") &&
                            !geminiResult.getTitle().isEmpty()) {
                        System.out.println("== Gemini successfully extracted: " + geminiResult.getTitle());
                        return geminiResult;
                    } else {
                        System.err.println("== Gemini returned generic/empty data, falling back to heuristics");
                    }
                } catch (Exception e) {
                    System.err.println("== Gemini parsing failed: " + e.getMessage());
                }
            } else {
                System.out.println("== Gemini key not configured, using heuristic extraction");
            }

            // Fallback: Heuristic Parsing
            return parseWithHeuristics(job, url, doc, bodyText);

        } catch (Exception e) {
            System.err.println("Failed to scrape URL: " + url + " - " + e.getMessage());
            job.setTitle("Unable to automatically extract details");
            job.setCompany("Unknown");
        }

        return job;
    }

    private Job parseWithGemini(String url, String pageText, String metaTitle) throws Exception {
        String prompt = "You are an expert ATS and Job Data Extractor. " +
                "Extract job details from the provided webpage text into a valid JSON object. " +
                "The JSON must have EXACTLY these keys (use placeholders like 'Don\\'t know' or 'Not Specified' if missing or use the exact requested format below):\n"
                +
                "- title (e.g., Intern - Associate Systems Management Specialist)\n" +
                "- company (e.g., IBM)\n" +
                "- location (e.g., Bangalore, India)\n" +
                "- description (max 400 chars summary, detailed and professional)\n" +
                "- skills (comma separated e.g. Linux, Windows Server, Networking...)\n" +
                "- jobType (e.g., Full-time (Internship), Part-time, Full-time)\n" +
                "- experienceLevel (e.g., 0 - 1 Years (Entry Level / Student) or 3 - 7 Years)\n" +
                "- salary (e.g., Not Specified (Standard industry internship stipend) or 10 - 20 LPA)\n" +
                "- category (e.g., Software Engineering / IT Operations, Technology)\n" +
                "- role (e.g., Developer / Engineer)\n" +
                "- companyType (e.g., MNC (Large Enterprise), Startup)\n" +
                "- responsibilities (bullet points WITHOUT bullets, one per line, max 5 lines)\n" +
                "- requirements (bullet points WITHOUT bullets, one per line, max 5 lines)\n" +
                "- passoutYear (e.g., 2024, 2025)\n" +
                "- expiryDate (e.g., Don't know)\n\n" +
                "Here is the page title: " + metaTitle + "\n\n" +
                "Here is the raw HTML data containing the job details (could be inside javascript JSON or HTML tags):\n"
                + pageText;

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        content.put("parts", new Object[] { part });
        requestBody.put("contents", new Object[] { content });

        // Ensure Gemini returns JSON
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("response_mime_type", "application/json");
        requestBody.put("generationConfig", generationConfig);

        ObjectMapper mapper = new ObjectMapper();
        String jsonBody = mapper.writeValueAsString(requestBody);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
                                + geminiApiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode rootNode = mapper.readTree(response.body());
            String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text")
                    .asText();

            // Clean markdown JSON formatting if Gemini wraps it
            if (responseText.startsWith("```json")) {
                responseText = responseText.substring(7, responseText.length() - 3).trim();
            } else if (responseText.startsWith("```")) {
                responseText = responseText.substring(3, responseText.length() - 3).trim();
            }

            JsonNode jobData = mapper.readTree(responseText);

            Job job = new Job();
            job.setApplyLink(url);
            job.setTitle(jobData.path("title").asText("Parsed Job"));
            job.setCompany(jobData.path("company").asText("Unknown Company"));

            // Clean company name from URL if AI failed
            if (job.getCompany().equalsIgnoreCase("Not Specified")
                    || job.getCompany().equalsIgnoreCase("Unknown Company")) {
                try {
                    String domain = new java.net.URI(url).getHost();
                    job.setCompany(domain.startsWith("www.") ? domain.substring(4) : domain);
                } catch (Exception ignored) {
                }
            }

            job.setLocation(jobData.path("location").asText("Remote/Local"));
            job.setDescription(jobData.path("description").asText(""));
            job.setSkills(jobData.path("skills").asText(""));
            job.setJobType(jobData.path("jobType").asText("Full-time"));
            job.setExperienceLevel(jobData.path("experienceLevel").asText("0-2 Years"));
            job.setSalary(jobData.path("salary").asText("To be discussed"));
            job.setCategory(jobData.path("category").asText("Technology"));
            job.setRole(jobData.path("role").asText("Developer/Engineer"));
            job.setCompanyType(jobData.path("companyType").asText("Corporate"));
            job.setResponsibilities(jobData.path("responsibilities").asText(""));
            job.setRequirements(jobData.path("requirements").asText(""));
            job.setPassoutYear(jobData.path("passoutYear").asText(""));

            // expiryDate is a String field in the model (e.g. "Don't know" or "2026-03-31")
            String expiryText = jobData.path("expiryDate").asText("");
            if (expiryText != null && !expiryText.isEmpty()) {
                job.setExpiryDate(expiryText);
            }

            return job;
        } else {
            throw new RuntimeException("Gemini API Error: " + response.statusCode() + " " + response.body());
        }
    }

    private Job parseWithHeuristics(Job job, String url, Document doc, String pageText) {
        // 1. Try to extract Title
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

        // 2. Try to extract Company
        String company = "";
        if (doc.select("meta[property=og:site_name]").first() != null) {
            company = doc.select("meta[property=og:site_name]").first().attr("content");
        } else if (url.contains("linkedin.com")) {
            company = "LinkedIn (Parsed)";
        } else if (url.contains("internshala.com")) {
            company = "Internshala (Parsed)";
        } else {
            try {
                String domain = new java.net.URI(url).getHost();
                company = domain.startsWith("www.") ? domain.substring(4) : domain;
            } catch (Exception e) {
            }
        }
        job.setCompany(company.isEmpty() ? "Unknown Company" : company);

        // 3. Try to extract Description
        String description = "";
        if (doc.select("meta[property=og:description]").first() != null) {
            description = doc.select("meta[property=og:description]").first().attr("content");
        } else if (doc.select("meta[name=description]").first() != null) {
            description = doc.select("meta[name=description]").first().attr("content");
        }
        job.setDescription(description.length() > 500 ? description.substring(0, 497) + "..." : description);

        // Default some fields just to be safe
        job.setLocation("Remote / Local");
        job.setJobType("Full-time");
        job.setExperienceLevel("0-2 Years");
        job.setSalary("To be discussed");
        job.setCompanyType("Corporate");
        job.setCategory("Technology");
        job.setRole("Developer / Engineer");

        // SMART GUESSES
        pageText = pageText.toLowerCase();
        if (pageText.contains("part-time") || pageText.contains("part time")) {
            job.setJobType("Part-time");
        } else if (pageText.contains("internship") || pageText.contains("intern")) {
            job.setJobType("Internship");
        }

        if (pageText.contains("bengaluru") || pageText.contains("bangalore"))
            job.setLocation("Bangalore, India");
        else if (pageText.contains("hyderabad"))
            job.setLocation("Hyderabad, India");
        else if (pageText.contains("pune"))
            job.setLocation("Pune, India");
        else if (pageText.contains("remote"))
            job.setLocation("Remote");

        if (pageText.contains("python") && pageText.contains("java"))
            job.setSkills("Java, Python");
        else if (pageText.contains("react") && pageText.contains("node"))
            job.setSkills("React, Node.js");
        else if (pageText.contains("sales") || pageText.contains("marketing")) {
            job.setCategory("Marketing");
            job.setRole("Specialist");
        }

        return job;
    }
}
