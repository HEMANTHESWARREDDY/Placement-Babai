package com.findmyjob.repository;

import com.findmyjob.model.Mentor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorRepository extends JpaRepository<Mentor, Long> {
    List<Mentor> findByStatusOrderByCreatedAtDesc(String status);

    List<Mentor> findAllByOrderByCreatedAtDesc();

    java.util.Optional<Mentor> findFirstByUsernameOrderByIdDesc(String username);

    java.util.Optional<Mentor> findFirstByEmailOrderByIdDesc(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    long countByCreatedAtAfter(java.time.LocalDateTime date);
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    long countByStatus(String status);
    long countByStatusAndCreatedAtAfter(String status, java.time.LocalDateTime date);
    long countByStatusAndCreatedAtBetween(String status, java.time.LocalDateTime start, java.time.LocalDateTime end);
}
