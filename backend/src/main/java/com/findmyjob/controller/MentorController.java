package com.findmyjob.controller;

import com.findmyjob.model.Mentor;
import com.findmyjob.model.MentorApplicant;
import com.findmyjob.repository.MentorApplicantRepository;
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
    private MentorApplicantRepository mentorApplicantRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // Public API to submit a new mentor application
    @PostMapping("/apply")
    public ResponseEntity<?> applyAsMentor(@RequestBody Map<String, String> payload) {
        // Validation for mandatory fields
        String[] requiredFields = {"name", "email", "phone", "company", "role", "experience", "linkedin", "skills", "bio", "username", "password", "confirmPassword"};
        for (String field : requiredFields) {
            if (payload.get(field) == null || payload.get(field).isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", field.substring(0, 1).toUpperCase() + field.substring(1) + " is required"));
            }
        }

        // Validate password (min 6 chars, 1 number, 1 special char)
        String password = payload.get("password");
        String confirmPassword = payload.get("confirmPassword");
        if (!password.matches("^(?=.*[0-9])(?=.*[!@#$%^&*(),.?\":{}|<>]).{6,}$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters and include 1 number and 1 special character"));
        }
        if (!password.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match"));
        }

        // Validate username (min 3 alphabets, alphanumeric + underscore)
        String username = payload.get("username");
        if (!username.matches("^(?=(?:.*[a-zA-Z]){3,})[a-zA-Z0-9_]+$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username must have min 3 alphabets and only contain letters, numbers, or underscores"));
        }
        String email = payload.get("email");
        String phone = payload.get("phone");

        if (mentorRepository.existsByUsername(username) || mentorApplicantRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
        }
        if (mentorRepository.existsByEmail(email) || mentorApplicantRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }
        if (mentorRepository.existsByPhone(phone) || mentorApplicantRepository.existsByPhone(phone)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number already registered"));
        }

        MentorApplicant applicant = new MentorApplicant();
        applicant.setName(payload.get("name"));
        applicant.setEmail(payload.get("email"));
        applicant.setPhone(payload.get("phone"));
        applicant.setCompany(payload.get("company"));
        applicant.setRole(payload.get("role"));
        applicant.setExperience(payload.get("experience"));
        applicant.setLinkedin(payload.get("linkedin"));
        applicant.setSkills(payload.get("skills"));
        applicant.setBio(payload.get("bio"));
        applicant.setUsername(username);
        applicant.setPassword(passwordEncoder.encode(password));
        applicant.setStatus("PENDING");

        MentorApplicant saved = mentorApplicantRepository.save(applicant);
        // Don't return password in response
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    // Public API for mentor login (only APPROVED mentors can log in)
    @PostMapping("/login")
    public ResponseEntity<?> mentorLogin(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        Optional<Mentor> mentorOpt = mentorRepository.findFirstByUsernameOrderByIdDesc(username);
        if (mentorOpt.isEmpty()) {
            // Try by email
            mentorOpt = mentorRepository.findFirstByEmailOrderByIdDesc(username);
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
        mentor.setIsAvailable(updatedInfo.getIsAvailable() != null ? updatedInfo.getIsAvailable() : mentor.getIsAvailable());
        
        Mentor saved = mentorRepository.save(mentor);
        saved.setPassword(null);
        
        return ResponseEntity.ok(saved);
    }
}
