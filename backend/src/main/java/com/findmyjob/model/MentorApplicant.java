package com.findmyjob.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "mentor_applicants")
public class MentorApplicant {
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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
}
