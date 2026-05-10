package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Document(collection = "search_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistory {

    @Id
    private String id;

    private String company;

    private String role;

    private int questionCount;
    
    private LocalDateTime searchDate = LocalDateTime.now();

    // We'll use this to group by "Community" vs "My"
    private String userId; // For now, we'll store a session ID or similar
}
