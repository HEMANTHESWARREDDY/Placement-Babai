package com.findmyjob.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "search_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String role;

    private int questionCount;
    
    private LocalDateTime searchDate;

    // We'll use this to group by "Community" vs "My"
    private String userId; // For now, we'll store a session ID or similar

    @PrePersist
    protected void onCreate() {
        searchDate = LocalDateTime.now();
    }
}
