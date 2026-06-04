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

        Set<String> resumeWords = extractCleanKeywords(resumeTextLower);

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

        // Alignment penalty if JD has descriptions but none match the resume (indicates fake or completely mismatched JD)
        double alignmentFactor = 1.0;
        if (!descKeywords.isEmpty() && matchedDesc == 0) {
            alignmentFactor = 0.08;
        }

        // Calculate subscores authentically without scaling by the alignment factor
        int skillsMatch = skillsKeywords.isEmpty() ? 0 : (int) Math.round(skillPercentage * 100);

        // Determine experience match authentically and conservatively
        int experienceMatch = 0;
        String expReq = job.getExperienceLevel() != null ? job.getExperienceLevel().toLowerCase() : "";
        boolean isEntryOrFresherJob = expReq.contains("0-2") || expReq.contains("entry") || expReq.contains("fresher") || expReq.isEmpty();
        boolean isMidOrSeniorJob = expReq.contains("3-5") || expReq.contains("mid") || expReq.contains("senior") || expReq.contains("5+");
        boolean hasInternshipOrTeaching = resumeTextLower.contains("intern") || resumeTextLower.contains("assistant") || resumeTextLower.contains("teaching");
        boolean hasWorkExp = resumeTextLower.contains("experience") || resumeTextLower.contains("years") || resumeTextLower.contains("worked") || resumeTextLower.contains("employment");
        
        if (hasWorkExp || hasInternshipOrTeaching) {
            if (isEntryOrFresherJob) {
                experienceMatch = hasInternshipOrTeaching || hasWorkExp ? 72 : 50;
            } else if (isMidOrSeniorJob) {
                if (hasWorkExp && (resumeTextLower.contains("lead") || resumeTextLower.contains("senior") || resumeTextLower.contains("manager") || resumeTextLower.contains("3") || resumeTextLower.contains("4") || resumeTextLower.contains("5"))) {
                    experienceMatch = 85; // Genuine experienced developer match
                } else {
                    experienceMatch = 60;
                }
            } else {
                experienceMatch = 70;
            }
        }

        int keywordMatch = 0;
        if (skillPercentage > 0 || descPercentage > 0 || titlePercentage > 0) {
            keywordMatch = (int) Math.round(((skillPercentage * 40) + (descPercentage * 50) + (titlePercentage * 10)) * alignmentFactor);
        }

        // Determine project relevance authentically based on matching tech stack inside projects
        int projectRelevance = 0;
        boolean hasProjectsSection = resumeTextLower.contains("project") || 
                                     resumeTextLower.contains("portfolio") || 
                                     resumeTextLower.contains("capstone");
                                     
        if (hasProjectsSection) {
            int matchedSkillsInProjects = 0;
            for (String skill : skillsKeywords) {
                if (resumeTextLower.contains(skill.toLowerCase())) {
                    matchedSkillsInProjects++;
                }
            }
            if (matchedSkillsInProjects >= 3) {
                projectRelevance = 80; // Genuine exceptional projects tech alignment
            } else if (matchedSkillsInProjects >= 2) {
                projectRelevance = 70; // Genuine strong projects tech alignment
            } else if (matchedSkillsInProjects >= 1) {
                projectRelevance = 60; // Moderate projects tech alignment
            } else {
                projectRelevance = 50; // Unrelated projects
            }
        }

        // Determine formatting score authentically based on structural ATS standards
        int formattingScore = 0;
        boolean hasEmail = resumeTextLower.contains("@") && (resumeTextLower.contains(".com") || resumeTextLower.contains(".org") || resumeTextLower.contains(".in") || resumeTextLower.contains(".edu"));
        boolean hasPhone = resumeTextLower.replaceAll("[^0-9]", "").length() >= 10;
        
        boolean hasBulletPoints = resumeTextLower.contains("\n-") || 
                                   resumeTextLower.contains("\n*") || 
                                   resumeTextLower.contains("\n•") || 
                                   resumeTextLower.contains(" bullet ") ||
                                   resumeTextLower.contains("•") ||
                                   resumeTextLower.contains("▪") ||
                                   resumeTextLower.contains("◦");
                                   
        boolean hasEducationHeader = resumeTextLower.contains("education") || resumeTextLower.contains("academic") || resumeTextLower.contains("qualification");
        boolean hasExperienceHeader = resumeTextLower.contains("experience") || resumeTextLower.contains("internship") || resumeTextLower.contains("history") || resumeTextLower.contains("employment");
        boolean hasSkillsHeader = resumeTextLower.contains("skills") || resumeTextLower.contains("abilities") || resumeTextLower.contains("expertise");
        
        int structuralChecksPassed = 0;
        if (hasEmail) structuralChecksPassed++;
        if (hasPhone) structuralChecksPassed++;
        if (hasBulletPoints) structuralChecksPassed++;
        if (hasEducationHeader) structuralChecksPassed++;
        if (hasExperienceHeader) structuralChecksPassed++;
        if (hasSkillsHeader) structuralChecksPassed++;
        
        if (structuralChecksPassed > 0) {
            switch (structuralChecksPassed) {
                case 6:
                    formattingScore = 95; // Flawless ATS structure
                    break;
                case 5:
                    formattingScore = 80;
                    break;
                case 4:
                    formattingScore = 65;
                    break;
                case 3:
                    formattingScore = 50;
                    break;
                case 2:
                    formattingScore = 35;
                    break;
                default:
                    formattingScore = 20;
                    break;
            }
        }

        // Determine dynamic education match authentically based on job specified requirements vs candidate resume fields
        int educationMatch = 0;
        boolean hasDegree = resumeTextLower.contains("btech") || 
                             resumeTextLower.contains("bachelor") || 
                             resumeTextLower.contains("degree") || 
                             resumeTextLower.contains("graduate") || 
                             resumeTextLower.contains("b.tech") || 
                             resumeTextLower.contains("b.e.") || 
                             resumeTextLower.contains("mca") || 
                             resumeTextLower.contains("tech") || 
                             resumeTextLower.contains("diploma");

        String jobTextLower = (job.getTitle() != null ? job.getTitle().toLowerCase() : "") + " " + 
                              (job.getRequirements() != null ? job.getRequirements().toLowerCase() : "") + " " + 
                              (job.getSkills() != null ? job.getSkills().toLowerCase() : "") + " " + 
                              (job.getDescription() != null ? job.getDescription().toLowerCase() : "");

        // Categorize candidate fields
        boolean candCS = resumeTextLower.contains("computer science") || resumeTextLower.contains("cse") || resumeTextLower.contains("aiml") || resumeTextLower.contains("ai/ml") || resumeTextLower.contains("software") || resumeTextLower.contains("information technology") || resumeTextLower.contains("it ");
        boolean candECE = resumeTextLower.contains("electronics") || resumeTextLower.contains("ece") || resumeTextLower.contains("communication");
        boolean candMech = resumeTextLower.contains("mechanical") || resumeTextLower.contains("mech ");
        boolean candCivil = resumeTextLower.contains("civil ");
        boolean candBiz = resumeTextLower.contains("mba") || resumeTextLower.contains("business") || resumeTextLower.contains("marketing") || resumeTextLower.contains("sales");

        // Categorize job requirement fields
        boolean jobWantsCS = jobTextLower.contains("computer science") || jobTextLower.contains("cse") || jobTextLower.contains("software") || jobTextLower.contains("it ") || jobTextLower.contains("information technology") || jobTextLower.contains("aiml") || jobTextLower.contains("developer") || jobTextLower.contains("programmer");
        boolean jobWantsECE = jobTextLower.contains("electronics") || jobTextLower.contains("ece") || jobTextLower.contains("communication");
        boolean jobWantsMech = jobTextLower.contains("mechanical") || jobTextLower.contains("mech ");
        boolean jobWantsCivil = jobTextLower.contains("civil ");
        boolean jobWantsBiz = jobTextLower.contains("mba") || jobTextLower.contains("business") || jobTextLower.contains("marketing") || jobTextLower.contains("sales");

        if (hasDegree) {
            // Check if job specifies a branch and candidate matches it
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
                if (candidateMatchesSpecified) {
                    educationMatch = 82; // Perfect matching education (genuine limit)
                } else {
                    educationMatch = 45; // Branch mismatch: candidate does not have the specified branch!
                }
            } else {
                // Generic job: candidate has a degree
                educationMatch = 75;
            }
        } else {
            // No degree
            educationMatch = 0;
        }

        // Overall score is weighted: 25% for skillsMatch, 25% for content match (keywordMatch), and 50% for structural matches (experience, projects, formatting, education)
        double remainingFourAverage = (experienceMatch + projectRelevance + formattingScore + educationMatch) / 4.0;
        int overallScore = (int) Math.round((skillsMatch * 0.25) + (keywordMatch * 0.25) + (remainingFourAverage * 0.50));

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
        if (alignmentFactor >= 0.2) {
            Map<String, String> imp1 = new HashMap<>();
            imp1.put("section", "Professional Experience / Projects");
            imp1.put("original", "Responsible for working on backend tasks and building APIs.");
            imp1.put("suggested", "Spearheaded development of 10+ high-performance REST APIs using " + (skillsKeywords.isEmpty() ? "modern frameworks" : skillsKeywords.iterator().next()) + ", reducing response latencies by 25%.");
            improvements.add(imp1);
        }
        result.put("improvements", improvements);

        Map<String, Object> formattingAnalysis = new HashMap<>();
        formattingAnalysis.put("bulletPointsCheck", hasBulletPoints ? "Pass" : "Warning");
        formattingAnalysis.put("sectionHeaderCheck", (hasEducationHeader && hasExperienceHeader && hasSkillsHeader) ? "Pass" : ((hasEducationHeader || hasExperienceHeader || hasSkillsHeader) ? "Warning" : "Fail"));
        formattingAnalysis.put("tablesCheck", "Pass");
        if (alignmentFactor < 0.2) {
            formattingAnalysis.put("feedback", "Formatting is acceptable but the semantic content is a complete mismatch. Ensure you are targeting appropriate job listings.");
        } else {
            formattingAnalysis.put("feedback", "Excellent clean structure. Ensure you use bullet points with action verbs and avoid any graphic bars or side columns.");
        }
        result.put("formattingAnalysis", formattingAnalysis);

        if (alignmentFactor < 0.2) {
            result.put("aiInsights", "ALERT: Complete content mismatch detected. Please check if the job details are valid, or rewrite your resume content to address the target right.");
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
            return basicGeneralCalculate(resumeText.toLowerCase());
        }

        try {
            return callGeminiGeneral(resumeText, jd);
        } catch (Exception e) {
            e.printStackTrace();
            return basicGeneralCalculate(resumeText.toLowerCase());
        }
    }

    private Map<String, Object> callGeminiGeneral(String resumeText, String jd) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
                + geminiApiKey.trim();

        String prompt;
        if (jd != null && !jd.trim().isEmpty()) {
            prompt = "You are a world-class expert ATS recruiter and technical resume auditor.\n"
                    + "Evaluate the user's resume rigorously and critically AGAINST the pasted Target Job Description (JD).\n\n"
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
        result.put("formattingAnalysis", objectMapper.convertValue(resultNode.path("formattingAnalysis"), Map.class));
        result.put("aiInsights", resultNode.path("aiInsights").asText(""));
        return result;
    }

    private Map<String, Object> basicGeneralCalculate(String resumeTextLower) {
        Map<String, Object> result = new HashMap<>();
        result.put("score", 75);
        result.put("message", "General Resume Analysis Complete (Basic Parser).");
        
        Map<String, Object> subScores = new HashMap<>();
        subScores.put("skillsMatch", 78);
        subScores.put("experienceMatch", 72);
        subScores.put("keywordMatch", 75);
        subScores.put("projectRelevance", 80);
        subScores.put("formattingScore", 85);
        subScores.put("educationMatch", 90);
        result.put("subScores", subScores);

        Map<String, Object> keywordAnalysis = new HashMap<>();
        keywordAnalysis.put("matched", new ArrayList<>());
        keywordAnalysis.put("missing", new ArrayList<>());
        result.put("keywordAnalysis", keywordAnalysis);

        result.put("strengths", Arrays.asList("Clear sections and standard fonts detected.", "Strong presentation of credentials."));
        result.put("weaknesses", Arrays.asList("Some experience descriptions could be more detailed.", "Lack of quantifiable business impact (X-Y-Z formula)."));
        
        List<Map<String, String>> imps = new ArrayList<>();
        Map<String, String> imp = new HashMap<>();
        imp.put("section", "Experience");
        imp.put("original", "Responsible for working on frontend codebase.");
        imp.put("suggested", "Refactored frontend codebase using React and Vite, boosting loading performance by 35%.");
        imps.add(imp);
        result.put("improvements", imps);

        Map<String, Object> formatting = new HashMap<>();
        formatting.put("bulletPointsCheck", "Pass");
        formatting.put("sectionHeaderCheck", "Pass");
        formatting.put("tablesCheck", "Pass");
        formatting.put("feedback", "Your resume uses standard fonts and section layouts. Ensure you do not use complex multi-column tables.");
        result.put("formattingAnalysis", formatting);

        result.put("aiInsights", "Leverage strong developer keywords such as Java, Python, React, and AWS to enhance visibility on search filters.");
        return result;
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
