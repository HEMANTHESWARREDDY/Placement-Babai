package com.findmyjob.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    // Custom constructor for backward compatibility
    public Question(Long id, String company, String category, String content, String answer) {
        this.id = id;
        this.company = company;
        this.category = category;
        this.content = content;
        this.answer = answer;
        this.role = "General";
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String company; // e.g., accenture, tcs

    @Column(nullable = false)
    private String category; // e.g., HR, Technical, Coding

    private String role; // e.g., Software Engineer, Data Analyst

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // The actual question text

    @Column(columnDefinition = "TEXT")
    private String answer; // The suggested answer text
}
