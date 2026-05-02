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
    private boolean active = true;
}
