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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String company; // e.g., accenture, tcs

    @Column(nullable = false)
    private String category; // e.g., HR, Technical, Coding

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // The actual question text
}
