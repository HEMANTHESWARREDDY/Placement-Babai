package com.findmyjob.service;

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
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class AtsService {

    private final JobRepository jobRepository;

    public AtsService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    public int calculateAtsScore(Long jobId, MultipartFile file) throws Exception {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));

        String resumeText = extractText(file).toLowerCase();

        // Build keywords from job
        Set<String> keywords = new HashSet<>();

        if (job.getSkills() != null) {
            Arrays.stream(job.getSkills().split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .forEach(keywords::add);
        }

        if (job.getRole() != null)
            keywords.add(job.getRole().toLowerCase());
        if (job.getPassoutYear() != null && !job.getPassoutYear().equalsIgnoreCase("Other")) {
            keywords.add(job.getPassoutYear().toLowerCase());
        }
        if (job.getExperienceLevel() != null) {
            if (job.getExperienceLevel().toLowerCase().contains("fresh")) {
                keywords.add("fresher");
                keywords.add("graduate");
            } else {
                keywords.add(job.getExperienceLevel().toLowerCase());
            }
        }

        // Additional keywords from job description using regex to find words >= 5 chars
        if (job.getDescription() != null) {
            Pattern pattern = Pattern.compile("\\b[a-zA-Z]{5,}\\b");
            java.util.regex.Matcher matcher = pattern.matcher(job.getDescription());
            int count = 0;
            while (matcher.find() && count < 25) { // Limit to 25 important words from desc
                String word = matcher.group().toLowerCase();
                // ignore common words
                if (!Arrays.asList("their", "there", "about", "which", "would", "these", "those").contains(word)) {
                    keywords.add(word);
                    count++;
                }
            }
        }

        if (keywords.isEmpty())
            return 50; // default medium score if no keywords

        int matchCount = 0;
        for (String keyword : keywords) {
            if (resumeText.contains(keyword)) {
                matchCount++;
            }
        }

        double percentage = ((double) matchCount / keywords.size()) * 100;

        // base score + percentage, max 99 (never strictly 100 for ATS realism)
        int finalScore = (int) Math.min(99, 40 + (percentage * 0.6));
        return finalScore;
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
