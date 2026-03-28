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

    @Column(columnDefinition = "TEXT")
    private String companyLogo;

    @NotBlank(message = "Location is required")
    @Column(nullable = false, length = 500)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String experienceLevel;

    @Column(length = 500)
    private String jobType;

    @Column(columnDefinition = "TEXT")
    private String category;

    @Column(name = "posted_date")
    private LocalDateTime postedDate;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(columnDefinition = "TEXT")
    private String salary;

    @Column(columnDefinition = "TEXT")
    private String applyLink;

    @Column(length = 500)
    private String role;

    @Column(length = 500)
    private String companyType;

    @Column(length = 500)
    private String passoutYear;

    @Column(length = 500)
    private String expiryDate;

    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    @Column(columnDefinition = "TEXT")
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
