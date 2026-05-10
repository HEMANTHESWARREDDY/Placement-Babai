package com.findmyjob.repository;

import com.findmyjob.model.JobView;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

@Repository
public interface JobViewRepository extends MongoRepository<JobView, String> {
    long countByJobId(String jobId);

    long countByJobIdAndViewedAtAfter(String jobId, LocalDateTime date);
}
