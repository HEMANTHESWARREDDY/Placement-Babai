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

    @Column(length = 5000)
    private String companyLogo;

    @NotBlank(message = "Location is required")
    @Column(nullable = false, length = 500)
    private String location;

    @Column(length = 20000)
    private String description;

    @Column(length = 500)
    private String experienceLevel;

    @Column(length = 500)
    private String jobType;

    @Column(length = 2000)
    private String category;

    @Column(name = "posted_date")
    private LocalDateTime postedDate;

    @Column(length = 5000)
    private String skills;

    @Column(length = 2000)
    private String salary;

    @Column(length = 5000)
    private String applyLink;

    @Column(length = 500)
    private String role;

    @Column(length = 500)
    private String companyType;

    @Column(name = "passout_year", length = 500)
    private String passoutYear;

    @Column(length = 500)
    private String expiryDate;

    @Column(length = 20000)
    private String responsibilities;

    @Column(length = 20000)
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
