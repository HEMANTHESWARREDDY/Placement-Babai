package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.time.LocalDateTime;

@Document(collection = "mentors")
@Data
public class Mentor {
    @Id
    private String id;

    private String name;
    private String email;
    private String phone;
    private String company;
    private String role;
    private String experience;
    private String linkedin;
    private String skills;
    private String bio;

    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    // Login credentials set at registration
    private String username;
    private String password; // stored as BCrypt hash

    private LocalDateTime createdAt = LocalDateTime.now();

    // Fields used when approved
    private String headerBg;
    private String avatarBg;
    
    private String image;
    private Double rating;
    private Integer reviews;
    private String instagram;
    
    // JSON strings for complex structures
    private String topics;
    
    private String education;
    
    private String workExperience;
    
    private String services;

    private Boolean isAvailable;
}
