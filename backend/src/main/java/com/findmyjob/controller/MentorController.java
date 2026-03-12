package com.findmyjob.controller;

import com.findmyjob.model.Mentor;
import com.findmyjob.repository.MentorRepository;
import com.findmyjob.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}
