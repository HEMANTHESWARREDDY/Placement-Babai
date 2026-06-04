package com.findmyjob.controller;

import com.findmyjob.service.AtsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class AtsController {

    private final AtsService atsService;

    public AtsController(AtsService atsService) {
        this.atsService = atsService;
    }

    @PostMapping("/{id}/ats-check")
    public ResponseEntity<?> checkAtsScore(@PathVariable String id, @RequestParam("resume") MultipartFile resume) {
        System.out.println("====== checkAtsScore hit for job " + id + " ======");
        try {
            Map<String, Object> response = atsService.calculateAtsScore(id, resume);
            return ResponseEntity.ok(response);
        } catch (Throwable e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to parse document: " + e.toString()));
        }
    }

    @PostMapping("/general-ats-check")
    public ResponseEntity<?> checkGeneralAtsScore(
            @RequestParam("resume") MultipartFile resume,
            @RequestParam(value = "jd", required = false) String jd) {
        System.out.println("====== checkGeneralAtsScore hit ======");
        try {
            Map<String, Object> response = atsService.calculateGeneralAtsScore(resume, jd);
            if (response.containsKey("error")) {
                return ResponseEntity.badRequest().body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Throwable e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to parse document: " + e.toString()));
        }
    }
}
