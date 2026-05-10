package com.findmyjob.repository;

import com.findmyjob.model.Mentor;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MentorRepository extends MongoRepository<Mentor, String> {
    List<Mentor> findByStatusOrderByCreatedAtDesc(String status);

    List<Mentor> findAllByOrderByCreatedAtDesc();

    Optional<Mentor> findFirstByUsernameOrderByCreatedAtDesc(String username);

    Optional<Mentor> findFirstByEmailOrderByCreatedAtDesc(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    long countByCreatedAtAfter(java.time.LocalDateTime date);
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    long countByStatus(String status);
    long countByStatusAndCreatedAtAfter(String status, java.time.LocalDateTime date);
    long countByStatusAndCreatedAtBetween(String status, java.time.LocalDateTime start, java.time.LocalDateTime end);
}
