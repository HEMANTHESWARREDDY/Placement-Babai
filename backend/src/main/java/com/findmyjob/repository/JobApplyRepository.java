package com.findmyjob.repository;

import com.findmyjob.model.JobApply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface JobApplyRepository extends JpaRepository<JobApply, Long> {
    long countByJobId(Long jobId);

    long countByJobIdAndAppliedAtAfter(Long jobId, LocalDateTime date);

    long countByAppliedAtAfter(LocalDateTime date);

    long countByAppliedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT j.jobId, COUNT(j) FROM JobApply j GROUP BY j.jobId")
    List<Object[]> countAppliesGroupedByJob();
}
