package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Document(collection = "session_joins")
@Data
@NoArgsConstructor
public class SessionJoin {
    @Id
    private String id;

    private String sessionId;
    private LocalDateTime joinedAt;

    public SessionJoin(String sessionId, LocalDateTime joinedAt) {
        this.sessionId = sessionId;
        this.joinedAt = joinedAt;
    }
}
