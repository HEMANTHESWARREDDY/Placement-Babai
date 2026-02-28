package com.findmyjob.repository;

import com.findmyjob.model.JobApply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface JobApplyRepository extends JpaRepository<JobApply, Long> {
    long countByJobId(Long jobId);

    long countByJobIdAndAppliedAtAfter(Long jobId, LocalDateTime date);

    long countByAppliedAtAfter(LocalDateTime date);

    long countByAppliedAtBetween(LocalDateTime start, LocalDateTime end);
}
