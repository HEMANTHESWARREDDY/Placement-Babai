package com.findmyjob.repository;

import com.findmyjob.model.SessionJoin;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;

public interface SessionJoinRepository extends MongoRepository<SessionJoin, String> {
    long countByJoinedAtAfter(LocalDateTime date);
    long countByJoinedAtBetween(LocalDateTime start, LocalDateTime end);
}
