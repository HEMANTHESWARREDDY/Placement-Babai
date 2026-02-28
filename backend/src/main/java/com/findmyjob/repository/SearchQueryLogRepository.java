package com.findmyjob.repository;

import com.findmyjob.model.SearchQueryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchQueryLogRepository extends JpaRepository<SearchQueryLog, Long> {

    @Query("SELECT s.keyword, COUNT(s.id) as cnt FROM SearchQueryLog s " +
            "WHERE s.searchedAt > :date " +
            "GROUP BY s.keyword " +
            "ORDER BY cnt DESC")
    List<Object[]> findTopSearchesSince(@Param("date") LocalDateTime date, Pageable pageable);

    @Query("SELECT s.keyword, COUNT(s.id) as cnt FROM SearchQueryLog s " +
            "WHERE s.searchedAt >= :start AND s.searchedAt < :end " +
            "GROUP BY s.keyword " +
            "ORDER BY cnt DESC")
    List<Object[]> findTopSearchesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
            Pageable pageable);
}
