package com.findmyjob;

import com.findmyjob.service.AtsService;
import org.junit.jupiter.api.Test;
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
        assertTrue(overallScore < 20, "Score should be heavily penalized for fake JD details");
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
        assertTrue(eduScore == 55, "ECE candidate should get 55% mismatch score for a CSE job");
    }
}
