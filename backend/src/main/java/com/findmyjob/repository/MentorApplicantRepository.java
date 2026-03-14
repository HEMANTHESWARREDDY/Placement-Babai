package com.findmyjob.repository;

import com.findmyjob.model.MentorApplicant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MentorApplicantRepository extends JpaRepository<MentorApplicant, Long> {
    List<MentorApplicant> findByStatusOrderByCreatedAtDesc(String status);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
