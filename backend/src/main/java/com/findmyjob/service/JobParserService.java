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

    public Job extractJobFromUrl(String url) {
        Job job = new Job();
        job.setApplyLink(url);

        try {
            // Default timeout and pretend we are a browser to bypass basic bot protection
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            String pageText = doc.body() != null ? doc.body().text() : "";
            String rawHtml = doc.outerHtml();

            // Limit raw HTML size to avoid completely massive prompts, 90k chars is well
            // within Gemini 2.0 Flash context
            if (rawHtml.length() > 90000) {
                rawHtml = rawHtml.substring(0, 90000);
            }

            // If Gemini API Key is provided, use the power of AI to parse the job!
            if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
                try {
                    return parseWithGemini(url, rawHtml, doc.title());
                } catch (Exception e) {
                    System.err.println("Gemini parsing failed, falling back to heuristics: " + e.getMessage());
                }
            }

            // Fallback: Heuristic Parsing (Existing logic)
            return parseWithHeuristics(job, url, doc, pageText);

        } catch (Exception e) {
            // Failed to parse, probably blocked or invalid URL. Return what we safely
            // initialized.
            System.err.println("Failed to scrape URL: " + url + " - " + e.getMessage());
            job.setTitle("Unable to automatically extract details");
            job.setCompany("Unknown");
        }

        return job;
    }

    private Job parseWithGemini(String url, String pageText, String metaTitle) throws Exception {
        String prompt = "You are an expert ATS and Job Data Extractor. " +
                "Extract job details from the provided webpage text into a valid JSON object. " +
                "The JSON must have EXACTLY these keys (use placeholders like 'Not Specified' if missing): " +
                "'title', 'company', 'location', 'description' (max 400 chars summary), 'skills' (comma separated), " +
                "'jobType' (Full-time, Part-time, Internship, etc.), 'experienceLevel' (e.g. 0-2 Years), " +
                "'salary', 'category', 'role', 'companyType', 'responsibilities' (one per line, max 5 lines), 'requirements' (one per line, max 5 lines).\n\n"
                +
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
