package com.findmyjob.repository;

import com.findmyjob.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByTitleContainingIgnoreCaseAndIsDeletedFalse(String title);

    List<Job> findByLocationContainingIgnoreCaseAndIsDeletedFalse(String location);

    List<Job> findByCompanyContainingIgnoreCaseAndIsDeletedFalse(String company);

    List<Job> findByIsDeletedFalse();

    List<Job> findByIsDeletedTrue();

    @Query("SELECT j FROM Job j WHERE j.isDeleted = false AND (" +
            "LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.company) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.location) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.passoutYear) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.skills) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Job> searchJobs(@Param("keyword") String keyword);

    long countByPostedDateAfter(java.time.LocalDateTime date);

    long countByPostedDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @Modifying
    @Transactional
    @Query("DELETE FROM Job j WHERE j.isDeleted = true AND j.deletedAt < :cutoffDate")
    void deleteOldDeletedJobs(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}
