package com.findmyjob.repository;

import com.findmyjob.model.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    
    // Get latest community searches
    List<SearchHistory> findTop50ByOrderBySearchDateDesc();
    
    // Count specific company searches for "Most Qs" or "Trending"
    @Query("SELECT s.company, COUNT(s) FROM SearchHistory s GROUP BY s.company ORDER BY COUNT(s) DESC")
    List<Object[]> findCompanySearchCounts();
}
