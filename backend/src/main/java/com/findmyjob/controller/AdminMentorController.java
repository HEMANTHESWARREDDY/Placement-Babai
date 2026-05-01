package com.findmyjob.controller;

import com.findmyjob.model.Mentor;
import com.findmyjob.model.MentorApplicant;
import com.findmyjob.repository.MentorApplicantRepository;
import com.findmyjob.repository.MentorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/mentors")
public class AdminMentorController {

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private MentorApplicantRepository mentorApplicantRepository;

    @GetMapping("/counts")
    public ResponseEntity<Map<String, Long>> getMentorCounts() {
        long pending = mentorApplicantRepository.countByStatus("PENDING");
        long approved = mentorRepository.countByStatus("APPROVED");
        long rejectedInApplicants = mentorApplicantRepository.countByStatus("REJECTED");
        long rejectedInMentors = mentorRepository.countByStatus("REJECTED");
        
        Map<String, Long> counts = Map.of(
            "PENDING", pending,
            "APPROVED", approved,
            "REJECTED", rejectedInApplicants + rejectedInMentors
        );
        return ResponseEntity.ok(counts);
    }

    // Get all mentor applications (PENDING)
    @GetMapping("/applications")
    public ResponseEntity<List<MentorApplicant>> getPendingApplications() {
        return ResponseEntity.ok(mentorApplicantRepository.findByStatusOrderByCreatedAtDesc("PENDING"));
    }

    // Get all mentor applications (ANY STATUS)
    @GetMapping("/applications/all")
    public ResponseEntity<List<MentorApplicant>> getAllApplications() {
        return ResponseEntity.ok(mentorApplicantRepository.findAll());
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

        Optional<MentorApplicant> applicantOpt = mentorApplicantRepository.findById(id);
        if (applicantOpt.isEmpty()) {
            // Also allow updating status if they are already in the Mentor table for some reason
            Optional<Mentor> mentorOpt = mentorRepository.findById(id);
            if (mentorOpt.isPresent()) {
                Mentor m = mentorOpt.get();
                m.setStatus(newStatus);
                return ResponseEntity.ok(mentorRepository.save(m));
            }
            return ResponseEntity.notFound().build();
        }

        MentorApplicant applicant = applicantOpt.get();

        if (newStatus.equals("APPROVED")) {
            // Move to Mentor table
            Mentor mentor = new Mentor();
            mentor.setName(applicant.getName());
            mentor.setEmail(applicant.getEmail());
            mentor.setPhone(applicant.getPhone());
            mentor.setCompany(applicant.getCompany());
            mentor.setRole(applicant.getRole());
            mentor.setExperience(applicant.getExperience());
            mentor.setLinkedin(applicant.getLinkedin());
            mentor.setSkills(applicant.getSkills());
            mentor.setBio(applicant.getBio());
            mentor.setUsername(applicant.getUsername());
            mentor.setPassword(applicant.getPassword());
            mentor.setStatus("APPROVED");

            // Setup initial default fields
            mentor.setRating(5.0);
            mentor.setReviews(0);
            mentor.setHeaderBg("linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)");
            mentor.setAvatarBg("#818cf8");
            mentor.setImage(""); // We could configure randomized avatars
            mentor.setIsAvailable(true);
            
            Mentor savedMentor = mentorRepository.save(mentor);
            mentorApplicantRepository.delete(applicant);
            return ResponseEntity.ok(savedMentor);
        } else {
            applicant.setStatus(newStatus);
            MentorApplicant updatedApplicant = mentorApplicantRepository.save(applicant);
            return ResponseEntity.ok(updatedApplicant);
        }
    }

    // Delete mentor application completely
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMentor(@PathVariable Long id) {
        boolean deleted = false;
        if (mentorApplicantRepository.existsById(id)) {
            mentorApplicantRepository.deleteById(id);
            deleted = true;
        }
        if (mentorRepository.existsById(id)) {
            mentorRepository.deleteById(id);
            deleted = true;
        }
        
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().build();
    }
}
