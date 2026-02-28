package com.findmyjob.repository;

import com.findmyjob.model.JobView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

@Repository
public interface JobViewRepository extends JpaRepository<JobView, Long> {
    long countByJobId(Long jobId);

    long countByJobIdAndViewedAtAfter(Long jobId, LocalDateTime date);
}
