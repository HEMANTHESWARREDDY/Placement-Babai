package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "daily_bug_hunter_quizzes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyBugHunterQuiz {
    @Id
    private String id;
    private String dateStamp; // e.g. "2026-07-02"
    private List<BugHunterQuestion> questions;
    private LocalDateTime createdAt;
}
