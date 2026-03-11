package com.findmyjob.controller;

import com.findmyjob.model.Mentor;
import com.findmyjob.repository.MentorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/mentors")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MentorController {

    @Autowired
    private MentorRepository mentorRepository;

    // Public API to submit a new mentor application
    @PostMapping("/apply")
    public ResponseEntity<?> applyAsMentor(@RequestBody Mentor mentor) {
        mentor.setStatus("PENDING");
        Mentor savedMentor = mentorRepository.save(mentor);
        return ResponseEntity.ok(savedMentor);
    }

    // Public API to fetch all approved mentors
    @GetMapping("")
    public ResponseEntity<List<Mentor>> getApprovedMentors() {
        return ResponseEntity.ok(mentorRepository.findByStatusOrderByCreatedAtDesc("APPROVED"));
    }
}
