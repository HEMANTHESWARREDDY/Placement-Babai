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
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "Company name is required")
    @Column(nullable = false)
    private String company;

    private String companyLogo;

    @NotBlank(message = "Location is required")
    @Column(nullable = false)
    private String location;

    @Column(length = 2000)
    private String description;

    private String experienceLevel; // e.g., "2.5 - 6.5 LPA", "0.5 - 1 LPA"

    private String jobType; // e.g., "Full-time", "Part-time", "Contract"

    private String category; // e.g., "Java Full Stack Developer", "Python Interns"

    @Column(name = "posted_date")
    private LocalDateTime postedDate;

    private String skills; // Comma-separated skills

    private String salary; // e.g., "4 - 8 LPA"

    private String applyLink; // External job application URL

    private String role; // e.g., "Developer", "Analyst", "ML", "QA", "DevOps"

    private String companyType; // e.g., "Startup", "MNC"

    @Column(length = 5000)
    private String responsibilities; // Job responsibilities

    @Column(length = 5000)
    private String requirements; // Job requirements / qualifications

    @PrePersist
    protected void onCreate() {
        postedDate = LocalDateTime.now();
    }
}
