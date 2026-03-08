package com.findmyjob.controller;

import com.findmyjob.model.Job;
import com.findmyjob.service.JobService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.findmyjob.service.JobParserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000" })
public class JobController {

    @Autowired
    private JobService jobService;

    @Autowired
    private JobParserService jobParserService;

    @GetMapping
    public ResponseEntity<List<Job>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJobById(@PathVariable Long id) {
        return jobService.getJobById(id)
                .filter(job -> !Boolean.TRUE.equals(job.getIsDeleted()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/extract")
    public ResponseEntity<Job> extractJobFromUrl(@RequestBody Map<String, String> payload) {
        String url = payload.get("url");
        if (url == null || url.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Job extractedJob = jobParserService.extractJobFromUrl(url.trim());
        return ResponseEntity.ok(extractedJob);
    }

    @GetMapping("/gemini-status")
    public ResponseEntity<Map<String, Object>> geminiStatus() {
        Map<String, Object> status = new java.util.HashMap<>();
        status.put("geminiConfigured", jobParserService.isGeminiConfigured());
        status.put("message", jobParserService.isGeminiConfigured()
                ? "Gemini API key is active and ready"
                : "Gemini API key is NOT configured - set GEMINI_API_KEY environment variable");
        return ResponseEntity.ok(status);
    }

    @PostMapping
    public ResponseEntity<Job> createJob(@Valid @RequestBody Job job) {
        Job createdJob = jobService.createJob(job);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdJob);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Job> updateJob(@PathVariable Long id, @Valid @RequestBody Job job) {
        try {
            Job updatedJob = jobService.updateJob(id, job);
            return ResponseEntity.ok(updatedJob);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Job>> searchJobs(@RequestParam String keyword) {
        return ResponseEntity.ok(jobService.searchJobs(keyword));
    }

    @GetMapping("/location")
    public ResponseEntity<List<Job>> searchByLocation(@RequestParam String location) {
        return ResponseEntity.ok(jobService.searchByLocation(location));
    }

    @GetMapping("/deleted")
    public ResponseEntity<List<Job>> getDeletedJobs() {
        return ResponseEntity.ok(jobService.getDeletedJobs());
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<Void> restoreJob(@PathVariable Long id) {
        try {
            jobService.restoreJob(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
