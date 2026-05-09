package com.findmyjob.repository;

import com.findmyjob.model.FreeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface FreeSessionRepository extends JpaRepository<FreeSession, Long> {
    List<FreeSession> findByDeletedFalseOrderByCreatedAtDesc();
    List<FreeSession> findByDeletedTrueOrderByDeletedAtDesc();
    List<FreeSession> findByActiveTrueAndDeletedFalse();
    long countByCreatedAtAfter(LocalDateTime date);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countBySessionDateAndActiveTrueAndDeletedFalse(java.time.LocalDate date);
}
