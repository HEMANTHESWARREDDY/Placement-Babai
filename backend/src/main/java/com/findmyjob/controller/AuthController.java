package com.findmyjob.controller;

import com.findmyjob.model.Admin;
import com.findmyjob.repository.AdminRepository;
import com.findmyjob.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Admin admin) {
        try {
            // Check if username already exists
            if (adminRepository.existsByUsername(admin.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username already exists"));
            }

            // Check if email already exists
            if (adminRepository.existsByEmail(admin.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email already exists"));
            }

            // Encrypt password
            admin.setPassword(passwordEncoder.encode(admin.getPassword()));

            // Save admin
            Admin savedAdmin = adminRepository.save(admin);

            // Generate token
            String token = jwtUtil.generateToken(savedAdmin.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Admin registered successfully");
            response.put("token", token);
            response.put("username", savedAdmin.getUsername());
            response.put("email", savedAdmin.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");

            // Find admin by username OR email
            Admin admin = adminRepository.findByUsername(username).orElse(null);
            if (admin == null) {
                admin = adminRepository.findByEmail(username).orElse(null);
            }

            if (admin == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid username/email or password"));
            }

            // Verify password
            if (!passwordEncoder.matches(password, admin.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid username or password"));
            }

            // Generate token
            String token = jwtUtil.generateToken(admin.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("username", admin.getUsername());
            response.put("email", admin.getEmail());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("valid", false, "error", "Invalid token format"));
            }

            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);

            if (jwtUtil.validateToken(token, username)) {
                Admin admin = adminRepository.findByUsername(username).orElse(null);
                if (admin != null) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("valid", true);
                    response.put("username", admin.getUsername());
                    response.put("email", admin.getEmail());
                    return ResponseEntity.ok(response);
                }
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("valid", false, "error", "Invalid or expired token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("valid", false, "error", "Token validation failed"));
        }
    }

    @PostMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Unauthorized"));
            }

            String token = authHeader.substring(7);
            String currentUsername = jwtUtil.extractUsername(token);

            if (!jwtUtil.validateToken(token, currentUsername)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid or expired token"));
            }

            Admin admin = adminRepository.findByUsername(currentUsername).orElse(null);
            if (admin == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Admin not found"));
            }

            String newUsername = request.get("username");
            String newEmail = request.get("email");
            String newFullName = request.get("fullName");
            String newPhoneNumber = request.get("phoneNumber");

            // Full Name Validation
            if (newFullName == null || newFullName.trim().length() < 2 || !newFullName.trim().matches("^[a-zA-Z\\s]+$")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Full Name must be at least 2 characters and contain only letters"));
            }

            // Username Validation
            if (newUsername == null || !newUsername.matches("^[a-zA-Z0-9_]{3,20}$")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username must be 3-20 alphanumeric characters or underscores"));
            }
            if (!newUsername.equals(admin.getUsername()) && adminRepository.existsByUsername(newUsername)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username already exists"));
            }

            // Email Validation
            if (newEmail == null || !newEmail.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid email format"));
            }
            if (!newEmail.equals(admin.getEmail()) && adminRepository.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email already exists"));
            }

            // Phone Number Validation
            if (newPhoneNumber == null || !newPhoneNumber.matches("^\\+?[0-9\\s\\-X]{10,20}$")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid phone number format (at least 10 digits)"));
            }
            if (!newPhoneNumber.equals(admin.getPhoneNumber()) && adminRepository.existsByPhoneNumber(newPhoneNumber)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Phone Number already exists"));
            }

            admin.setUsername(newUsername);
            admin.setEmail(newEmail);
            admin.setFullName(newFullName);
            admin.setPhoneNumber(newPhoneNumber);
            adminRepository.save(admin);

            // Re-generate token since username might have changed
            String newToken = jwtUtil.generateToken(admin.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile updated successfully");
            response.put("token", newToken);
            response.put("username", admin.getUsername());
            response.put("email", admin.getEmail());
            response.put("fullName", admin.getFullName());
            response.put("phoneNumber", admin.getPhoneNumber());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Unauthorized"));
            }

            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);

            if (!jwtUtil.validateToken(token, username)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid or expired token"));
            }

            Admin admin = adminRepository.findByUsername(username).orElse(null);
            if (admin == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Admin not found"));
            }

            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");

            if (!passwordEncoder.matches(currentPassword, admin.getPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Incorrect current password"));
            }

            admin.setPassword(passwordEncoder.encode(newPassword));
            adminRepository.save(admin);

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to change password: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Unauthorized"));
            }

            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);

            if (!jwtUtil.validateToken(token, username)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid or expired token"));
            }

            Admin admin = adminRepository.findByUsername(username).orElse(null);
            if (admin == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Admin not found"));
            }

            String currentPassword = request.get("currentPassword");
            boolean matches = passwordEncoder.matches(currentPassword, admin.getPassword());

            return ResponseEntity.ok(Map.of("valid", matches));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Verification failed: " + e.getMessage()));
        }
    }
}
