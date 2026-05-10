package com.findmyjob.repository;

import com.findmyjob.model.Job;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobRepository extends MongoRepository<Job, String> {

    List<Job> findByTitleContainingIgnoreCaseAndIsDeletedFalse(String title);

    List<Job> findByLocationContainingIgnoreCaseAndIsDeletedFalse(String location);

    List<Job> findByCompanyContainingIgnoreCaseAndIsDeletedFalse(String company);

    List<Job> findByIsDeletedFalse();

    List<Job> findByIsDeletedTrue();

    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'title': { '$regex': ?0, '$options': 'i' } }, " +
            "{ 'company': { '$regex': ?0, '$options': 'i' } }, " +
            "{ 'location': { '$regex': ?0, '$options': 'i' } }, " +
            "{ 'passoutYear': { '$regex': ?0, '$options': 'i' } }, " +
            "{ 'skills': { '$regex': ?0, '$options': 'i' } } " +
            "] }")
    List<Job> searchJobs(String keyword);

    long countByPostedDateAfter(LocalDateTime date);

    long countByPostedDateBetween(LocalDateTime start, LocalDateTime end);

    void deleteAllByIsDeletedTrueAndDeletedAtBefore(LocalDateTime cutoffDate);
}
