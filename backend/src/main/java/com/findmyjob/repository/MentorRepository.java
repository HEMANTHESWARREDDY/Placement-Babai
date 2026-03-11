package com.findmyjob.repository;

import com.findmyjob.model.Mentor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorRepository extends JpaRepository<Mentor, Long> {
    List<Mentor> findByStatusOrderByCreatedAtDesc(String status);

    List<Mentor> findAllByOrderByCreatedAtDesc();
}
