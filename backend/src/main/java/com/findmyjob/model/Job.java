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
    @Column(name = "job_title", nullable = false, columnDefinition = "TEXT")
    private String title;

    @NotBlank(message = "Company name is required")
    @Column(name = "job_company", nullable = false, columnDefinition = "TEXT")
    private String company;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String companyLogo;

    @NotBlank(message = "Location is required")
    @Column(name = "job_location", nullable = false, columnDefinition = "TEXT")
    private String location;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "job_experience", columnDefinition = "TEXT")
    private String experienceLevel;

    @Column(name = "job_type_detail", columnDefinition = "TEXT")
    private String jobType;

    @Column(name = "job_category", columnDefinition = "TEXT")
    private String category;

    @Column(name = "posted_date")
    private LocalDateTime postedDate;

    @Column(name = "job_skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "job_salary", columnDefinition = "TEXT")
    private String salary;

    @Column(name = "apply_url", columnDefinition = "TEXT")
    private String applyLink;

    @Column(name = "job_role", columnDefinition = "TEXT")
    private String role;

    @Column(name = "company_type_detail", columnDefinition = "TEXT")
    private String companyType;

    @Column(name = "passout_years", columnDefinition = "TEXT")
    private String passoutYear;

    @Column(name = "job_expiry", columnDefinition = "TEXT")
    private String expiryDate;

    @Column(name = "job_responsibilities", columnDefinition = "TEXT")
    private String responsibilities;

    @Column(name = "job_requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "is_deleted", columnDefinition = "boolean default false")
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        postedDate = LocalDateTime.now();
    }
}
