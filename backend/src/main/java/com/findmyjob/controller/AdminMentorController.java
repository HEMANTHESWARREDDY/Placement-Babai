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
@RequestMapping("/api/admin/mentors")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminMentorController {

    @Autowired
    private MentorRepository mentorRepository;

    // Get all mentor applications (PENDING)
    @GetMapping("/applications")
    public ResponseEntity<List<Mentor>> getPendingApplications() {
        return ResponseEntity.ok(mentorRepository.findByStatusOrderByCreatedAtDesc("PENDING"));
    }

    // Get all mentors (any status, or maybe just approved/rejected for management)
    @GetMapping("")
    public ResponseEntity<List<Mentor>> getAllMentors() {
        return ResponseEntity.ok(mentorRepository.findAllByOrderByCreatedAtDesc());
    }

    // Update mentor status (Approve/Reject)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateMentorStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        if (newStatus == null
                || (!newStatus.equals("APPROVED") && !newStatus.equals("REJECTED") && !newStatus.equals("PENDING"))) {
            return ResponseEntity.badRequest().body("Invalid status");
        }

        Optional<Mentor> mentorOpt = mentorRepository.findById(id);
        if (mentorOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Mentor mentor = mentorOpt.get();
        mentor.setStatus(newStatus);

        // Setup initial default fields if approved and missing
        if (newStatus.equals("APPROVED")) {
            if (mentor.getRating() == null)
                mentor.setRating(5.0);
            if (mentor.getReviews() == null)
                mentor.setReviews(0);
            if (mentor.getHeaderBg() == null)
                mentor.setHeaderBg("linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)");
            if (mentor.getAvatarBg() == null)
                mentor.setAvatarBg("#818cf8");
            if (mentor.getImage() == null)
                mentor.setImage(""); // We could configure randomized avatars
        }

        Mentor updatedMentor = mentorRepository.save(mentor);
        return ResponseEntity.ok(updatedMentor);
    }

    // Delete mentor application completely
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMentor(@PathVariable Long id) {
        if (!mentorRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        mentorRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
