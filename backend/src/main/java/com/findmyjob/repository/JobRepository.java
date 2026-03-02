package com.findmyjob.repository;

import com.findmyjob.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByTitleContainingIgnoreCase(String title);

    List<Job> findByLocationContainingIgnoreCase(String location);

    List<Job> findByCompanyContainingIgnoreCase(String company);

    @Query("SELECT j FROM Job j WHERE " +
            "LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.company) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.location) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.passoutYear) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.skills) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Job> searchJobs(@Param("keyword") String keyword);

    long countByPostedDateAfter(java.time.LocalDateTime date);

    long countByPostedDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
