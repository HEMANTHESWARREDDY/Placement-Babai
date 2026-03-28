package com.findmyjob.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Job title is required")
    @Column(nullable = false, length = 500)
    private String title;

    @NotBlank(message = "Company name is required")
    @Column(nullable = false, length = 500)
    private String company;

    @Column(length = 2000)
    private String companyLogo;

    @NotBlank(message = "Location is required")
    @Column(nullable = false, length = 500)
    private String location;

    @Column(length = 5000)
    private String description;

    @Column(length = 500)
    private String experienceLevel; // e.g., "2.5 - 6.5 LPA", "0.5 - 1 LPA"

    @Column(length = 500)
    private String jobType; // e.g., "Full-time", "Part-time", "Contract"

    @Column(length = 1000)
    private String category; // e.g., "Java Full Stack Developer", "Python Interns"

    @Column(name = "posted_date")
    private LocalDateTime postedDate;

    @Column(length = 2000)
    private String skills; // Comma-separated skills

    @Column(length = 1000)
    private String salary; // e.g., "4 - 8 LPA"

    @Column(length = 2000)
    private String applyLink; // External job application URL

    @Column(length = 500)
    private String role; // e.g., "Developer", "Analyst", "ML", "QA", "DevOps"

    @Column(length = 500)
    private String companyType; // e.g., "Startup", "MNC"

    @Column(length = 500)
    private String passoutYear; // e.g., "2024, 2025"

    @Column(length = 500)
    private String expiryDate; // e.g., 2026-03-31 or "Don't know"

    @Column(length = 10000)
    private String responsibilities; // Job responsibilities

    @Column(length = 10000)
    private String requirements; // Job requirements / qualifications

    @Column(name = "is_deleted", columnDefinition = "boolean default false")
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        postedDate = LocalDateTime.now();
    }
}
