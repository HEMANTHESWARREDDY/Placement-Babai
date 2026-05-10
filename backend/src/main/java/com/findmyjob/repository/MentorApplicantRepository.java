package com.findmyjob.repository;

import com.findmyjob.model.MentorApplicant;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MentorApplicantRepository extends MongoRepository<MentorApplicant, String> {
    List<MentorApplicant> findByStatusOrderByCreatedAtDesc(String status);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByPhone(String phone);

    long countByCreatedAtAfter(java.time.LocalDateTime date);
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    long countByStatus(String status);
    long countByStatusAndCreatedAtAfter(String status, java.time.LocalDateTime date);
    long countByStatusAndCreatedAtBetween(String status, java.time.LocalDateTime start, java.time.LocalDateTime end);
}
