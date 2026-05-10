package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Document(collection = "jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    private String id;

    private String title;

    private String company;

    private String companyLogo;

    private String location;

    private String description;

    private String experienceLevel;

    private String jobType;

    private String category;

    private LocalDateTime postedDate = LocalDateTime.now();

    private String skills;

    private String salary;

    private String applyLink;

    private String role;

    private String companyType;

    private String passoutYear;

    private String expiryDate;

    private String responsibilities;

    private String requirements;

    private Boolean isDeleted = false;

    private LocalDateTime deletedAt;
}
