package com.findmyjob.repository;

import com.findmyjob.model.SessionJoin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface SessionJoinRepository extends JpaRepository<SessionJoin, Long> {
    long countByJoinedAtAfter(LocalDateTime date);
    long countByJoinedAtBetween(LocalDateTime start, LocalDateTime end);
}
