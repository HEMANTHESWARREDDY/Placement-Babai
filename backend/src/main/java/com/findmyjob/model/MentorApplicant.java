package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.time.LocalDateTime;

@Document(collection = "mentor_applicants")
@Data
public class MentorApplicant {
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
    private String education;

    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    // Login credentials set at registration
    private String username;
    private String password; // stored as BCrypt hash

    private LocalDateTime createdAt = LocalDateTime.now();
}
