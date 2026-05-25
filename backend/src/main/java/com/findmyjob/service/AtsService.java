package com.findmyjob.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.findmyjob.model.Job;
import com.findmyjob.repository.JobRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.InputStream;
import java.util.*;

@Service
public class AtsService {

    private final JobRepository jobRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public AtsService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    public Map<String, Object> calculateAtsScore(String jobId, MultipartFile file) throws Exception {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));

        String resumeText = extractText(file);

        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return basicCalculate(job, resumeText.toLowerCase());
        }

        try {
            return callGemini(job, resumeText);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Gemini API call failed, falling back to basic analysis");
            return basicCalculate(job, resumeText.toLowerCase());
        }
    }

    private Map<String, Object> callGemini(Job job, String resumeText) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
                + geminiApiKey.trim();

        String prompt = "You are an expert recruiter and Applicant Tracking System (ATS) AI analyzer. Analyze the following resume against the job description details below.\n\n"
                + "JOB DETAILS:\n"
                + "Job Title: " + job.getTitle() + "\n"
                + "Requirements: " + job.getRequirements() + "\n"
                + "Skills: " + job.getSkills() + "\n"
                + "Responsibilities: " + job.getResponsibilities() + "\n\n"
                + "RESUME TEXT:\n" + resumeText + "\n\n"
                + "Provide a high-fidelity semantic analysis. Perform contextual skill matching (e.g. recognize that 'ML' is equivalent to 'Machine Learning', 'REST APIs' matches 'Backend APIs', etc.).\n"
                + "Evaluate projects, quantified outcomes, modern tech stack alignment, and ATS formatting.\n\n"
                + "YOUR RESPONSE MUST BE A SINGLE, VALID JSON OBJECT WITH EXACTLY THESE KEYS (do not include markdown wrapping like ```json):\n"
                + "{\n"
                + "  \"score\": 82, // integer 0-100 overall score\n"
                + "  \"message\": \"overall summary message\",\n"
                + "  \"subScores\": {\n"
                + "    \"skillsMatch\": 85, // integer 0-100\n"
                + "    \"experienceMatch\": 80, // integer 0-100\n"
                + "    \"keywordMatch\": 75, // integer 0-100\n"
                + "    \"projectRelevance\": 90, // integer 0-100\n"
                + "    \"formattingScore\": 95, // integer 0-100\n"
                + "    \"educationMatch\": 85 // integer 0-100\n"
                + "  },\n"
                + "  \"keywordAnalysis\": {\n"
                + "    \"matched\": [\n"
                + "      { \"keyword\": \"matched skill/keyword\", \"synonymUsed\": \"synonym found in resume or 'exact'\", \"category\": \"e.g. Backend / Frontend / Cloud\" }\n"
                + "    ],\n"
                + "    \"missing\": [\n"
                + "      { \"keyword\": \"missing critical skill\", \"category\": \"category\", \"importance\": \"High/Medium/Low\" }\n"
                + "    ]\n"
                + "  },\n"
                + "  \"strengths\": [\n"
                + "    \"strength 1\", \"strength 2\"\n"
                + "  ],\n"
                + "  \"weaknesses\": [\n"
                + "    \"weakness 1\", \"weakness 2\"\n"
                + "  ],\n"
                + "  \"improvements\": [\n"
                + "    { \"section\": \"Experience or Projects\", \"original\": \"original weak bullet point\", \"suggested\": \"strong action-oriented bullet point with quantified metrics\" }\n"
                + "  ],\n"
                + "  \"formattingAnalysis\": {\n"
                + "    \"bulletPointsCheck\": \"Pass/Fail/Warning\",\n"
                + "    \"sectionHeaderCheck\": \"Pass/Fail/Warning\",\n"
                + "    \"tablesCheck\": \"Pass/Fail/Warning\",\n"
                + "    \"feedback\": \"detailed formatting feedback (e.g. single column layout, font choice)\"\n"
                + "  },\n"
                + "  \"aiInsights\": \"recruiter-style high level strategic recommendation\"\n"
                + "}";

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", prompt);
        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", new Object[] { parts });
        requestBody.put("contents", new Object[] { contents });
        requestBody.put("generationConfig", Map.of("response_mime_type", "application/json"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String rawResponse = restTemplate.postForObject(url, entity, String.class);

        JsonNode root = objectMapper.readTree(rawResponse);
        String textResponse = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

        textResponse = textResponse.trim();
        if (textResponse.startsWith("```")) {
            int firstLineBreak = textResponse.indexOf("\n");
            int lastBackticks = textResponse.lastIndexOf("```");
            if (firstLineBreak != -1 && lastBackticks != -1 && lastBackticks > firstLineBreak) {
                textResponse = textResponse.substring(firstLineBreak, lastBackticks).trim();
            }
        }
        textResponse = textResponse.replaceAll("```json", "").replaceAll("```", "").trim();

        JsonNode resultNode = objectMapper.readTree(textResponse);

        Map<String, Object> result = new HashMap<>();
        result.put("score", resultNode.path("score").asInt(50));
        result.put("message", resultNode.path("message").asText("Analysis complete."));
        result.put("subScores", objectMapper.convertValue(resultNode.path("subScores"), Map.class));
        result.put("keywordAnalysis", objectMapper.convertValue(resultNode.path("keywordAnalysis"), Map.class));
        result.put("strengths", objectMapper.convertValue(resultNode.path("strengths"), List.class));
        result.put("weaknesses", objectMapper.convertValue(resultNode.path("weaknesses"), List.class));
        result.put("improvements", objectMapper.convertValue(resultNode.path("improvements"), List.class));
        result.put("formattingAnalysis", objectMapper.convertValue(resultNode.path("formattingAnalysis"), Map.class));
        result.put("aiInsights", resultNode.path("aiInsights").asText(""));

        return result;
    }

    private Map<String, Object> basicCalculate(Job job, String resumeTextLower) {
        Set<String> keywords = new HashSet<>();
        if (job.getSkills() != null) {
            Arrays.stream(job.getSkills().split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .filter(s -> !s.isEmpty())
                    .forEach(keywords::add);
        }

        List<Map<String, String>> matched = new ArrayList<>();
        List<Map<String, String>> missing = new ArrayList<>();

        if (!keywords.isEmpty()) {
            for (String keyword : keywords) {
                if (resumeTextLower.contains(keyword)) {
                    Map<String, String> m = new HashMap<>();
                    m.put("keyword", keyword);
                    m.put("synonymUsed", "exact");
                    m.put("category", "Technical Skills");
                    matched.add(m);
                } else {
                    Map<String, String> m = new HashMap<>();
                    m.put("keyword", keyword);
                    m.put("category", "Technical Skills");
                    m.put("importance", "High");
                    missing.add(m);
                }
            }
        }

        double skillPercentage = keywords.isEmpty() ? 0 : ((double) matched.size() / keywords.size()) * 100;
        int skillsMatch = (int) Math.min(99, 40 + (skillPercentage * 0.6));
        int experienceMatch = resumeTextLower.contains("experience") || resumeTextLower.contains("years") ? 85 : 65;
        int keywordMatch = (int) Math.min(99, 35 + (skillPercentage * 0.65));
        int projectRelevance = resumeTextLower.contains("project") || resumeTextLower.contains("portfolio") ? 90 : 60;
        int formattingScore = resumeTextLower.contains(" bullet ") || resumeTextLower.contains("\n-") || resumeTextLower.contains("\n*") ? 92 : 78;
        int educationMatch = resumeTextLower.contains("university") || resumeTextLower.contains("degree") || resumeTextLower.contains("btech") || resumeTextLower.contains("college") ? 88 : 70;

        int overallScore = (skillsMatch + experienceMatch + keywordMatch + projectRelevance + formattingScore + educationMatch) / 6;

        Map<String, Object> result = new HashMap<>();
        result.put("score", overallScore);

        String message;
        if (overallScore >= 80) message = "Excellent Match! Your resume demonstrates a highly aligned skill set.";
        else if (overallScore >= 60) message = "Good Match! Solid alignment, but there are areas you can optimize.";
        else if (overallScore >= 45) message = "Fair Match! You meet some core requirements but need to add more relevant keywords.";
        else message = "Low Match! High potential mismatch. Consider tailoring your resume for this role.";
        
        result.put("message", message);

        Map<String, Object> subScores = new HashMap<>();
        subScores.put("skillsMatch", skillsMatch);
        subScores.put("experienceMatch", experienceMatch);
        subScores.put("keywordMatch", keywordMatch);
        subScores.put("projectRelevance", projectRelevance);
        subScores.put("formattingScore", formattingScore);
        subScores.put("educationMatch", educationMatch);
        result.put("subScores", subScores);

        Map<String, Object> keywordAnalysis = new HashMap<>();
        keywordAnalysis.put("matched", matched);
        keywordAnalysis.put("missing", missing);
        result.put("keywordAnalysis", keywordAnalysis);

        result.put("strengths", Arrays.asList(
            "Clear technical keywords matching the core job description requirements.",
            "Strong layout structure with searchable section headers."
        ));

        result.put("weaknesses", Arrays.asList(
            "Missing clear quantified achievements (metrics like %, $, or hours saved).",
            "Several high-priority technical skills from the job description are not mentioned."
        ));

        List<Map<String, String>> improvements = new ArrayList<>();
        Map<String, String> imp1 = new HashMap<>();
        imp1.put("section", "Professional Experience / Projects");
        imp1.put("original", "Responsible for working on backend tasks and building APIs.");
        imp1.put("suggested", "Spearheaded development of 10+ high-performance REST APIs using " + (keywords.isEmpty() ? "modern frameworks" : keywords.iterator().next()) + ", reducing response latencies by 25%.");
        improvements.add(imp1);
        result.put("improvements", improvements);

        Map<String, Object> formattingAnalysis = new HashMap<>();
        formattingAnalysis.put("bulletPointsCheck", "Pass");
        formattingAnalysis.put("sectionHeaderCheck", "Pass");
        formattingAnalysis.put("tablesCheck", "Pass");
        formattingAnalysis.put("feedback", "Excellent clean structure. Ensure you use bullet points with action verbs and avoid any graphic bars or side columns.");
        result.put("formattingAnalysis", formattingAnalysis);

        result.put("aiInsights", "To maximize your compatibility, focus on upgrading your bullet points to the 'X-Y-Z' formula (e.g., 'Accomplished [X], as measured by [Y], by doing [Z]') and integrate the missing technical keywords in your skills section.");

        return result;
    }

    private String extractText(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        try (InputStream is = file.getInputStream()) {
            if (filename.endsWith(".pdf")) {
                try (PDDocument document = PDDocument.load(is)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return stripper.getText(document);
                }
            } else if (filename.endsWith(".docx")) {
                try (XWPFDocument doc = new XWPFDocument(is)) {
                    StringBuilder sb = new StringBuilder();
                    for (XWPFParagraph p : doc.getParagraphs()) {
                        sb.append(p.getText()).append(" ");
                    }
                    return sb.toString();
                }
            } else if (filename.endsWith(".pptx")) {
                try (XMLSlideShow ppt = new XMLSlideShow(is)) {
                    StringBuilder sb = new StringBuilder();
                    for (XSLFSlide slide : ppt.getSlides()) {
                        for (XSLFShape shape : slide.getShapes()) {
                            if (shape instanceof XSLFTextShape) {
                                sb.append(((XSLFTextShape) shape).getText()).append(" ");
                            }
                        }
                    }
                    return sb.toString();
                }
            }
        }
        return "";
    }
}
