package com.findmyjob.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "free_sessions")
public class FreeSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String link;
    private String schedule;
    private String skills;
    private boolean active = true;
    @Column(nullable = false, name = "is_deleted", columnDefinition = "boolean default false")
    private boolean deleted = false;
    private java.time.LocalDateTime deletedAt;
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
    private java.time.LocalDate sessionDate = java.time.LocalDate.now();
}
