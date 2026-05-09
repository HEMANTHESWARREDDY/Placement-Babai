package com.findmyjob.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@Table(name = "session_joins")
public class SessionJoin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sessionId;
    private LocalDateTime joinedAt;

    public SessionJoin(Long sessionId, LocalDateTime joinedAt) {
        this.sessionId = sessionId;
        this.joinedAt = joinedAt;
    }
}
