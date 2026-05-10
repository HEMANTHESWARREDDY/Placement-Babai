package com.findmyjob.repository;

import com.findmyjob.model.JobApply;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface JobApplyRepository extends MongoRepository<JobApply, String> {
    long countByJobId(String jobId);

    long countByJobIdAndAppliedAtAfter(String jobId, LocalDateTime date);

    long countByAppliedAtAfter(LocalDateTime date);

    long countByAppliedAtBetween(LocalDateTime start, LocalDateTime end);

    @Aggregation(pipeline = {
        "{ '$group': { '_id': '$jobId', 'count': { '$sum': 1 } } }"
    })
    List<Map<String, Object>> countAppliesGroupedByJob();
}
