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
        Job job;
        try {
            job = jobRepository.findById(jobId).orElseGet(() -> getMockJobById(jobId));
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in calculateAtsScore: " + e.getMessage() + ". Falling back to in-memory mock job.");
            job = getMockJobById(jobId);
        }

        String resumeText = extractText(file);

        if (resumeText == null || resumeText.trim().isEmpty() || resumeText.trim().length() < 20) {
            Map<String, Object> result = new HashMap<>();
            result.put("score", 0);
            result.put("message", "Invalid File: The uploaded document does not contain readable text or is not a valid resume.");
            
            Map<String, Object> subScores = new HashMap<>();
            subScores.put("skillsMatch", 0);
            subScores.put("experienceMatch", 0);
            subScores.put("keywordMatch", 0);
            subScores.put("projectRelevance", 0);
            subScores.put("formattingScore", 0);
            subScores.put("educationMatch", 0);
            result.put("subScores", subScores);
            
            Map<String, Object> keywordAnalysis = new HashMap<>();
            keywordAnalysis.put("matched", new ArrayList<>());
            
            List<Map<String, String>> missing = new ArrayList<>();
            if (job.getSkills() != null) {
                for (String skill : job.getSkills().split(",")) {
                    String clean = skill.trim();
                    if (!clean.isEmpty()) {
                        Map<String, String> m = new HashMap<>();
                        m.put("keyword", clean);
                        m.put("category", "Required Skills");
                        m.put("importance", "High");
                        missing.add(m);
                    }
                }
            }
            keywordAnalysis.put("missing", missing);
            result.put("keywordAnalysis", keywordAnalysis);
            
            result.put("strengths", Collections.singletonList("None: Document contains no parsable text."));
            result.put("weaknesses", Collections.singletonList("Invalid file: No readable resume text could be parsed. Ensure you upload a valid PDF or DOCX file containing text rather than images."));
            result.put("improvements", new ArrayList<>());
            
            Map<String, Object> formattingAnalysis = new HashMap<>();
            formattingAnalysis.put("bulletPointsCheck", "Fail");
            formattingAnalysis.put("sectionHeaderCheck", "Fail");
            formattingAnalysis.put("tablesCheck", "Fail");
            formattingAnalysis.put("feedback", "No readable text detected. Please upload a standard text-based resume (PDF or DOCX).");
            result.put("formattingAnalysis", formattingAnalysis);
            
            result.put("aiInsights", "ALERT: Invalid document uploaded. The file does not contain any recognizable resume text or layout structure.");
            return result;
        }

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
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key="
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
                + "1. DETECT GIBBERISH/JUNK/FAKE DETAILS: Analyze the JD Title, Requirements, and Responsibilities. If any of these fields contain gibberish (e.g., non-dictionary scrambled letters, junk words like 'hjLHA', 'ge.ng.eng', 'wgl;ejg', random letters, or look fake/nonsensical), you MUST evaluate this as a COMPLETE CONTENT MISMATCH. Immediately drop the overall score to between 5 and 15, and the 'keywordMatch' subscore to below 10. However, if their resume genuinely has matching technical skills, experience, or academic qualifications, do NOT penalize those specific subscores (skillsMatch, experienceMatch, educationMatch) - calculate and keep their authentic match scores! Output an explicit alert/warning in 'aiInsights' and 'message' declaring that the Job Description is invalid or fake.\n"
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
        String normalizedResume = normalizeText(resumeTextLower);
        Set<String> skillsKeywords = new HashSet<>();
        if (job.getSkills() != null) {
            Arrays.stream(job.getSkills().split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .filter(s -> !s.isEmpty())
                    .forEach(skillsKeywords::add);
        }

        Set<String> descKeywords = new HashSet<>();
        descKeywords.addAll(extractCleanKeywords(stripHtml(job.getDescription())));
        descKeywords.addAll(extractCleanKeywords(stripHtml(job.getRequirements())));
        descKeywords.addAll(extractCleanKeywords(stripHtml(job.getResponsibilities())));

        Set<String> titleKeywords = extractCleanKeywords(stripHtml(job.getTitle()));
        Set<String> resumeWords = extractCleanKeywords(normalizedResume);

        List<Map<String, String>> matched = new ArrayList<>();
        List<Map<String, String>> missing = new ArrayList<>();
        int matchedSkills = 0;

        for (String skill : skillsKeywords) {
            String skillLower = skill.toLowerCase(Locale.ROOT);
            if (normalizedResume.contains(skillLower)) {
                matchedSkills++;
                Map<String, String> entry = new HashMap<>();
                entry.put("keyword", skillLower);
                entry.put("synonymUsed", "exact");
                entry.put("category", "Required Skills");
                matched.add(entry);
            } else {
                Map<String, String> entry = new HashMap<>();
                entry.put("keyword", skillLower);
                entry.put("category", "Required Skills");
                entry.put("importance", "High");
                missing.add(entry);
            }
        }

        int matchedDesc = 0;
        for (String word : descKeywords) {
            if (resumeWords.contains(word)) {
                matchedDesc++;
            }
        }

        int matchedTitle = 0;
        for (String word : titleKeywords) {
            if (resumeWords.contains(word)) {
                matchedTitle++;
            }
        }

        double skillPercentage = skillsKeywords.isEmpty() ? 0 : ((double) matchedSkills / skillsKeywords.size());
        double descPercentage = descKeywords.isEmpty() ? 0 : ((double) matchedDesc / descKeywords.size());
        double titlePercentage = titleKeywords.isEmpty() ? 0 : ((double) matchedTitle / titleKeywords.size());

        boolean hasDateIssue = containsInvalidDateIssue(normalizedResume);
        boolean hasEmail = normalizedResume.contains("@") && (normalizedResume.contains(".com") || normalizedResume.contains(".org") || normalizedResume.contains(".in") || normalizedResume.contains(".edu"));
        boolean hasPhone = normalizedResume.replaceAll("[^0-9]", "").length() >= 10;
        boolean hasBulletPoints = normalizedResume.contains("- ") || normalizedResume.contains("* ") || normalizedResume.contains("•") || normalizedResume.contains("▪") || normalizedResume.contains("◦") || normalizedResume.contains("\n-");
        boolean hasEducationHeader = normalizedResume.contains("education") || normalizedResume.contains("academic") || normalizedResume.contains("qualification");
        boolean hasExperienceHeader = normalizedResume.contains("experience") || normalizedResume.contains("internship") || normalizedResume.contains("employment") || normalizedResume.contains("work history");
        boolean hasSkillsHeader = normalizedResume.contains("skills") || normalizedResume.contains("abilities") || normalizedResume.contains("expertise");

        int skillsMatch = skillsKeywords.isEmpty() ? 0 : (int) Math.round(skillPercentage * 100);
        int keywordMatch = (int) Math.round((skillPercentage * 0.6 + descPercentage * 0.3 + titlePercentage * 0.1) * 100);
        int experienceMatch = estimateExperienceMatch(job, normalizedResume);
        int projectRelevance = estimateProjectRelevance(normalizedResume, skillsKeywords);

        int formattingScore = 35;
        if (hasEmail) formattingScore += 15;
        if (hasPhone) formattingScore += 15;
        if (hasBulletPoints) formattingScore += 15;
        if (hasEducationHeader) formattingScore += 8;
        if (hasExperienceHeader) formattingScore += 8;
        if (hasSkillsHeader) formattingScore += 8;
        if (hasDateIssue) formattingScore = Math.max(0, formattingScore - 15);
        formattingScore = Math.min(100, formattingScore);

        int educationMatch = estimateEducationMatch(job, normalizedResume);

        Map<String, Object> subScores = new HashMap<>();
        subScores.put("skillsMatch", skillsMatch);
        subScores.put("experienceMatch", experienceMatch);
        subScores.put("keywordMatch", keywordMatch);
        subScores.put("projectRelevance", projectRelevance);
        subScores.put("formattingScore", formattingScore);
        subScores.put("educationMatch", educationMatch);

        int overallScore = calculateWeightedOverallScore(subScores);

        Map<String, Object> result = new HashMap<>();
        result.put("score", overallScore);

        String message;
        if (overallScore >= 80) {
            message = "Excellent Match! Your resume demonstrates a highly aligned skill set.";
        } else if (overallScore >= 60) {
            message = "Good Match! Solid alignment, but there are areas you can optimize.";
        } else if (overallScore >= 40) {
            message = "Fair Match! You meet some core requirements but need to add more relevant keywords.";
        } else if (hasDateIssue) {
            message = "Low Match! Resume date details appear inconsistent or invalid, which reduces the ATS trust score.";
        } else {
            message = "Low Match! High potential mismatch. Consider tailoring your resume for this role.";
        }
        result.put("message", message);

        result.put("subScores", subScores);
        result.put("scoreBreakdown", buildScoreBreakdown(subScores));

        Map<String, Object> keywordAnalysis = new HashMap<>();
        keywordAnalysis.put("matched", matched);
        keywordAnalysis.put("missing", missing);
        result.put("keywordAnalysis", keywordAnalysis);

        List<String> strengths = new ArrayList<>();
        if (matchedSkills > 0) strengths.add("Targeted resume skills align with the role requirements.");
        if (hasEmail && hasPhone) strengths.add("Contact data and basic ATS structure are present.");
        if (hasBulletPoints) strengths.add("The content is organized with readable bullet style formatting.");
        if (strengths.isEmpty()) strengths.add("Resume contains enough text to be scanned, but it needs more role-specific detail.");
        result.put("strengths", strengths);

        List<String> weaknesses = new ArrayList<>();
        if (missing.size() > 0) weaknesses.add("Several key skills from the job description are not yet demonstrated in the resume.");
        if (hasDateIssue) weaknesses.add("Date values appear inconsistent or invalid and should be normalized.");
        if (!hasExperienceHeader) weaknesses.add("Experience section could be clearer and more ATS-friendly.");
        if (weaknesses.isEmpty()) weaknesses.add("Resume could be strengthened with more quantified impact and role-specific keywords.");
        result.put("weaknesses", weaknesses);

        List<Map<String, String>> improvements = new ArrayList<>();
        if (!skillsKeywords.isEmpty()) {
            String topSkill = skillsKeywords.iterator().next();
            Map<String, String> improvement = new HashMap<>();
            improvement.put("section", "Professional Experience / Projects");
            improvement.put("original", "Worked on application development tasks and solved backend issues.");
            improvement.put("suggested", "Delivered " + topSkill + "-driven features and improved system reliability by 25%, enabling faster team delivery and smoother production operations.");
            improvements.add(improvement);
        }
        result.put("improvements", improvements);

        Map<String, Object> formattingAnalysis = new HashMap<>();
        formattingAnalysis.put("bulletPointsCheck", hasBulletPoints ? "Pass" : "Warning");
        formattingAnalysis.put("sectionHeaderCheck", (hasEducationHeader && hasExperienceHeader && hasSkillsHeader) ? "Pass" : ((hasEducationHeader || hasExperienceHeader || hasSkillsHeader) ? "Warning" : "Fail"));
        formattingAnalysis.put("tablesCheck", hasDateIssue ? "Warning" : "Pass");
        String feedback = "The resume has a usable ATS structure. Add consistent section naming and normalize any invalid dates before submission.";
        if (!hasBulletPoints) feedback = "Use concise bullet points under experience and project sections to boost ATS readability.";
        if (hasDateIssue) feedback = "Date values appear invalid or inconsistent. Standardize them to a single format like 2023-2024 or Jun 2023 – Sep 2024.";
        formattingAnalysis.put("feedback", feedback);
        List<Map<String, Object>> verifiedIssues = new ArrayList<>();
        if (hasDateIssue) {
            verifiedIssues.add(buildIssue(
                "Date format is inconsistent or invalid",
                "The parsed resume text contains a date-like value outside a valid calendar range.",
                extractDateEvidence(normalizedResume),
                "Experience timeline",
                "warning"
            ));
        }
        if (!hasBulletPoints) {
            verifiedIssues.add(buildIssue(
                "Bullet structure is weak",
                "The resume text does not clearly show bullet points, which can reduce ATS readability.",
                "No bullet markers such as - or • were detected in the parsed text.",
                "Experience section",
                "warning"
            ));
        }
        if (verifiedIssues.isEmpty()) {
            verifiedIssues.add(buildIssue(
                "Formatting review is clear",
                "The parsed resume text does not show a verified ATS formatting issue.",
                "The resume includes readable section naming and a scan-friendly structure.",
                "Formatting review",
                "info"
            ));
        }
        formattingAnalysis.put("verifiedIssues", verifiedIssues);
        formattingAnalysis.put("potentialRisks", new ArrayList<>());
        result.put("formattingAnalysis", formattingAnalysis);

        if (hasDateIssue) {
            result.put("aiInsights", "ALERT: Resume date values appear inconsistent or invalid. Fix them before submission so recruiters and ATS systems can trust the chronology and experience timeline.");
        } else {
            result.put("aiInsights", "To maximize your compatibility, quantify your impact in each role and align the exact skill language used in the job description with your project and experience bullets.");
        }

        return result;
    }

    private String normalizeText(String input) {
        if (input == null) return "";
        return input.replace("\r", " ").replace("\n", " ").replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
    }    private boolean containsInvalidDateIssue(String resumeTextLower) {
        if (resumeTextLower == null || resumeTextLower.isBlank()) {
            return false;
        }

        String sanitized = resumeTextLower
                .replace("�", "-")
                .replace("�", "-")
                .replaceAll("\\b(?:present|current(?:ly)?)\\b", " ");

        if (sanitized.isBlank()) {
            return false;
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.regex.Pattern dateRegex = java.util.regex.Pattern.compile(
                "(?:\\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s+\\d{4}\\b|\\b\\d{4}[-/.]\\d{1,2}(?:[-/.]\\d{1,2})?\\b|\\b\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}\\b)",
                java.util.regex.Pattern.CASE_INSENSITIVE
        );

        java.util.regex.Matcher matcher = dateRegex.matcher(sanitized);
        while (matcher.find()) {
            String dateText = matcher.group().trim();
            java.time.LocalDate parsed = parseDateCandidate(dateText);
            if (parsed == null) {
                continue;
            }
            if (parsed.isAfter(today.plusMonths(1))) {
                return true;
            }
        }

        return false;
    }

    private java.time.LocalDate parseDateCandidate(String dateText) {
        if (dateText == null || dateText.isBlank()) {
            return null;
        }

        String cleaned = dateText.trim().replace("�", "-").replace("�", "-");
        String lower = cleaned.toLowerCase(Locale.ROOT);

        if (lower.contains("present") || lower.contains("current") || lower.contains("currently")) {
            return java.time.LocalDate.now();
        }

        try {
            if (lower.matches("^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s+\\d{4}$")) {
                String[] parts = cleaned.split("\\s+");
                String monthName = parts[0];
                int year = Integer.parseInt(parts[1]);
                int month = getMonthNumber(monthName);
                if (month == -1) {
                    return null;
                }
                return java.time.LocalDate.of(year, month, 1);
            }

            if (lower.matches("^\\d{4}$")) {
                int year = Integer.parseInt(cleaned);
                return java.time.LocalDate.of(year, 1, 1);
            }

            if (lower.matches("^\\d{4}[-/.]\\d{1,2}(?:[-/.]\\d{1,2})?$")) {
                String[] parts = cleaned.split("[-/.]");
                int year = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                int day = parts.length > 2 ? Integer.parseInt(parts[2]) : 1;
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    return null;
                }
                return java.time.LocalDate.of(year, month, day);
            }

            if (lower.matches("^\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}$")) {
                String[] parts = cleaned.split("[-/.]");
                int month = Integer.parseInt(parts[0]);
                int day = Integer.parseInt(parts[1]);
                int year = Integer.parseInt(parts[2]);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    return null;
                }
                return java.time.LocalDate.of(year, month, day);
            }
        } catch (NumberFormatException | java.time.DateTimeException ignored) {
            return null;
        }

        return null;
    }

    private int getMonthNumber(String monthValue) {
        String month = monthValue.toLowerCase(Locale.ROOT);
        return switch (month) {
            case "jan", "january" -> 1;
            case "feb", "february" -> 2;
            case "mar", "march" -> 3;
            case "apr", "april" -> 4;
            case "may" -> 5;
            case "jun", "june" -> 6;
            case "jul", "july" -> 7;
            case "aug", "august" -> 8;
            case "sep", "sept", "september" -> 9;
            case "oct", "october" -> 10;
            case "nov", "november" -> 11;
            case "dec", "december" -> 12;
            default -> -1;
        };
    }

    private int estimateExperienceMatch(Job job, String resumeTextLower) {
        String expReq = job.getExperienceLevel() != null ? job.getExperienceLevel().toLowerCase(Locale.ROOT) : "";
        boolean isEntryOrFresherJob = expReq.contains("0-2") || expReq.contains("entry") || expReq.contains("fresher") || expReq.isEmpty();
        boolean isMidOrSeniorJob = expReq.contains("3-5") || expReq.contains("mid") || expReq.contains("senior") || expReq.contains("5+");

        boolean hasInternship = resumeTextLower.contains("intern") || resumeTextLower.contains("assistant") || resumeTextLower.contains("teaching");
        boolean hasExperienceText = resumeTextLower.contains("experience") || resumeTextLower.contains("worked") || resumeTextLower.contains("employment") || resumeTextLower.contains("years") || resumeTextLower.contains("y/o");
        boolean hasStrongExperience = resumeTextLower.matches(".*(?:\\b(?:1|2|3|4|5|6|7|8|9)\\s*(?:-|to|\\+)\\s*(?:1|2|3|4|5|6|7|8|9|10|\\+)\\s*years.*|.*\\b(?:1|2|3|4|5|6|7|8|9)\\+\\s*years.*).*")
                || resumeTextLower.contains("senior") || resumeTextLower.contains("lead") || resumeTextLower.contains("manager");

        if (isEntryOrFresherJob) {
            if (hasStrongExperience || hasInternship) return 72;
            if (hasExperienceText) return 60;
            return 40;
        }

        if (isMidOrSeniorJob) {
            if (hasStrongExperience) return 82;
            if (hasExperienceText || hasInternship) return 62;
            return 48;
        }

        if (hasStrongExperience) return 80;
        if (hasExperienceText || hasInternship) return 65;
        return 45;
    }

    private int estimateProjectRelevance(String resumeTextLower, Set<String> skillsKeywords) {
        boolean hasProjectsSection = resumeTextLower.contains("project") || resumeTextLower.contains("portfolio") || resumeTextLower.contains("capstone");
        if (!hasProjectsSection) return 35;

        int matchedSkillsInProjects = 0;
        for (String skill : skillsKeywords) {
            if (resumeTextLower.contains(skill.toLowerCase(Locale.ROOT))) {
                matchedSkillsInProjects++;
            }
        }

        if (matchedSkillsInProjects >= 3) return 82;
        if (matchedSkillsInProjects >= 2) return 70;
        if (matchedSkillsInProjects >= 1) return 58;
        return 45;
    }

    private int estimateEducationMatch(Job job, String resumeTextLower) {
        boolean hasDegree = resumeTextLower.contains("btech") || resumeTextLower.contains("bachelor") || resumeTextLower.contains("degree") || resumeTextLower.contains("graduate") || resumeTextLower.contains("b.tech") || resumeTextLower.contains("mca") || resumeTextLower.contains("diploma");
        if (!hasDegree) return 0;

        String jobTextLower = (job.getTitle() != null ? job.getTitle().toLowerCase(Locale.ROOT) : "") + " " +
                (job.getRequirements() != null ? job.getRequirements().toLowerCase(Locale.ROOT) : "") + " " +
                (job.getSkills() != null ? job.getSkills().toLowerCase(Locale.ROOT) : "") + " " +
                (job.getDescription() != null ? job.getDescription().toLowerCase(Locale.ROOT) : "");

        boolean candCS = resumeTextLower.contains("computer science") || resumeTextLower.contains("cse") || resumeTextLower.contains("aiml") || resumeTextLower.contains("ai/ml") || resumeTextLower.contains("software") || resumeTextLower.contains("information technology");
        boolean candECE = resumeTextLower.contains("electronics") || resumeTextLower.contains("ece") || resumeTextLower.contains("communication");
        boolean candMech = resumeTextLower.contains("mechanical") || resumeTextLower.contains("mech");
        boolean candCivil = resumeTextLower.contains("civil");
        boolean candBiz = resumeTextLower.contains("mba") || resumeTextLower.contains("business") || resumeTextLower.contains("marketing") || resumeTextLower.contains("sales");

        boolean jobWantsCS = jobTextLower.contains("computer science") || jobTextLower.contains("cse") || jobTextLower.contains("software") || jobTextLower.contains("information technology") || jobTextLower.contains("aiml") || jobTextLower.contains("developer");
        boolean jobWantsECE = jobTextLower.contains("electronics") || jobTextLower.contains("ece") || jobTextLower.contains("communication");
        boolean jobWantsMech = jobTextLower.contains("mechanical") || jobTextLower.contains("mech");
        boolean jobWantsCivil = jobTextLower.contains("civil");
        boolean jobWantsBiz = jobTextLower.contains("mba") || jobTextLower.contains("business") || jobTextLower.contains("marketing") || jobTextLower.contains("sales");

        boolean specifiedRequirementFound = false;
        boolean candidateMatchesSpecified = false;

        if (jobWantsCS) {
            specifiedRequirementFound = true;
            if (candCS) candidateMatchesSpecified = true;
        }
        if (jobWantsECE) {
            specifiedRequirementFound = true;
            if (candECE) candidateMatchesSpecified = true;
        }
        if (jobWantsMech) {
            specifiedRequirementFound = true;
            if (candMech) candidateMatchesSpecified = true;
        }
        if (jobWantsCivil) {
            specifiedRequirementFound = true;
            if (candCivil) candidateMatchesSpecified = true;
        }
        if (jobWantsBiz) {
            specifiedRequirementFound = true;
            if (candBiz) candidateMatchesSpecified = true;
        }

        if (specifiedRequirementFound) {
            return candidateMatchesSpecified ? 82 : 45;
        }
        return 75;
    }

    private String extractText(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        try (InputStream is = file.getInputStream()) {
            if (filename.endsWith(".pdf")) {
                try (PDDocument document = PDDocument.load(is)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return normalizeText(stripper.getText(document));
                }
            } else if (filename.endsWith(".docx")) {
                try (XWPFDocument doc = new XWPFDocument(is)) {
                    StringBuilder sb = new StringBuilder();
                    for (XWPFParagraph p : doc.getParagraphs()) {
                        sb.append(p.getText()).append(" ");
                    }
                    return normalizeText(sb.toString());
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
                    return normalizeText(sb.toString());
                }
            } else if (filename.endsWith(".txt")) {
                return normalizeText(new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8));
            }
        }
        return "";
    }

    public Map<String, Object> calculateGeneralAtsScore(MultipartFile file, String jd) throws Exception {
        String resumeText = extractText(file);

        if (resumeText == null || resumeText.trim().isEmpty() || resumeText.trim().length() < 20) {
            Map<String, Object> result = new HashMap<>();
            result.put("score", 0);
            result.put("message", "Invalid File: The uploaded document does not contain readable text.");
            
            Map<String, Object> subScores = new HashMap<>();
            subScores.put("skillsMatch", 0);
            subScores.put("experienceMatch", 0);
            subScores.put("keywordMatch", 0);
            subScores.put("projectRelevance", 0);
            subScores.put("formattingScore", 0);
            subScores.put("educationMatch", 0);
            result.put("subScores", subScores);
            
            result.put("strengths", Collections.singletonList("None"));
            result.put("weaknesses", Collections.singletonList("No readable text found."));
            result.put("improvements", new ArrayList<>());
            return result;
        }
        if (jd != null && !jd.trim().isEmpty()) {
            String trimmedJd = jd.trim();
            String[] words = trimmedJd.split("\\s+");
            boolean isGibberish = false;

            if (trimmedJd.length() < 30) {
                isGibberish = true;
            } else if (words.length < 5) {
                isGibberish = true;
            } else {
                int maxLength = 0;
                for (String w : words) {
                    if (w.length() > maxLength) {
                        maxLength = w.length();
                    }
                }
                if (maxLength > 25) {
                    isGibberish = true;
                }
            }

            if (isGibberish) {
                Map<String, Object> errResult = new HashMap<>();
                errResult.put("error", "Invalid Job Description: The provided JD appears to be too short, incomplete, or gibberish. Please paste a valid, realistic Job Description to perform a Targeted Match.");
                return errResult;
            }
        }

        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            if (jd != null && !jd.trim().isEmpty()) {
                return basicTargetedCalculate(resumeText, jd);
            }
            return basicGeneralCalculate(resumeText.toLowerCase());
        }

        try {
            return callGeminiGeneral(resumeText, jd);
        } catch (Exception e) {
            e.printStackTrace();
            if (jd != null && !jd.trim().isEmpty()) {
                return basicTargetedCalculate(resumeText, jd);
            }
            return basicGeneralCalculate(resumeText.toLowerCase());
        }
    }

    private Map<String, Object> callGeminiGeneral(String resumeText, String jd) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key="
                + geminiApiKey.trim();

        String prompt;
        if (jd != null && !jd.trim().isEmpty()) {
            prompt = "You are a world-class expert ATS recruiter and technical resume auditor.\n"
                    + "Evaluate the user's resume rigorously and critically AGAINST the pasted Target Job Description (JD).\n\n"
                    + "MANDATORY EVIDENCE RULES:\n"
                    + "- Base every match on evidence in the actual resume and JD. Do not invent skills, qualifications, years of experience, certifications, achievements, or projects.\n"
                    + "- If the resume does not explicitly mention a requirement, mark it missing rather than assuming it.\n"
                    + "- If the JD is not a valid job description or is gibberish, explicitly say so in message and aiInsights.\n"
                    + "- Use the actual wording from resume and JD as much as possible to identify matched and missing keywords.\n\n"
                    + "TARGET JOB DESCRIPTION:\n" + jd + "\n\n"
                    + "CANDIDATE RESUME TEXT:\n" + resumeText + "\n\n"
                    + "YOUR AUDIT MUST CRITICALLY ASSESS:\n"
                    + "1. Technical skills alignment between the Resume and the Job Description.\n"
                    + "2. Clear, quantified project/experience bullet points matching target requirements (X-Y-Z formula).\n"
                    + "3. Professional formatting and legibility for ATS screening.\n"
                    + "4. Overall ATS readability and alignment percentage.\n\n"
                    + "YOUR RESPONSE MUST BE A SINGLE, VALID JSON OBJECT WITH EXACTLY THESE KEYS (no markdown wrapping):\n"
                    + "{\n"
                    + "  \"score\": 75, // integer 0-100 overall match percentage alignment score against this JD\n"
                    + "  \"message\": \"overall summary of the resume's alignment and match suitability for this specific job description\",\n"
                    + "  \"subScores\": {\n"
                    + "    \"skillsMatch\": 80,\n"
                    + "    \"experienceMatch\": 70,\n"
                    + "    \"keywordMatch\": 75,\n"
                    + "    \"projectRelevance\": 85,\n"
                    + "    \"formattingScore\": 90,\n"
                    + "    \"educationMatch\": 95\n"
                    + "  },\n"
                    + "  \"keywordAnalysis\": {\n"
                    + "    \"matched\": [\n"
                    + "      { \"keyword\": \"java\", \"synonymUsed\": \"exact\", \"category\": \"Technical\" }\n"
                    + "    ],\n"
                    + "    \"missing\": [\n"
                    + "      { \"keyword\": \"docker\", \"category\": \"DevOps\", \"importance\": \"Medium\" }\n"
                    + "    ]\n"
                    + "  },\n"
                    + "  \"strengths\": [\"strength 1 aligning to this role\", \"strength 2\"],\n"
                    + "  \"weaknesses\": [\"gap 1 mismatch to JD requirements\", \"gap 2\"],\n"
                    + "  \"improvements\": [\n"
                    + "    { \"section\": \"Experience\", \"original\": \"original weak bullet point\", \"suggested\": \"rewritten using X-Y-Z formula tailored to the JD requirements\" }\n"
                    + "  ],\n"
                    + "  \"formattingAnalysis\": {\n"
                    + "    \"bulletPointsCheck\": \"Pass/Fail/Warning\",\n"
                    + "    \"sectionHeaderCheck\": \"Pass/Fail/Warning\",\n"
                    + "    \"tablesCheck\": \"Pass/Fail/Warning\",\n"
                    + "    \"feedback\": \"detailed formatting feedback\"\n"
                    + "  },\n"
                    + "  \"aiInsights\": \"high level strategic advice for tailored positioning to land this specific role\"\n"
                    + "}";
        } else {
            prompt = "You are a world-class expert ATS recruiter and technical resume auditor. "
                    + "Provide an extremely strict, rigorous, and highly realistic general semantic audit of the user's resume.\n\n"
                    + "RESUME TEXT:\n" + resumeText + "\n\n"
                    + "YOUR AUDIT MUST CRITICALLY ASSESS:\n"
                    + "1. Technical skills presence and clarity.\n"
                    + "2. Clear, quantified project/experience bullet points (X-Y-Z formula).\n"
                + "3. Professional formatting (lack of bad headers, graphic rating bars, etc.).\n"
                + "4. Overall ATS readability.\n\n"
                + "YOUR RESPONSE MUST BE A SINGLE, VALID JSON OBJECT WITH EXACTLY THESE KEYS (no markdown wrapping):\n"
                + "{\n"
                + "  \"score\": 75, // integer 0-100 overall resume score\n"
                + "  \"message\": \"overall summary of the resume's performance in standard tracking systems\",\n"
                + "  \"subScores\": {\n"
                + "    \"skillsMatch\": 80,\n"
                + "    \"experienceMatch\": 70,\n"
                + "    \"keywordMatch\": 75,\n"
                + "    \"projectRelevance\": 85,\n"
                + "    \"formattingScore\": 90,\n"
                + "    \"educationMatch\": 95\n"
                + "  },\n"
                + "  \"keywordAnalysis\": {\n"
                + "    \"matched\": [\n"
                + "      { \"keyword\": \"java\", \"synonymUsed\": \"exact\", \"category\": \"Technical\" }\n"
                + "    ],\n"
                + "    \"missing\": [\n"
                + "      { \"keyword\": \"docker\", \"category\": \"DevOps\", \"importance\": \"Medium\" }\n"
                + "    ]\n"
                + "  },\n"
                + "  \"strengths\": [\"strength 1\", \"strength 2\"],\n"
                + "  \"weaknesses\": [\"weakness 1\", \"weakness 2\"],\n"
                + "  \"improvements\": [\n"
                + "    { \"section\": \"Experience\", \"original\": \"original weak bullet point\", \"suggested\": \"rewritten using X-Y-Z formula\" }\n"
                + "  ],\n"
                + "  \"formattingAnalysis\": {\n"
                + "    \"bulletPointsCheck\": \"Pass/Fail/Warning\",\n"
                + "    \"sectionHeaderCheck\": \"Pass/Fail/Warning\",\n"
                + "    \"tablesCheck\": \"Pass/Fail/Warning\",\n"
                + "    \"feedback\": \"detailed formatting feedback\"\n"
                + "  },\n"
                + "  \"aiInsights\": \"high level strategic advice for career growth\"\n"
                + "}";
        }

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
        result.put("score", resultNode.path("score").asInt(70));
        result.put("message", resultNode.path("message").asText("Analysis complete."));
        result.put("subScores", objectMapper.convertValue(resultNode.path("subScores"), Map.class));
        result.put("keywordAnalysis", objectMapper.convertValue(resultNode.path("keywordAnalysis"), Map.class));
        result.put("strengths", objectMapper.convertValue(resultNode.path("strengths"), List.class));
        result.put("weaknesses", objectMapper.convertValue(resultNode.path("weaknesses"), List.class));
        result.put("improvements", objectMapper.convertValue(resultNode.path("improvements"), List.class));

        Map<String, Object> formattingAnalysis = objectMapper.convertValue(resultNode.path("formattingAnalysis"), Map.class);
        if (formattingAnalysis == null) {
            formattingAnalysis = new HashMap<>();
        }
        List<Map<String, Object>> verifiedIssues = new ArrayList<>();
        if (resultNode.has("verifiedIssues")) {
            verifiedIssues = objectMapper.convertValue(resultNode.path("verifiedIssues"), List.class);
        }
        if (verifiedIssues.isEmpty()) {
            verifiedIssues.add(buildIssue(
                "Formatting checks are based on extracted text",
                "No verified parsing issue was found in the scanned resume text.",
                "Parsed content from the uploaded resume was used to validate this assessment.",
                "Formatting review",
                "info"
            ));
        }
        formattingAnalysis.put("verifiedIssues", verifiedIssues);
        formattingAnalysis.put("potentialRisks", objectMapper.convertValue(resultNode.path("potentialRisks"), List.class));
        result.put("formattingAnalysis", formattingAnalysis);
        result.put("scoreBreakdown", buildScoreBreakdown(objectMapper.convertValue(resultNode.path("subScores"), Map.class)));
        result.put("aiInsights", resultNode.path("aiInsights").asText(""));
        return result;
    }

    private Map<String, Object> basicTargetedCalculate(String resumeText, String jd) {
        String resumeLower = normalizeText(resumeText);
        String jdLower = normalizeText(jd);

        Set<String> jdKeywords = extractCleanKeywords(jdLower);
        Set<String> resumeKeywords = extractCleanKeywords(resumeLower);

        List<Map<String, String>> matched = new ArrayList<>();
        List<Map<String, String>> missing = new ArrayList<>();

        for (String keyword : jdKeywords) {
            if (keyword.length() <= 2) continue;
            if (resumeKeywords.contains(keyword)) {
                Map<String, String> item = new HashMap<>();
                item.put("keyword", keyword);
                item.put("synonymUsed", "exact");
                item.put("category", "Targeted JD");
                matched.add(item);
            } else {
                Map<String, String> item = new HashMap<>();
                item.put("keyword", keyword);
                item.put("category", "Targeted JD");
                item.put("importance", "High");
                missing.add(item);
            }
        }

        int totalKeywords = Math.max(1, jdKeywords.size());
        int matchedCount = matched.size();
        int keywordMatch = (int) Math.round((matchedCount / (double) totalKeywords) * 100.0);

        int experienceMatch = 45;
        if (resumeLower.contains("experience") || resumeLower.contains("worked") || resumeLower.contains("years") || resumeLower.contains("intern")) {
            if (jdLower.contains("senior") || jdLower.contains("lead") || jdLower.contains("manager")) {
                experienceMatch = resumeLower.contains("senior") || resumeLower.contains("lead") ? 76 : 62;
            } else if (jdLower.contains("mid") || jdLower.contains("3") || jdLower.contains("4") || jdLower.contains("5")) {
                experienceMatch = 68;
            } else {
                experienceMatch = 74;
            }
        }

        int projectRelevance = 50;
        if (resumeLower.contains("project") || resumeLower.contains("portfolio") || resumeLower.contains("implementation")) {
            projectRelevance = matchedCount > 0 ? 72 : 56;
        }

        int formattingScore = 74;
        if (resumeLower.contains("education") || resumeLower.contains("experience") || resumeLower.contains("skills")) formattingScore += 8;
        if (resumeLower.contains("- ") || resumeLower.contains("•") || resumeLower.contains("\n")) formattingScore += 8;
        formattingScore = Math.min(100, formattingScore);

        boolean jdMentionsDegree = jdLower.contains("degree") || jdLower.contains("btech") || jdLower.contains("bachelor") || jdLower.contains("master") || jdLower.contains("mca");
        boolean resumeMentionsDegree = resumeLower.contains("btech") || resumeLower.contains("bachelor") || resumeLower.contains("degree") || resumeLower.contains("master") || resumeLower.contains("mca");
        int educationMatch = jdMentionsDegree ? (resumeMentionsDegree ? 82 : 43) : 77;

        int skillsMatch = keywordMatch;
        int score = (int) Math.round((skillsMatch * 0.35) + (experienceMatch * 0.2) + (projectRelevance * 0.15) + (formattingScore * 0.15) + (educationMatch * 0.15));
        score = Math.max(0, Math.min(100, score));

        Map<String, Object> result = new HashMap<>();
        result.put("score", score);

        String message = score >= 80 ? "Strong JD match. The resume evidence aligns well with the job requirements." :
                score >= 60 ? "Good JD match. The resume covers most core requirements, with a few gaps to close." :
                score >= 40 ? "Moderate JD match. The resume reflects some role alignment but needs stronger keyword and responsibility coverage." :
                "Low JD match. The resume has limited evidence for the target role and requires targeted tailoring.";
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

        List<String> strengths = new ArrayList<>();
        if (matchedCount > 0) strengths.add("The resume explicitly contains several keywords from the target job description.");
        if (resumeLower.contains("project") || resumeLower.contains("experience")) strengths.add("Relevant experience and project context are present for ATS review.");
        if (strengths.isEmpty()) strengths.add("The resume has a readable structure but needs stronger role-specific evidence.");
        result.put("strengths", strengths);

        List<String> weaknesses = new ArrayList<>();
        if (missing.size() > 0) weaknesses.add("The JD contains critical requirements that are not clearly evidenced in the resume.");
        if (!resumeLower.contains("project") && !resumeLower.contains("experience")) weaknesses.add("Experience and project evidence should be expanded to support the target role.");
        if (weaknesses.isEmpty()) weaknesses.add("Add more measurable achievements and role-specific responsibilities to strengthen the resume.");
        result.put("weaknesses", weaknesses);

        List<Map<String, String>> improvements = new ArrayList<>();
        if (missing.size() > 0) {
            Map<String, String> improvement = new HashMap<>();
            improvement.put("section", "Experience / Skills");
            improvement.put("original", "Worked on software tasks relevant to business needs.");
            improvement.put("suggested", "Delivered production-ready solutions in " + (missing.size() > 0 ? missing.get(0).get("keyword") : "core technology") + " using measurable impact, architecture decisions, and cross-functional collaboration.");
            improvements.add(improvement);
        }
        result.put("improvements", improvements);

        Map<String, Object> formatting = new HashMap<>();
        formatting.put("bulletPointsCheck", resumeLower.contains("- ") || resumeLower.contains("•") ? "Pass" : "Warning");
        formatting.put("sectionHeaderCheck", (resumeLower.contains("experience") || resumeLower.contains("education") || resumeLower.contains("skills")) ? "Pass" : "Warning");
        formatting.put("tablesCheck", "Pass");
        formatting.put("feedback", "The resume is readable and ATS-friendly. Add missing JD keywords and expand your experience bullets with explicit impact statements.");
        result.put("formattingAnalysis", formatting);

        result.put("aiInsights", "Use the JD as a checklist for exact skill and responsibility alignment. Keep all claims tied to evidence in the resume and add missing keywords where they are genuinely present in your work experience.");
        return result;
    }

    private Map<String, Object> basicGeneralCalculate(String resumeTextLower) {
        String originalResume = resumeTextLower == null ? "" : resumeTextLower;
        String normalizedResume = normalizeText(resumeTextLower);
        Set<String> resumeWords = extractCleanKeywords(normalizedResume);
        List<String> genericSkills = Arrays.asList("java", "python", "sql", "react", "spring", "javascript", "aws", "docker", "postgresql", "mongodb", "api", "rest", "html", "css", "git", "data structures", "machine learning", "cloud");

        List<Map<String, Object>> matched = new ArrayList<>();
        List<Map<String, Object>> missing = new ArrayList<>();
        int matchedSkillCount = 0;
        for (String skill : genericSkills) {
            if (normalizedResume.contains(skill)) {
                matchedSkillCount++;
                Map<String, Object> record = new HashMap<>();
                record.put("keyword", skill);
                record.put("synonymUsed", "exact");
                record.put("category", "Technical");
                record.put("optional", Boolean.FALSE);
                matched.add(record);
            } else {
                Map<String, Object> record = new HashMap<>();
                record.put("keyword", skill);
                record.put("category", "Technical");
                record.put("importance", "Low");
                record.put("optional", Boolean.TRUE);
                record.put("note", "Optional suggestion for stronger profile coverage, not a required role gap.");
                record.put("evidence", "No direct match found in the resume text.");
                missing.add(record);
            }
        }

        int skillsMatch = (int) Math.round(((double) matchedSkillCount / genericSkills.size()) * 100);
        int experienceMatch = estimateGeneralExperienceMatch(normalizedResume);
        int projectRelevance = estimateGeneralProjectRelevance(normalizedResume, resumeWords);
        int keywordMatch = Math.min(100, (int) Math.round(((double) matchedSkillCount / genericSkills.size()) * 100));
        int formattingScore = estimateGeneralFormattingScore(normalizedResume, originalResume);
        int educationMatch = estimateGeneralEducationMatch(normalizedResume);

        int score = (int) Math.round((skillsMatch * 0.25) + (experienceMatch * 0.2) + (keywordMatch * 0.2) + (projectRelevance * 0.15) + (formattingScore * 0.1) + (educationMatch * 0.1));
        score = Math.max(0, Math.min(100, score));

        List<Map<String, Object>> issues = buildGeneralIssues(normalizedResume, originalResume);
        List<Map<String, Object>> recommendations = buildGeneralRecommendations(normalizedResume, matchedSkillCount, issues);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "General ATS review based on actual resume evidence. The score reflects structure, skills, experience, and formatting visibility rather than inferred job-specific gaps.");

        Map<String, Object> subScores = new HashMap<>();
        subScores.put("skillsMatch", skillsMatch);
        subScores.put("experienceMatch", experienceMatch);
        subScores.put("keywordMatch", keywordMatch);
        subScores.put("projectRelevance", projectRelevance);
        subScores.put("formattingScore", formattingScore);
        subScores.put("educationMatch", educationMatch);
        result.put("subScores", subScores);
        result.put("score", calculateWeightedOverallScore(subScores));
        result.put("scoreBreakdown", buildScoreBreakdown(subScores));

        Map<String, Object> keywordAnalysis = new HashMap<>();
        keywordAnalysis.put("matched", matched);
        keywordAnalysis.put("missing", missing);
        result.put("keywordAnalysis", keywordAnalysis);

        List<String> strengths = new ArrayList<>();
        if (matchedSkillCount > 0) {
            String topSkill = matched.stream()
                .limit(3)
                .map(item -> String.valueOf(item.get("keyword")))
                .filter(skill -> skill != null && !skill.isBlank())
                .collect(java.util.stream.Collectors.joining(", "));
            strengths.add("Resume contains recognizable technical terminology, including " + (topSkill.isEmpty() ? "core software skills" : topSkill) + ".");
        }
        if (normalizedResume.contains("experience") || normalizedResume.contains("work") || normalizedResume.contains("intern")) {
            strengths.add("The resume clearly references work history or experience context that ATS engines can parse.");
        }
        if (normalizedResume.contains("education") || normalizedResume.contains("btech") || normalizedResume.contains("bachelor") || normalizedResume.contains("degree")) {
            strengths.add("Academic background is present and readable for ATS evaluation.");
        }
        if (strengths.isEmpty()) strengths.add("The file contains readable content, but it would benefit from clearer section naming and more explicit technical evidence.");
        result.put("strengths", strengths);

        List<String> weaknesses = new ArrayList<>();
        if (!issues.isEmpty()) {
            for (Map<String, Object> issue : issues.stream().limit(3).toList()) {
                String title = String.valueOf(issue.getOrDefault("title", "Resume issue"));
                String detail = String.valueOf(issue.getOrDefault("detail", "Improve the resume section."));
                weaknesses.add(title + " — " + detail);
            }
        }
        if (weaknesses.isEmpty()) weaknesses.add("No major ATS issues were detected based on the parsed resume text.");
        result.put("weaknesses", weaknesses);

        List<Map<String, String>> improvements = new ArrayList<>();
        for (Map<String, Object> recommendation : recommendations) {
            Map<String, String> entry = new HashMap<>();
            entry.put("section", String.valueOf(recommendation.getOrDefault("section", "Resume")));
            entry.put("original", String.valueOf(recommendation.getOrDefault("original", "Current resume language.")));
            entry.put("suggested", String.valueOf(recommendation.getOrDefault("action", "Add measurable technical outcomes and clearer resume structure.")));
            improvements.add(entry);
        }
        result.put("improvements", improvements);

        Map<String, Object> formatting = new HashMap<>();
        formatting.put("bulletPointsCheck", normalizedResume.contains("- ") || normalizedResume.contains("•") || normalizedResume.contains("*") ? "Pass" : "Warning");
        formatting.put("sectionHeaderCheck", (normalizedResume.contains("education") || normalizedResume.contains("experience") || normalizedResume.contains("skills") || normalizedResume.contains("projects")) ? "Pass" : "Warning");
        formatting.put("tablesCheck", containsInvalidDateIssue(normalizedResume) ? "Warning" : "Pass");
        formatting.put("feedback", "The resume is mostly ATS-readable, but clearer section labels, consistent dates, and measurable action statements would improve credibility and parse quality.");
        formatting.put("verifiedIssues", issues);
        formatting.put("potentialRisks", new ArrayList<>());
        result.put("formattingAnalysis", formatting);

        result.put("issues", issues);
        result.put("recommendations", recommendations);
        result.put("aiInsights", "This score reflects the resume's actual structure and wording. Improve with measurable results, consistent dates, and stronger section clarity to increase ATS readability without inventing qualifications.");
        return result;
    }

    private List<Map<String, Object>> buildGeneralIssues(String normalizedResume, String originalResume) {
        List<Map<String, Object>> issues = new ArrayList<>();

        if (containsInvalidDateIssue(normalizedResume)) {
            issues.add(buildIssue(
                "Date format is inconsistent or invalid",
                "Date values should follow one clear format and valid calendar ranges.",
                extractDateEvidence(originalResume),
                "Experience timeline",
                "warning"
            ));
        }

        if (!normalizedResume.contains("experience") && !normalizedResume.contains("work") && !normalizedResume.contains("intern")) {
            issues.add(buildIssue(
                "Experience section is not clearly labeled",
                "ATS systems scan for standard work-history headings. A clear experience section improves parse reliability.",
                "No explicit work-history language was detected in the resume text.",
                "Experience section",
                "info"
            ));
        }

        if (!normalizedResume.contains("skills") && !normalizedResume.contains("technical") && !normalizedResume.contains("tools") && !normalizedResume.contains("programming")) {
            issues.add(buildIssue(
                "Skills are not clearly separated",
                "A dedicated skills section helps ATS reading and recruiter scanning."
                , "No explicit skills heading or searchable skill list was detected.",
                "Skills section",
                "warning"
            ));
        }

        if (!normalizedResume.contains("education") && !normalizedResume.contains("btech") && !normalizedResume.contains("bachelor") && !normalizedResume.contains("degree")) {
            issues.add(buildIssue(
                "Education details are weak or missing",
                "A graduation or degree section is important for ATS compatibility and recruiter screening.",
                "No degree or education details were detected in the resume text.",
                "Education section",
                "warning"
            ));
        }

        if (originalResume != null && originalResume.length() < 150) {
            issues.add(buildIssue(
                "Resume is too short to be a strong ATS candidate profile",
                "The text is extremely brief, which makes it harder for ATS and recruiters to evaluate full qualifications.",
                originalResume.length() > 0 ? originalResume.substring(0, Math.min(originalResume.length(), 120)) : "No usable resume body detected.",
                "Resume completeness",
                "warning"
            ));
        }

        if (!normalizedResume.contains("@") && !normalizedResume.contains(".com") && !normalizedResume.contains("gmail") && !normalizedResume.contains("email")) {
            issues.add(buildIssue(
                "Contact information may be incomplete",
                "ATS parsing and recruiter follow-up depend on clearly visible contact data.",
                "No recognizable email or contact block was detected in the resume text.",
                "Contact details",
                "info"
            ));
        }

        if (issues.isEmpty()) {
            issues.add(buildIssue(
                "No major parsing issues detected",
                "The current resume structure is readable and consistent enough for ATS screening.",
                "The document contains usable, scan-friendly text.",
                "Overall resume quality",
                "info"
            ));
        }

        return issues;
    }

    private int calculateWeightedOverallScore(Map<String, Object> subScores) {
        Map<String, Integer> weights = new LinkedHashMap<>();
        weights.put("skillsMatch", 25);
        weights.put("experienceMatch", 20);
        weights.put("keywordMatch", 20);
        weights.put("projectRelevance", 15);
        weights.put("formattingScore", 10);
        weights.put("educationMatch", 10);

        int total = 0;
        for (Map.Entry<String, Integer> entry : weights.entrySet()) {
            Object rawValue = subScores != null ? subScores.get(entry.getKey()) : null;
            int value = rawValue instanceof Number ? ((Number) rawValue).intValue() : 0;
            total += Math.round((value * entry.getValue()) / 100.0f);
        }
        return Math.max(0, Math.min(100, total));
    }

    private Map<String, Object> buildScoreBreakdown(Map<String, Object> subScores) {
        Map<String, Object> breakdown = new LinkedHashMap<>();
        String[] categories = {"skillsMatch", "experienceMatch", "keywordMatch", "projectRelevance", "formattingScore", "educationMatch"};
        int[] weights = {25, 20, 20, 15, 10, 10};

        for (int i = 0; i < categories.length; i++) {
            String category = categories[i];
            Object rawValue = subScores != null ? subScores.get(category) : null;
            int value = rawValue instanceof Number ? ((Number) rawValue).intValue() : 0;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("score", value);
            item.put("weight", weights[i]);
            item.put("contribution", Math.round((value * weights[i]) / 100.0f));
            item.put("label", switch (category) {
                case "skillsMatch" -> "Skills evidence";
                case "experienceMatch" -> "Experience depth";
                case "keywordMatch" -> "Keyword coverage";
                case "projectRelevance" -> "Project relevance";
                case "formattingScore" -> "ATS formatting";
                case "educationMatch" -> "Education fit";
                default -> category;
            });
            breakdown.put(category, item);
        }
        return breakdown;
    }

    private List<Map<String, Object>> buildGeneralRecommendations(String normalizedResume, int matchedSkillCount, List<Map<String, Object>> issues) {
        List<Map<String, Object>> recommendations = new ArrayList<>();

        if (issues.stream().anyMatch(issue -> "Date format is inconsistent or invalid".equals(issue.get("title")))) {
            recommendations.add(buildRecommendation(1, "Fix date formatting", "Clean up inconsistent or invalid dates. Standardize to one format like Jun 2023 – Aug 2024.", "Experience timeline", "Use a single date format and confirm month-year consistency across all jobs."));
        }

        if (matchedSkillCount < 5) {
            recommendations.add(buildRecommendation(2, "Add richer technical evidence", "The resume should show more proven skill usage and project outcomes.", "Skills / projects", "Add concrete tools, technologies, and measurable business impact, such as improved API latency or reduced processing time."));
        }

        if (!normalizedResume.contains("experience") || !normalizedResume.contains("skills") || !normalizedResume.contains("education")) {
            recommendations.add(buildRecommendation(3, "Improve section clarity", "ATS and recruiters scan for consistent headings and readibility.", "Resume structure", "Use standard headings like Experience, Skills, Projects, and Education in a consistent order."));
        }

        if (recommendations.isEmpty()) {
            recommendations.add(buildRecommendation(1, "Quantify wins", "Your resume is structurally solid; strengthen it with measurable outcomes.", "Experience bullets", "Replace generic statements with impact-focused bullets that show scope, tools, and measurable outcomes."));
        }

        return recommendations;
    }

    private Map<String, Object> buildIssue(String title, String detail, String evidence, String section, String severity) {
        Map<String, Object> issue = new HashMap<>();
        issue.put("title", title);
        issue.put("detail", detail);
        issue.put("evidence", evidence == null || evidence.trim().isEmpty() ? "No direct evidence found in the parsed resume text." : evidence.trim());
        issue.put("section", section);
        issue.put("severity", severity);
        return issue;
    }

    private Map<String, Object> buildRecommendation(int priority, String title, String reason, String section, String action) {
        Map<String, Object> rec = new HashMap<>();
        rec.put("priority", priority);
        rec.put("title", title);
        rec.put("reason", reason);
        rec.put("section", section);
        rec.put("action", action);
        return rec;
    }

    private String extractDateEvidence(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "No resume date text was detected.";
        }

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?:\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|\\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s+\\d{4}\\b|\\b\\d{4}\\b)", java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(0);
        }
        return text.length() > 140 ? text.substring(0, 140) + "..." : text;
    }

    private int estimateGeneralFormattingScore(String normalizedResume, String originalResume) {
        int score = 35;
        if (normalizedResume.contains("@") && (normalizedResume.contains(".com") || normalizedResume.contains(".in") || normalizedResume.contains(".org") || normalizedResume.contains("gmail"))) score += 15;
        if (normalizedResume.contains("experience") || normalizedResume.contains("skills") || normalizedResume.contains("education") || normalizedResume.contains("projects")) score += 15;
        if (normalizedResume.contains("- ") || normalizedResume.contains("•") || normalizedResume.contains("*") || originalResume.contains("\n")) score += 15;
        if (normalizedResume.contains("btech") || normalizedResume.contains("bachelor") || normalizedResume.contains("degree")) score += 10;
        if (containsInvalidDateIssue(normalizedResume)) score = Math.max(0, score - 20);
        if (normalizedResume.length() < 150) score = Math.max(0, score - 10);
        return Math.min(100, score);
    }

    private int estimateGeneralEducationMatch(String normalizedResume) {
        boolean hasDegree = normalizedResume.contains("btech") || normalizedResume.contains("bachelor") || normalizedResume.contains("degree") || normalizedResume.contains("masters") || normalizedResume.contains("mca") || normalizedResume.contains("graduate");
        if (!hasDegree) return 35;
        return 78;
    }

    private int estimateGeneralExperienceMatch(String normalizedResume) {
        int score = 25;
        if (normalizedResume.contains("experience") || normalizedResume.contains("worked") || normalizedResume.contains("intern")) score += 25;
        if (normalizedResume.matches(".*(?:\\b(?:1|2|3|4|5|6|7|8|9|10)\\s*(?:years?|yrs?)\\b).*")) score += 20;
        if (normalizedResume.contains("project") || normalizedResume.contains("delivered") || normalizedResume.contains("implemented")) score += 15;
        if (normalizedResume.contains("team") || normalizedResume.contains("client") || normalizedResume.contains("production")) score += 10;
        return Math.min(100, score);
    }

    private int estimateGeneralProjectRelevance(String normalizedResume, Set<String> resumeWords) {
        boolean hasProjects = normalizedResume.contains("project") || normalizedResume.contains("portfolio") || normalizedResume.contains("capstone") || normalizedResume.contains("implementation");
        if (!hasProjects) return 35;

        int technicalSignal = 0;
        for (String keyword : Arrays.asList("java", "python", "sql", "react", "spring", "javascript", "aws", "docker", "mongodb", "api", "rest", "html", "css", "git")) {
            if (resumeWords.contains(keyword)) {
                technicalSignal++;
            }
        }

        if (technicalSignal >= 5) return 82;
        if (technicalSignal >= 3) return 70;
        if (technicalSignal >= 1) return 56;
        return 45;
    }

    private String findEvidenceSnippet(String text, String keyword) {
        if (text == null || text.trim().isEmpty()) {
            return "No resume evidence found.";
        }

        String lowerText = text.toLowerCase(Locale.ROOT);
        if (keyword == null || keyword.trim().isEmpty()) {
            return text.length() > 140 ? text.substring(0, 140) + "..." : text;
        }

        String lowerKeyword = keyword.toLowerCase(Locale.ROOT);
        int index = lowerText.indexOf(lowerKeyword);
        if (index >= 0) {
            int start = Math.max(0, index - 40);
            int end = Math.min(text.length(), index + keyword.length() + 80);
            String snippet = text.substring(start, end).trim();
            return snippet.length() > 180 ? snippet.substring(0, 180) + "..." : snippet;
        }

        String[] parts = text.split("(?<=[.!?])\\s+");
        for (String part : parts) {
            if (part.toLowerCase(Locale.ROOT).contains(lowerKeyword) || part.length() > 40 && part.contains(keyword.substring(0, Math.min(keyword.length(), 5)))) {
                return part.trim();
            }
        }
        return text.length() > 140 ? text.substring(0, 140) + "..." : text;
    }

    private Job getMockJobById(String id) {
        Job j = new Job();
        j.setId(id);
        j.setTitle("Java Full Stack Developer");
        j.setCompany("Infosys");
        j.setCompanyLogo("I");
        j.setLocation("Pune");
        j.setDescription("We are looking for a Java Full Stack Developer with experience in Spring Boot and React.");
        j.setExperienceLevel("1-3 years");
        j.setJobType("Full-time");
        j.setCategory("Development");
        j.setSkills("Java, Spring Boot, React, JavaScript, SQL");
        j.setSalary("₹ 5,00,000 - ₹ 8,00,000 P.A.");
        j.setApplyLink("https://infosys.com/careers");
        j.setRole("Full Stack Developer");
        j.setCompanyType("IT Services");
        j.setPassoutYear("2023, 2024");
        j.setIsDeleted(false);

        if ("mock-2".equals(id)) {
            j.setTitle("Junior Java Developer");
            j.setCompany("Rezo.ai");
            j.setSkills("Java, Spring Boot, Rest API, Hibernate");
            j.setDescription("Join our AI team to build robust backend systems using Java and Spring Boot.");
        } else if ("mock-3".equals(id)) {
            j.setTitle("Python Intern");
            j.setCompany("Executive Softway");
            j.setSkills("Python, Django, HTML, CSS, Databases");
            j.setDescription("Great opportunity for engineering freshers to work on real-world Python and Django projects.");
        } else if ("mock-4".equals(id)) {
            j.setTitle("Computer Operator");
            j.setCompany("Hemanth Kumar Proprietor");
            j.setSkills("MS Office, Excel, Data Entry, English Typing");
            j.setDescription("Looking for a skilled computer operator for data entry, office administration, and document management.");
        } else if ("mock-5".equals(id)) {
            j.setTitle("Frontend Developer");
            j.setCompany("TechCorp");
            j.setSkills("React, JavaScript, HTML5, CSS3, Tailwind");
            j.setDescription("Looking for a passionate frontend developer proficient in React and modern CSS styling.");
        } else if ("mock-6".equals(id)) {
            j.setTitle("Backend Developer");
            j.setCompany("CloudTech");
            j.setSkills("Java, Spring Boot, AWS, Docker, MongoDB");
            j.setDescription("Build high-performance REST APIs and microservices on AWS cloud databases.");
        } else if ("mock-7".equals(id)) {
            j.setTitle("Data Analyst");
            j.setCompany("Analytics Pro");
            j.setSkills("Python, SQL, Tableau, Power BI, Excel");
            j.setDescription("Translate raw business data into actionable marketing insights and visualization dashboards.");
        } else if ("mock-8".equals(id)) {
            j.setTitle("UI/UX Designer");
            j.setCompany("Design Studio");
            j.setSkills("Figma, Adobe XD, Wireframing, UX Research");
            j.setDescription("Shape beautiful, modern product layouts and mockups inside Figma.");
        }
        return j;
    }
}
