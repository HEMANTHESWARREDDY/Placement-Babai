package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    // Custom constructor for backward compatibility
    public Question(String id, String company, String category, String content, String answer) {
        this.id = id;
        this.company = company;
        this.category = category;
        this.content = content;
        this.answer = answer;
        this.role = "General";
    }

    @Id
    private String id;

    private String company; // e.g., accenture, tcs

    private String category; // e.g., HR, Technical, Coding

    private String role; // e.g., Software Engineer, Data Analyst

    private String content; // The actual question text

    private String answer; // The suggested answer text
}
