package com.findmyjob.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "mentors")
public class Mentor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;
    private String company;
    private String role;
    private String experience;
    private String linkedin;
    private String skills;
    @Column(columnDefinition = "TEXT")
    private String bio;

    private String status; // PENDING, APPROVED, REJECTED

    // Login credentials set at registration
    @Column(unique = true)
    private String username;
    private String password; // stored as BCrypt hash

    private LocalDateTime createdAt;

    // Fields used when approved
    @Column(columnDefinition = "LONGTEXT")
    private String headerBg;
    private String avatarBg;
    
    @Column(columnDefinition = "LONGTEXT")
    private String image;
    private Double rating;
    private Integer reviews;
    private String instagram;
    
    // JSON strings for complex structures
    @Column(columnDefinition = "TEXT")
    private String topics;
    
    @Column(columnDefinition = "TEXT")
    private String education;
    
    @Column(columnDefinition = "TEXT")
    private String workExperience;
    
    @Column(columnDefinition = "TEXT")
    private String services;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
}
