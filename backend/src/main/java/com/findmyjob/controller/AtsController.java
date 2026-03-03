package com.findmyjob.controller;

import com.findmyjob.service.AtsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class AtsController {

    private final AtsService atsService;

    public AtsController(AtsService atsService) {
        this.atsService = atsService;
    }

    @PostMapping("/{id}/ats-check")
    public ResponseEntity<?> checkAtsScore(@PathVariable Long id, @RequestParam("resume") MultipartFile resume) {
        System.out.println("====== checkAtsScore hit for job " + id + " ======");
        try {
            int score = atsService.calculateAtsScore(id, resume);
            Map<String, Object> response = new HashMap<>();
            response.put("score", score);
            response.put("message", getMessageForScore(score));
            return ResponseEntity.ok(response);
        } catch (Throwable e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to parse document: " + e.toString()));
        }
    }

    private String getMessageForScore(int score) {
        if (score >= 80)
            return "Excellent Match! Your profile closely aligns with this role.";
        if (score >= 60)
            return "Good Match! You meet a solid amount of the requirements.";
        if (score >= 40)
            return "Fair Match! Consider highlighting relevant skills if you have them.";
        return "Low Match! This role might require different experience or skills.";
    }
}
