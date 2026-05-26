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

        String prompt = "You are a world-class expert ATS (Applicant Tracking System) recruiter and technical resume parser. "
                + "Your job is to provide an extremely strict, rigorous, and highly realistic semantic analysis comparing the user's resume against the Job Description (JD).\n\n"
                + "JOB DETAILS:\n"
                + "Job Title: " + job.getTitle() + "\n"
                + "Requirements: " + job.getRequirements() + "\n"
                + "Skills: " + job.getSkills() + "\n"
                + "Responsibilities: " + job.getResponsibilities() + "\n\n"
                + "RESUME TEXT:\n" + resumeText + "\n\n"
                + "STRICT CRITERIA & RULES:\n"
                + "1. DETECT GIBBERISH/JUNK/FAKE DETAILS: Analyze the JD Title, Requirements, and Responsibilities. If any of these fields contain gibberish (e.g., non-dictionary scrambled letters, junk words like 'hjLHA', 'ge.ng.eng', 'wgl;ejg', random letters, or look fake/nonsensical), you MUST evaluate this as a COMPLETE CONTENT MISMATCH. Immediately drop the overall score to between 5 and 15, drop all subscores except formatting to below 10, set matched keywords to empty, and output an explicit alert/warning in 'aiInsights' and 'message' declaring that the Job Description is invalid or fake.\n"
                + "2. RIGOROUS SEMANTIC COMPARISON: Do not just count static skill matches. Genuinely read the resume's projects, experience bullet points, and achievements, and evaluate if they semantically match the actual job responsibilities. If the resume projects (e.g. deep learning / speech grading) are completely unrelated to the job requirements, 'projectRelevance' and 'experienceMatch' must be scored extremely low (below 15).\n"
                + "3. REALISTIC SCORING: Be highly critical. Do not inflate scores. Most candidates fail ATS screening. If a candidate has a weak match, score them realistically (40-60). Only candidates with perfect alignment should score 80+. If there is a complete mismatch, the score MUST be below 20.\n"
                + "4. QUANTIFIABLE IMPROVEMENTS: For the 'improvements' array, provide top-tier, highly tailored 'Before' and 'After' resume bullet points from the user's actual projects or experience. Rewrite them using the standard STAR / Google 'X-Y-Z' formula (e.g. 'Accomplished [X], as measured by [Y], by doing [Z]') using realistic tech terms matching the JD (if the JD is valid).\n"
                + "5. FORMATTING AUDIT: Inspect the formatting based on the resume text layout. Verify if section headers are standard, if bullet points are used correctly, and if there are formatting red flags (like graphics, tables, columns, non-parsable characters).\n\n"
                + "YOUR RESPONSE MUST BE A SINGLE, VALID JSON OBJECT WITH EXACTLY THESE KEYS (do not include markdown wrapping like ```json):\n"
                + "{\n"
                + "  \"score\": 12, // integer 0-100 overall match score\n"
                + "  \"message\": \"overall match status summary. If fake/garbage JD is detected, state: 'Complete mismatch: Job description contains invalid/garbage requirements.'\",\n"
                + "  \"subScores\": {\n"
                + "    \"skillsMatch\": 8, // integer 0-100\n"
                + "    \"experienceMatch\": 5, // integer 0-100\n"
                + "    \"keywordMatch\": 10, // integer 0-100\n"
                + "    \"projectRelevance\": 5, // integer 0-100\n"
                + "    \"formattingScore\": 70, // integer 0-100\n"
                + "    \"educationMatch\": 5 // integer 0-100\n"
                + "  },\n"
                + "  \"keywordAnalysis\": {\n"
                + "    \"matched\": [\n"
                + "      { \"keyword\": \"matched skill\", \"synonymUsed\": \"exact / synonym\", \"category\": \"Technical\" }\n"
                + "    ],\n"
                + "    \"missing\": [\n"
                + "      { \"keyword\": \"missing critical skill\", \"category\": \"Technical\", \"importance\": \"High\" }\n"
                + "    ]\n"
                + "  },\n"
                + "  \"strengths\": [\n"
                + "    \"strength 1\", \"strength 2\"\n"
                + "  ],\n"
                + "  \"weaknesses\": [\n"
                + "    \"weakness 1\", \"weakness 2\"\n"
                + "  ],\n"
                + "  \"improvements\": [\n"
                + "    { \"section\": \"Projects / Experience\", \"original\": \"original weak bullet point from the resume\", \"suggested\": \"rewritten bullet point using the Google X-Y-Z formula with high impact\" }\n"
                + "  ],\n"
                + "  \"formattingAnalysis\": {\n"
                + "    \"bulletPointsCheck\": \"Pass/Fail/Warning\",\n"
                + "    \"sectionHeaderCheck\": \"Pass/Fail/Warning\",\n"
                + "    \"tablesCheck\": \"Pass/Fail/Warning\",\n"
                + "    \"feedback\": \"detailed formatting audit feedback\"\n"
                + "  },\n"
                + "  \"aiInsights\": \"recruiter-style deep strategic advice or warning about fake/invalid JD\"\n"
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

    private static final Set<String> STOP_WORDS = Set.of(
        "the", "and", "for", "with", "you", "are", "our", "will", "this", "that",
        "have", "from", "your", "their", "about", "role", "description", "required",
        "skills", "responsibilities", "requirements", "job", "work",
        "a", "an", "of", "to", "in", "is", "at", "by", "on", "as", "or", "but", "not",
        "so", "be", "been", "was", "were", "has", "had", "do", "does", "did", "can",
        "could", "should", "would", "must", "may", "might", "shall", "into", "onto",
        "upon", "each", "every", "some", "any", "no", "only", "own", "same"
    );

    private Set<String> extractCleanKeywords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return Collections.emptySet();
        }
        Set<String> keywords = new HashSet<>();
        String[] words = text.toLowerCase().split("[\\s\\p{Punct}]+");
        for (String w : words) {
            String clean = w.trim();
            if (clean.length() > 2 && !STOP_WORDS.contains(clean) && clean.matches("[a-z0-9]+")) {
                keywords.add(clean);
            }
        }
        return keywords;
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", " ");
    }

    private Map<String, Object> basicCalculate(Job job, String resumeTextLower) {
        Set<String> skillsKeywords = new HashSet<>();
        if (job.getSkills() != null) {
            Arrays.stream(job.getSkills().split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .filter(s -> !s.isEmpty())
                    .forEach(skillsKeywords::add);
        }

        // Extract descriptive keywords from Description, Requirements, Responsibilities, and Title
        Set<String> descKeywords = new HashSet<>();
        descKeywords.addAll(extractCleanKeywords(stripHtml(job.getDescription())));
        descKeywords.addAll(extractCleanKeywords(stripHtml(job.getRequirements())));
        descKeywords.addAll(extractCleanKeywords(stripHtml(job.getResponsibilities())));

        Set<String> titleKeywords = extractCleanKeywords(stripHtml(job.getTitle()));

        List<Map<String, String>> matched = new ArrayList<>();
        List<Map<String, String>> missing = new ArrayList<>();

        int matchedSkills = 0;
        for (String skill : skillsKeywords) {
            if (resumeTextLower.contains(skill)) {
                matchedSkills++;
                Map<String, String> m = new HashMap<>();
                m.put("keyword", skill);
                m.put("synonymUsed", "exact");
                m.put("category", "Required Skills");
                matched.add(m);
            } else {
                Map<String, String> m = new HashMap<>();
                m.put("keyword", skill);
                m.put("category", "Required Skills");
                m.put("importance", "High");
                missing.add(m);
            }
        }

        int matchedDesc = 0;
        for (String word : descKeywords) {
            if (resumeTextLower.contains(word)) {
                matchedDesc++;
            }
        }

        int matchedTitle = 0;
        for (String word : titleKeywords) {
            if (resumeTextLower.contains(word)) {
                matchedTitle++;
            }
        }

        double skillPercentage = skillsKeywords.isEmpty() ? 0 : ((double) matchedSkills / skillsKeywords.size());
        double descPercentage = descKeywords.isEmpty() ? 0 : ((double) matchedDesc / descKeywords.size());
        double titlePercentage = titleKeywords.isEmpty() ? 0 : ((double) matchedTitle / titleKeywords.size());

        // Alignment penalty if JD has descriptions but none match the resume (indicates fake or completely mismatched JD)
        double alignmentFactor = 1.0;
        if (!descKeywords.isEmpty() && matchedDesc == 0) {
            alignmentFactor = 0.08;
        }

        // Calculate subscores, heavily scaled by the alignment factor
        int skillsMatch = (int) ((skillsKeywords.isEmpty() ? 30 : (30 + (skillPercentage * 69))) * alignmentFactor);
        if (skillsMatch < 5) skillsMatch = 5;

        int experienceMatch = (int) (((resumeTextLower.contains("experience") || resumeTextLower.contains("years")) ? 85 : 55) * alignmentFactor);
        if (experienceMatch < 5) experienceMatch = 5;

        int keywordMatch = (int) ((30 + (((skillPercentage * 0.4) + (descPercentage * 0.5) + (titlePercentage * 0.1)) * 69)) * alignmentFactor);
        if (keywordMatch < 5) keywordMatch = 5;

        int projectRelevance = (int) (((resumeTextLower.contains("project") || resumeTextLower.contains("portfolio")) ? 80 : 45) * alignmentFactor);
        if (projectRelevance < 5) projectRelevance = 5;

        int formattingScore = (resumeTextLower.contains(" bullet ") || resumeTextLower.contains("\n-") || resumeTextLower.contains("\n*")) ? 90 : 70;
        if (alignmentFactor < 0.2) {
            formattingScore = (int) (formattingScore * 0.65);
        }

        int educationMatch = (int) (((resumeTextLower.contains("university") || resumeTextLower.contains("degree") || resumeTextLower.contains("btech") || resumeTextLower.contains("college")) ? 85 : 55) * alignmentFactor);
        if (educationMatch < 5) educationMatch = 5;

        int overallScore = (skillsMatch + experienceMatch + keywordMatch + projectRelevance + formattingScore + educationMatch) / 6;

        Map<String, Object> result = new HashMap<>();
        result.put("score", overallScore);

        String message;
        if (overallScore >= 80) {
            message = "Excellent Match! Your resume demonstrates a highly aligned skill set.";
        } else if (overallScore >= 60) {
            message = "Good Match! Solid alignment, but there are areas you can optimize.";
        } else if (overallScore >= 40) {
            message = "Fair Match! You meet some core requirements but need to add more relevant keywords.";
        } else if (alignmentFactor < 0.2) {
            message = "Extremely Low Match! The job requirements and responsibilities do not align with your resume at all (unrecognized content).";
        } else {
            message = "Low Match! High potential mismatch. Consider tailoring your resume for this role.";
        }
        
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

        if (alignmentFactor < 0.2) {
            result.put("strengths", Arrays.asList(
                "Resume uses basic clean structural formatting.",
                "Primary contact information and section titles are legible."
            ));

            result.put("weaknesses", Arrays.asList(
                "Critical mismatch: Job description keywords are completely absent from your resume.",
                "Zero contextual overlap between your work experience and the target role's core responsibilities."
            ));
        } else {
            result.put("strengths", Arrays.asList(
                "Clear technical keywords matching the core job description requirements.",
                "Strong layout structure with searchable section headers."
            ));

            result.put("weaknesses", Arrays.asList(
                "Missing clear quantified achievements (metrics like %, $, or hours saved).",
                "Several high-priority technical skills from the job description are not mentioned."
            ));
        }

        List<Map<String, String>> improvements = new ArrayList<>();
        Map<String, String> imp1 = new HashMap<>();
        imp1.put("section", "Professional Experience / Projects");
        imp1.put("original", "Responsible for working on backend tasks and building APIs.");
        if (alignmentFactor < 0.2) {
            imp1.put("suggested", "Tailor your work history to include authentic tech terms and accomplishments instead of generic filler descriptions.");
        } else {
            imp1.put("suggested", "Spearheaded development of 10+ high-performance REST APIs using " + (skillsKeywords.isEmpty() ? "modern frameworks" : skillsKeywords.iterator().next()) + ", reducing response latencies by 25%.");
        }
        improvements.add(imp1);
        result.put("improvements", improvements);

        Map<String, Object> formattingAnalysis = new HashMap<>();
        formattingAnalysis.put("bulletPointsCheck", alignmentFactor < 0.2 ? "Warning" : "Pass");
        formattingAnalysis.put("sectionHeaderCheck", alignmentFactor < 0.2 ? "Warning" : "Pass");
        formattingAnalysis.put("tablesCheck", "Pass");
        if (alignmentFactor < 0.2) {
            formattingAnalysis.put("feedback", "Formatting is acceptable but the semantic content is a complete mismatch. Ensure you are targeting appropriate job listings.");
        } else {
            formattingAnalysis.put("feedback", "Excellent clean structure. Ensure you use bullet points with action verbs and avoid any graphic bars or side columns.");
        }
        result.put("formattingAnalysis", formattingAnalysis);

        if (alignmentFactor < 0.2) {
            result.put("aiInsights", "ALERT: Complete content mismatch detected. Please check if the job details are valid, or rewrite your resume experience to address the target responsibilities.");
        } else {
            result.put("aiInsights", "To maximize your compatibility, focus on upgrading your bullet points to the 'X-Y-Z' formula (e.g., 'Accomplished [X], as measured by [Y], by doing [Z]') and integrate the missing technical keywords in your skills section.");
        }

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
