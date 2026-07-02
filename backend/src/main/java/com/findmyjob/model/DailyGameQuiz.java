package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Generic daily game quiz document - stores daily questions for any game type.
 * gameType: "output-predictor" | "code-sprint" | "sql-detective" | "error-fix"
 * questions: List of Map<String,Object> to flexibly store different schemas per game.
 */
@Document(collection = "daily_game_quizzes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyGameQuiz {
    @Id
    private String id;
    private String gameType;
    private String dateStamp; // e.g. "2026-07-02"
    private List<Map<String, Object>> questions;
    private LocalDateTime createdAt;
}
