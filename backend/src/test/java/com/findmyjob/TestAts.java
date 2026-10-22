package com.findmyjob;

import com.findmyjob.service.AtsService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class TestAts {

    @Test
    public void testBasicCalculatePenalty() throws Exception {
        System.out.println("Starting AtsService local fallback test...");
        AtsService atsService = new AtsService(null);

        // Mock job details with the user's fake/gibberish values
        com.findmyjob.model.Job fakeJob = new com.findmyjob.model.Job();
        fakeJob.setId("test-job-id");
        fakeJob.setTitle("DSE & SP");
        fakeJob.setCompany("Infosys");
        fakeJob.setSkills("Java, Python, C++, Data Structures, Algorithms, SQL, Problem Solving, Communication Skills");
        fakeJob.setDescription("hjLHA:XHSCAjc[sdhl;br.el;\"dlermemrjenvmngljg;lew.lgm.enger");
        fakeJob.setResponsibilities("ge.ng.eng.emg/lermgl/merl/ghmermhbrem hb erb wgl;ejg;lwjg;lw;lgw wjg;wgewg");
        fakeJob.setRequirements("wgl;ejg;lwjg;lw;lgw wjg;wgewg");

        // The user's exact resume text
        String resumeText = "MOILLAHEMANTHESWARREDDY\n" +
                "Guntur, Andhra Pradesh, India\n" +
                "7095259880\n" +
                "hemanth14082004@gmail.com\n" +
                "Computer Science graduate specializing in Artificial Intelligence and Machine Learning...\n" +
                "Skills: Programming Languages: Python, SQL, Java. Coursework: DSA, DBMS, Operating Systems, Machine Learning.\n" +
                "Projects: Student Learning Analytics Pipeline | Python, Pandas, SQL, MySQL, AWS";

        java.lang.reflect.Method method = AtsService.class.getDeclaredMethod("basicCalculate",
                com.findmyjob.model.Job.class, String.class);
        method.setAccessible(true);
        java.util.Map<String, Object> result = (java.util.Map<String, Object>) method.invoke(atsService, fakeJob, resumeText.toLowerCase());
        
        System.out.println("====== BASIC CALCULATE TEST RESULT ======");
        System.out.println("Overall Score: " + result.get("score"));
        System.out.println("Message: " + result.get("message"));
        System.out.println("Subscores: " + result.get("subScores"));
        System.out.println("=========================================");
        
        int overallScore = (Integer) result.get("score");
        assertTrue(overallScore > 40 && overallScore < 80, "Overall score should be the unpenalized authentic average of subscores");
    }

    @Test
    public void testEceMismatch() throws Exception {
        System.out.println("Starting AtsService ECE branch mismatch test...");
        AtsService atsService = new AtsService(null);

        // Mock software job requiring CSE
        com.findmyjob.model.Job softwareJob = new com.findmyjob.model.Job();
        softwareJob.setId("test-job-id");
        softwareJob.setTitle("Software Engineer - CSE");
        softwareJob.setCompany("TechCorp");
        softwareJob.setSkills("Java, Spring Boot");

        // Resume of an ECE (Electronics & Communication Engineering) candidate
        String eceResume = "John Doe\n" +
                "B.Tech in Electronics and Communication Engineering (ECE)\n" +
                "Project in IoT and VLSI";

        java.lang.reflect.Method method = AtsService.class.getDeclaredMethod("basicCalculate",
                com.findmyjob.model.Job.class, String.class);
        method.setAccessible(true);
        java.util.Map<String, Object> result = (java.util.Map<String, Object>) method.invoke(atsService, softwareJob, eceResume.toLowerCase());

        System.out.println("====== ECE MISMATCH TEST RESULT ======");
        System.out.println("Subscores: " + result.get("subScores"));
        System.out.println("======================================");

        java.util.Map<String, Object> subScores = (java.util.Map<String, Object>) result.get("subScores");
        int eduScore = (Integer) subScores.get("educationMatch");
        assertTrue(eduScore == 45, "ECE candidate should get 45% mismatch score for a CSE job");
    }

    @Test
    public void testTargetedFallbackUsesActualJobDescription() throws Exception {
        AtsService atsService = new AtsService(null);
        String resumeText = "Senior software engineer with 4 years in Java, Spring Boot, REST APIs, SQL, React, and microservices. " +
                "Built backend systems with AWS, Docker, CI/CD, and PostgreSQL. " +
                "Bachelor of Technology in Computer Science.";
        String jd = "We are hiring a Senior Java Developer with Java, Spring Boot, REST APIs, SQL, PostgreSQL, AWS, Docker, and microservices experience. " +
                "Candidates should have strong backend engineering, CI/CD, and API design skills.";

        MockMultipartFile resume = new MockMultipartFile("resume", "resume.txt", "text/plain", resumeText.getBytes());
        java.util.Map<String, Object> result = atsService.calculateGeneralAtsScore(resume, jd);

        assertTrue((Integer) result.get("score") >= 60, "Targeted match should score well when the resume matches the JD.");
        java.util.Map<?, ?> keywordAnalysis = (java.util.Map<?, ?>) result.get("keywordAnalysis");
        assertTrue(keywordAnalysis != null && !keywordAnalysis.isEmpty(), "Targeted fallback should include keyword comparison data.");
        assertTrue(((java.util.List<?>) keywordAnalysis.get("matched")).size() > 0,
                "Targeted fallback should identify matching keywords from the actual JD.");
    }

    @Test
    public void testGeneralAtsUsesOptionalSuggestionsAndEvidence() throws Exception {
        AtsService atsService = new AtsService(null);
        String resumeText = "Professional summary: Java backend engineer with 2 years of experience in Spring Boot and REST APIs. " +
                "Built customer workflows with MySQL, AWS, and microservices. " +
                "Bachelor of Technology in Computer Science. " +
                "Experience: Senior Java Developer, 2022-2024. " +
                "Skills: Java, Spring Boot, REST APIs, SQL, AWS, Git.";

        MockMultipartFile resume = new MockMultipartFile("resume", "resume.txt", "text/plain", resumeText.getBytes());
        java.util.Map<String, Object> result = atsService.calculateGeneralAtsScore(resume, null);

        java.util.Map<?, ?> keywordAnalysis = (java.util.Map<?, ?>) result.get("keywordAnalysis");
        assertTrue(keywordAnalysis != null, "General ATS should surface keyword analysis metadata.");

        java.util.List<?> missing = (java.util.List<?>) keywordAnalysis.get("missing");
        assertTrue(missing != null && !missing.isEmpty(), "General ATS should provide optional skill suggestions.");
        java.util.Map<?, ?> firstMissing = (java.util.Map<?, ?>) missing.get(0);
        assertTrue(Boolean.TRUE.equals(firstMissing.get("optional")), "Generic suggestions must be labeled as optional, not required job gaps.");

        java.util.List<?> issues = (java.util.List<?>) result.get("issues");
        assertTrue(issues != null && !issues.isEmpty(), "General ATS should show evidence-based issue details from the resume.");
    }

    @Test
    public void testGeneralAtsProvidesTransparentBreakdownAndVerifiedFormattingEvidence() throws Exception {
        AtsService atsService = new AtsService(null);
        String resumeText = "John Smith\n" +
                "Email: john@example.com\n" +
                "Skills: Java, Spring Boot, SQL, Git\n" +
                "Experience\n" +
                "Senior Java Developer | 2022-2024\n" +
                "Built APIs and improved system reliability.\n" +
                "Education\n" +
                "B.Tech in Computer Science\n";

        MockMultipartFile resume = new MockMultipartFile("resume", "resume.txt", "text/plain", resumeText.getBytes());
        java.util.Map<String, Object> result = atsService.calculateGeneralAtsScore(resume, null);

        assertTrue(result.containsKey("scoreBreakdown"), "General ATS should explain how each contribution affects the score.");
        java.util.Map<?, ?> formatting = (java.util.Map<?, ?>) result.get("formattingAnalysis");
        assertTrue(formatting != null && formatting.containsKey("verifiedIssues"), "Formatting analysis should separate verified parsing issues from potential risks.");
        java.util.List<?> issues = (java.util.List<?>) result.get("issues");
        assertTrue(issues != null && !issues.isEmpty(), "General ATS should return concrete issues with evidence snippets.");
    }

    @Test
    public void testPresentDateIsNotFlaggedAsFuture() throws Exception {
        AtsService atsService = new AtsService(null);
        java.lang.reflect.Method method = AtsService.class.getDeclaredMethod("containsInvalidDateIssue", String.class);
        method.setAccessible(true);

        String resumeText = "Senior Java Developer | Sep 2025 – Present\n" +
                "Built REST APIs and migrated services to cloud infrastructure.";

        boolean hasIssue = (boolean) method.invoke(atsService, resumeText.toLowerCase());
        assertTrue(!hasIssue, "Present dates must be treated as ongoing and not future-dated in the current month/year.");
    }

    @Test
    public void testScoreBreakdownContributesToOverallScore() throws Exception {
        AtsService atsService = new AtsService(null);
        String resumeText = "John Smith\n" +
                "Senior Java Developer | Sep 2025 – Present\n" +
                "Skills: Java, Spring Boot, SQL, AWS, Git\n" +
                "Experience: 4 years in backend engineering\n" +
                "Education: B.Tech in Computer Science";

        MockMultipartFile resume = new MockMultipartFile("resume", "resume.txt", "text/plain", resumeText.getBytes());
        java.util.Map<String, Object> result = atsService.calculateGeneralAtsScore(resume, null);

        java.util.Map<?, ?> breakdown = (java.util.Map<?, ?>) result.get("scoreBreakdown");
        assertTrue(breakdown != null && !breakdown.isEmpty(), "General ATS should include category-level score details.");

        int totalContribution = 0;
        for (Object value : breakdown.values()) {
            java.util.Map<?, ?> item = (java.util.Map<?, ?>) value;
            totalContribution += ((Number) item.get("contribution")).intValue();
        }

        int overall = ((Number) result.get("score")).intValue();
        assertTrue(totalContribution == overall, "Weighted category contributions must add up to the overall ATS score.");
    }

    @Test
    public void testExtractedPdfTextValidationAvoidsFalseFormattingWarnings() throws Exception {
        AtsService atsService = new AtsService(null);
        java.lang.reflect.Method method = AtsService.class.getDeclaredMethod("extractText", org.springframework.web.multipart.MultipartFile.class);
        method.setAccessible(true);

        org.apache.pdfbox.pdmodel.PDDocument pdf = new org.apache.pdfbox.pdmodel.PDDocument();
        org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage();
        pdf.addPage(page);
        try (org.apache.pdfbox.pdmodel.PDPageContentStream contentStream = new org.apache.pdfbox.pdmodel.PDPageContentStream(pdf, page)) {
            contentStream.beginText();
            contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(50, 700);
            contentStream.showText("Senior Java Developer | Sep 2025 – Present");
            contentStream.endText();
        }

        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        pdf.save(baos);
        pdf.close();

        MockMultipartFile file = new MockMultipartFile("resume", "resume.pdf", "application/pdf", baos.toByteArray());
        String extracted = (String) method.invoke(atsService, file);

        assertTrue(extracted != null && extracted.toLowerCase().contains("senior java developer"), "PDF extraction must preserve actual resume content for validation.");
        assertTrue(!extracted.contains("�"), "Extracted PDF text should not contain replacement-character noise before warnings are raised.");
    }

    @Test
    public void testDifferentResumesDoNotProduceSameAtsScore() throws Exception {
        AtsService atsService = new AtsService(null);

        String strongResume = "John Smith\n" +
                "Senior Java Developer | 4 years experience\n" +
                "Skills: Java, Spring Boot, REST APIs, PostgreSQL, AWS, Docker, Git\n" +
                "Experience: Built resilient backend services, reduced latency by 40%, collaborated with product teams.\n" +
                "Education: B.Tech in Computer Science\n";

        String weakResume = "Jane Doe\n" +
                "Skills: Communication, teamwork\n" +
                "Experience: Worked on tasks.\n" +
                "Education: Diploma\n";

        MockMultipartFile strongFile = new MockMultipartFile("resume", "strong.txt", "text/plain", strongResume.getBytes());
        MockMultipartFile weakFile = new MockMultipartFile("resume", "weak.txt", "text/plain", weakResume.getBytes());

        int strongScore = (Integer) atsService.calculateGeneralAtsScore(strongFile, null).get("score");
        int weakScore = (Integer) atsService.calculateGeneralAtsScore(weakFile, null).get("score");

        assertTrue(strongScore != weakScore, "Different resumes should produce different ATS scores based on evidence in the uploaded text.");
        assertTrue(strongScore > weakScore, "A stronger resume with concrete technical evidence should score higher.");
    }
}
