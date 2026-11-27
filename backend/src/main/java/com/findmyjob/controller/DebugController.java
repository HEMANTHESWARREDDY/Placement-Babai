package com.findmyjob.controller;

import com.findmyjob.repository.MentorRepository;
import com.findmyjob.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private JobRepository jobRepository;

    @Value("${spring.data.mongodb.uri:NOT_SET}")
    private String mongoUri;

    @GetMapping("/mongo")
    public Map<String, Object> mongoCheck() {
        Map<String, Object> result = new LinkedHashMap<>();

        // Show what URI Spring Boot is actually using (mask password)
        String maskedUri = mongoUri.replaceAll(":[^:@]+@", ":****@");
        result.put("configured_uri", maskedUri);

        // Test mentors collection
        try {
            long mentorCount = mentorRepository.count();
            result.put("mentors_count", mentorCount);
            result.put("mentors_status", "✅ CONNECTED");
        } catch (Exception e) {
            result.put("mentors_status", "❌ FAILED");
            result.put("mentors_error", e.getMessage());
            result.put("mentors_error_type", e.getClass().getSimpleName());
        }

        // Test jobs collection
        try {
            long jobCount = jobRepository.count();
            result.put("jobs_count", jobCount);
            result.put("jobs_status", "✅ CONNECTED");
        } catch (Exception e) {
            result.put("jobs_status", "❌ FAILED");
            result.put("jobs_error", e.getMessage());
            result.put("jobs_error_type", e.getClass().getSimpleName());
        }

        return result;
    }
}
