package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Document(collection = "free_sessions")
@Data
public class FreeSession {
    @Id
    private String id;
    
    private String title;
    private String description;
    private String link;
    private String schedule;
    private String skills;
    private boolean active = true;
    private boolean deleted = false;
    private java.time.LocalDateTime deletedAt;
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
    private java.time.LocalDate sessionDate = java.time.LocalDate.now();

    @org.springframework.data.annotation.Transient
    private long bookingCount;
}
