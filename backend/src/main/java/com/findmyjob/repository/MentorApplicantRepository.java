package com.findmyjob.repository;

import com.findmyjob.model.MentorApplicant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MentorApplicantRepository extends JpaRepository<MentorApplicant, Long> {
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
