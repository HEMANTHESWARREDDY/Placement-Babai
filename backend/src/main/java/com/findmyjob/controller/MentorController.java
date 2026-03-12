package com.findmyjob.controller;

import com.findmyjob.model.Mentor;
import com.findmyjob.repository.MentorRepository;
import com.findmyjob.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/mentors")
public class MentorController {

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // Public API to submit a new mentor application
    @PostMapping("/apply")
    public ResponseEntity<?> applyAsMentor(@RequestBody Map<String, String> payload) {
        // Validate password match
        String password = payload.get("password");
        String confirmPassword = payload.get("confirmPassword");
        if (password == null || password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }
        if (!password.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match"));
        }

        // Check username uniqueness
        String username = payload.get("username");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
        }
        if (mentorRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
        }
        if (mentorRepository.existsByEmail(payload.get("email"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        Mentor mentor = new Mentor();
        mentor.setName(payload.get("name"));
        mentor.setEmail(payload.get("email"));
        mentor.setPhone(payload.get("phone"));
        mentor.setCompany(payload.get("company"));
        mentor.setRole(payload.get("role"));
        mentor.setExperience(payload.get("experience"));
        mentor.setLinkedin(payload.get("linkedin"));
        mentor.setSkills(payload.get("skills"));
        mentor.setBio(payload.get("bio"));
        mentor.setUsername(username);
        mentor.setPassword(passwordEncoder.encode(password));
        mentor.setStatus("PENDING");

        Mentor saved = mentorRepository.save(mentor);
        // Don't return password in response
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    // Public API for mentor login (only APPROVED mentors can log in)
    @PostMapping("/login")
    public ResponseEntity<?> mentorLogin(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        Optional<Mentor> mentorOpt = mentorRepository.findByUsername(username);
        if (mentorOpt.isEmpty()) {
            // Try by email
            mentorOpt = mentorRepository.findByEmail(username);
        }

        if (mentorOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }

        Mentor mentor = mentorOpt.get();

        if (mentor.getPassword() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Your account doesn't have a password set. Please contact support."));
        }

        if (!passwordEncoder.matches(password, mentor.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }

        if (!"APPROVED".equals(mentor.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error",
                            "Your application is still under review. You will be notified once approved."));
        }

        String token = jwtUtil.generateToken("mentor_" + mentor.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("name", mentor.getName());
        response.put("email", mentor.getEmail());
        response.put("username", mentor.getUsername());
        response.put("id", mentor.getId());
        return ResponseEntity.ok(response);
    }

    // Public API to fetch all approved mentors
    @GetMapping("")
    public ResponseEntity<List<Mentor>> getApprovedMentors() {
        List<Mentor> approved = mentorRepository.findByStatusOrderByCreatedAtDesc("APPROVED");
        // Remove passwords from response
        approved.forEach(m -> m.setPassword(null));
        return ResponseEntity.ok(approved);
    }

    // Protected API to get logged-in mentor profile
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        String authUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (authUser == null || !authUser.startsWith("mentor_")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Long id;
        try {
            id = Long.parseLong(authUser.substring(7));
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Mentor> mentorOpt = mentorRepository.findById(id);
        if (mentorOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Mentor mentor = mentorOpt.get();
        mentor.setPassword(null);
        return ResponseEntity.ok(mentor);
    }
    
    // Protected API to update logged-in mentor profile
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody Mentor updatedInfo) {
        String authUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (authUser == null || !authUser.startsWith("mentor_")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Long id;
        try {
            id = Long.parseLong(authUser.substring(7));
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Mentor> mentorOpt = mentorRepository.findById(id);
        if (mentorOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Mentor mentor = mentorOpt.get();
        
        // Update all editable profile details
        mentor.setName(updatedInfo.getName() != null ? updatedInfo.getName() : mentor.getName());
        mentor.setBio(updatedInfo.getBio() != null ? updatedInfo.getBio() : mentor.getBio());
        mentor.setImage(updatedInfo.getImage() != null ? updatedInfo.getImage() : mentor.getImage());
        mentor.setHeaderBg(updatedInfo.getHeaderBg() != null ? updatedInfo.getHeaderBg() : mentor.getHeaderBg());
        mentor.setRole(updatedInfo.getRole() != null ? updatedInfo.getRole() : mentor.getRole());
        mentor.setCompany(updatedInfo.getCompany() != null ? updatedInfo.getCompany() : mentor.getCompany());
        mentor.setExperience(updatedInfo.getExperience() != null ? updatedInfo.getExperience() : mentor.getExperience());
        mentor.setLinkedin(updatedInfo.getLinkedin() != null ? updatedInfo.getLinkedin() : mentor.getLinkedin());
        mentor.setInstagram(updatedInfo.getInstagram() != null ? updatedInfo.getInstagram() : mentor.getInstagram());
        mentor.setTopics(updatedInfo.getTopics() != null ? updatedInfo.getTopics() : mentor.getTopics());
        mentor.setEducation(updatedInfo.getEducation() != null ? updatedInfo.getEducation() : mentor.getEducation());
        mentor.setWorkExperience(updatedInfo.getWorkExperience() != null ? updatedInfo.getWorkExperience() : mentor.getWorkExperience());
        mentor.setServices(updatedInfo.getServices() != null ? updatedInfo.getServices() : mentor.getServices());
        
        Mentor saved = mentorRepository.save(mentor);
        saved.setPassword(null);
        
        return ResponseEntity.ok(saved);
    }
}
