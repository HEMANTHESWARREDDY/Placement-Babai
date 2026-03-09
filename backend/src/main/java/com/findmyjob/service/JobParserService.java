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
import java.util.*;

@Service
public class JobParserService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    // Use latest stable Gemini model
    private static final String GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    public boolean isGeminiConfigured() {
        return geminiApiKey != null && !geminiApiKey.trim().isEmpty();
    }

    // ─── Main entry point ──────────────────────────────────────────────────────

    public Job extractJobFromUrl(String url) {
        Job job = new Job();
        job.setApplyLink(url);

        if (isGeminiConfigured()) {
            try {
                Job result = parseWithGemini(url);
                if (result != null && isValidJob(result)) {
                    System.out.println("[Gemini] SUCCESS: " + result.getTitle());
                    return result;
                }
            } catch (Exception e) {
                System.err.println("[Gemini] FAILED: " + e.getMessage());
            }
        }

        // No Gemini key → basic heuristic fallback
        return jsoupFallback(url, job);
    }

    // ─── Gemini Extraction ─────────────────────────────────────────────────────

    private Job parseWithGemini(String url) throws Exception {

        // Step 1: Collect all available raw data from the page
        String pageContext = scrapePageContext(url);

        // Step 2: Build the prompt with URL + context
        String prompt = buildPrompt(url, pageContext);

        // Step 3: Call Gemini 2.0 Flash with JSON response mode
        String jsonResult = callGemini(prompt);

        // Step 4: Map JSON → Job object
        ObjectMapper mapper = new ObjectMapper();
        return mapToJob(url, mapper.readTree(jsonResult));
    }

    /**
     * Scrapes whatever we can from the page:
     * - Meta tags (og:title, og:description, etc.)
     * - Any visible plain text
     * - Any JSON-LD structured data (<script type="application/ld+json">)
     * Works partially even for SPAs because meta tags are often server-rendered.
     */
    private String scrapePageContext(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .referrer("https://www.google.com")
                    .timeout(12000)
                    .followRedirects(true)
                    .get();

            StringBuilder context = new StringBuilder();

            // Meta tags (often populated even on SPAs)
            String ogTitle = attr(doc, "meta[property=og:title]", "content");
            String ogDesc = attr(doc, "meta[property=og:description]", "content");
            String metaDesc = attr(doc, "meta[name=description]", "content");
            String ogSite = attr(doc, "meta[property=og:site_name]", "content");
            if (!ogTitle.isEmpty())
                context.append("Page Title: ").append(ogTitle).append("\n");
            if (!ogDesc.isEmpty())
                context.append("Meta Description: ").append(ogDesc).append("\n");
            if (!metaDesc.isEmpty())
                context.append("Meta Description2: ").append(metaDesc).append("\n");
            if (!ogSite.isEmpty())
                context.append("Site Name: ").append(ogSite).append("\n");

            // JSON-LD structured data (best source when available)
            doc.select("script[type='application/ld+json']").forEach(s -> {
                String html = s.html().trim();
                if (html.length() > 10)
                    context.append("\nJSON-LD:\n").append(html).append("\n");
            });

            // application/json script blocks (used by some SPAs like Workday)
            doc.select("script[type='application/json']").forEach(s -> {
                String html = s.html().trim();
                if (html.length() > 10)
                    context.append("\nApp JSON:\n").append(html, 0, Math.min(html.length(), 5000)).append("\n");
            });

            // Visible body text (useful for non-SPA sites)
            String bodyText = doc.body() != null ? doc.body().text() : "";
            if (bodyText.length() > 50) {
                context.append("\nPage Body Text:\n")
                        .append(bodyText, 0, Math.min(bodyText.length(), 8000));
            }

            String result = context.toString().trim();
            System.out.println("[Scraper] context length=" + result.length());
            return result;

        } catch (Exception e) {
            System.err.println("[Scraper] failed: " + e.getMessage());
            return "";
        }
    }

    private String attr(Document doc, String selector, String attr) {
        var el = doc.select(selector).first();
        return el != null ? el.attr(attr).trim() : "";
    }

    /**
     * Builds a rich prompt that combines:
     * 1. The URL itself (contains company, title, location hints)
     * 2. Whatever page context we scraped
     * 3. Gemini's own knowledge of the company/role
     */
    private String buildPrompt(String url, String pageContext) {
        // Parse URL slug for title/location hints
        String slug = "";
        try {
            slug = new URI(url).getPath()
                    .replaceAll("[/_]", " ")
                    .replaceAll("-", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
        } catch (Exception ignored) {
        }

        return "You are an expert at extracting job posting details.\n\n" +
                "Job Posting URL: " + url + "\n" +
                "URL content hints: " + slug + "\n\n" +
                (pageContext.isEmpty() ? ""
                        : "=== SCRAPED PAGE DATA ===\n" + pageContext + "\n=== END SCRAPED DATA ===\n\n")
                +
                "Using the URL, scraped data, and your knowledge of this company and role, " +
                "extract the job details and return ONLY a valid JSON object with these exact keys:\n\n" +
                "{\n" +
                "  \"title\": \"exact job title (e.g. Associate - Deals, Data Science)\",\n" +
                "  \"company\": \"company name (e.g. PwC, IBM, not subsidiary/division)\",\n" +
                "  \"location\": \"city, country (e.g. Bangalore, India)\",\n" +
                "  \"description\": \"max 400 char role summary — professional and specific\",\n" +
                "  \"skills\": \"comma-separated skills (e.g. Python, R, SQL, Machine Learning)\",\n" +
                "  \"jobType\": \"Full-time | Full-time (Internship) | Part-time | Contract\",\n" +
                "  \"experienceLevel\": \"e.g. 1 - 3 Years or 0 - 1 Years (Entry Level / Student)\",\n" +
                "  \"salary\": \"e.g. Not Specified (Standard industry competitive pay) or 10 - 20 LPA\",\n" +
                "  \"category\": \"e.g. Data Science | Technology | Software Engineering / IT Operations\",\n" +
                "  \"role\": \"e.g. Data Science / Analytics | Developer / Engineer | Analyst\",\n" +
                "  \"companyType\": \"e.g. MNC (Large Enterprise) | Startup | Product Company\",\n" +
                "  \"responsibilities\": \"5 specific responsibilities, one per line, no bullet symbols\",\n" +
                "  \"requirements\": \"5 specific requirements, one per line, no bullet symbols\",\n" +
                "  \"passoutYear\": \"eligible graduation years e.g. 2021, 2022, 2023\",\n" +
                "  \"expiryDate\": \"application deadline if known, else: Don't know\",\n" +
                "  \"companyLogo\": \"official logo URL if known (e.g. https://logo.clearbit.com/pwc.com) or empty\"\n"
                +
                "}\n\n" +
                "Output ONLY the JSON, nothing else.";
    }

    /**
     * Calls Gemini 2.0 Flash with response_mime_type=application/json for clean,
     * structured output.
     * No tools — just pure JSON generation based on prompt context.
     */
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
        System.out.println("[Gemini] status=" + response.statusCode());

        if (response.statusCode() != 200) {
            String err = response.body().substring(0, Math.min(500, response.body().length()));
            System.err.println("[Gemini] error: " + err);
            throw new RuntimeException("Gemini API error " + response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());
        String text = root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText();

        System.out.println("[Gemini] response preview: " + text.substring(0, Math.min(300, text.length())));
        return text.trim();
    }

    // ─── JSON → Job mapping ────────────────────────────────────────────────────

    private Job mapToJob(String url, JsonNode d) {
        Job job = new Job();
        job.setApplyLink(url);

        job.setTitle(str(d, "title", "Parsed Job"));
        job.setCompany(str(d, "company", "Unknown Company"));

        // Fallback: infer company from domain
        if (isGeneric(job.getCompany())) {
            try {
                String domain = new URI(url).getHost();
                job.setCompany(domain.startsWith("www.") ? domain.substring(4) : domain);
            } catch (Exception ignored) {
            }
        }

        job.setLocation(str(d, "location", "Remote / Local"));
        job.setDescription(str(d, "description", ""));
        job.setSkills(str(d, "skills", ""));
        job.setJobType(str(d, "jobType", "Full-time"));
        job.setExperienceLevel(str(d, "experienceLevel", "0-2 Years"));
        job.setSalary(str(d, "salary", "To be discussed"));
        job.setCategory(str(d, "category", "Technology"));
        job.setRole(str(d, "role", "Developer / Engineer"));
        job.setCompanyType(str(d, "companyType", "MNC (Large Enterprise)"));
        job.setResponsibilities(str(d, "responsibilities", ""));
        job.setRequirements(str(d, "requirements", ""));
        job.setPassoutYear(str(d, "passoutYear", ""));
        job.setCompanyLogo(str(d, "companyLogo", ""));

        String expiry = str(d, "expiryDate", "");
        if (!expiry.isEmpty())
            job.setExpiryDate(expiry);

        return job;
    }

    private String str(JsonNode n, String key, String def) {
        String v = n.path(key).asText(def);
        return (v == null || v.trim().isEmpty()) ? def : v.trim();
    }

    private boolean isGeneric(String s) {
        return s == null || s.equalsIgnoreCase("Not Specified")
                || s.equalsIgnoreCase("Unknown Company")
                || s.equalsIgnoreCase("Unknown");
    }

    private boolean isValidJob(Job j) {
        return j.getTitle() != null
                && !j.getTitle().isEmpty()
                && !j.getTitle().equalsIgnoreCase("Parsed Job");
    }

    // ─── Jsoup heuristic fallback ──────────────────────────────────────────────

    private Job jsoupFallback(String url, Job job) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .followRedirects(true)
                    .get();

            String title = attr(doc, "meta[property=og:title]", "content");
            if (title.isEmpty())
                title = doc.title();
            if (title.contains("|"))
                title = title.split("\\|")[0].trim();
            if (title.contains("-"))
                title = title.split("-")[0].trim();
            job.setTitle(title.isEmpty() ? "Parsed Job" : title);

            String company = attr(doc, "meta[property=og:site_name]", "content");
            if (company.isEmpty()) {
                try {
                    String d = new URI(url).getHost();
                    company = d.startsWith("www.") ? d.substring(4) : d;
                } catch (Exception ignored) {
                }
            }
            job.setCompany(company.isEmpty() ? "Unknown Company" : company);

            String desc = attr(doc, "meta[property=og:description]", "content");
            if (desc.isEmpty())
                desc = attr(doc, "meta[name=description]", "content");
            job.setDescription(desc.length() > 500 ? desc.substring(0, 497) + "..." : desc);

            job.setLocation("Remote / Local");
            job.setJobType("Full-time");
            job.setExperienceLevel("0-2 Years");
            job.setSalary("To be discussed");
            job.setCompanyType("Corporate");
            job.setCategory("Technology");
            job.setRole("Developer / Engineer");

        } catch (Exception e) {
            job.setTitle("Unable to automatically extract details");
            job.setCompany("Unknown");
        }
        return job;
    }
}
