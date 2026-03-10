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
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

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

    public Map<String, Object> calculateAtsScore(Long jobId, MultipartFile file) throws Exception {
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
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="
                + geminiApiKey.trim();

        String prompt = "You are an expert ATS (Applicant Tracking System). Analyze the following resume against the job details.\n"
                +
                "Job Title: " + job.getTitle() + "\n" +
                "Requirements: " + job.getRequirements() + "\n" +
                "Skills: " + job.getSkills() + "\n\n" +
                "Resume Text:\n" + resumeText + "\n\n" +
                "Provide strictly a JSON object with exactly two keys:\n" +
                "1. 'score': integer from 0 to 100 representing match.\n" +
                "2. 'message': a brief string providing the top 1-2 constructive suggestions for the candidate.\n" +
                "Do not use markdown backticks. Only output valid JSON.";

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", prompt);
        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", new Object[] { parts });
        requestBody.put("contents", new Object[] { contents });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String rawResponse = restTemplate.postForObject(url, entity, String.class);

        // Parse the rawResponse from Gemini
        JsonNode root = objectMapper.readTree(rawResponse);
        String textResponse = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

        // Clean markdown backticks if Gemini includes them
        textResponse = textResponse.replaceAll("```json", "").replaceAll("```", "").trim();

        JsonNode resultNode = objectMapper.readTree(textResponse);

        Map<String, Object> result = new HashMap<>();
        result.put("score", resultNode.has("score") ? resultNode.get("score").asInt() : 50);
        result.put("message", resultNode.has("message") ? resultNode.get("message").asText() : "Analysis complete.");
        return result;
    }

    private Map<String, Object> basicCalculate(Job job, String resumeTextLower) {
        Set<String> keywords = new HashSet<>();

        if (job.getSkills() != null) {
            Arrays.stream(job.getSkills().split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .forEach(keywords::add);
        }

        int score = 50;
        if (!keywords.isEmpty()) {
            int matchCount = 0;
            for (String keyword : keywords) {
                if (resumeTextLower.contains(keyword)) {
                    matchCount++;
                }
            }
            double percentage = ((double) matchCount / keywords.size()) * 100;
            score = (int) Math.min(99, 40 + (percentage * 0.6));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("score", score);

        String message;
        if (score >= 80)
            message = "Excellent Match! Your profile closely aligns with this role.";
        else if (score >= 60)
            message = "Good Match! You meet a solid amount of the requirements.";
        else if (score >= 40)
            message = "Fair Match! Consider highlighting relevant skills if you have them.";
        else
            message = "Low Match! This role might require different experience or skills.";

        result.put("message", message);
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
        return ""; // Fallback
    }
}
