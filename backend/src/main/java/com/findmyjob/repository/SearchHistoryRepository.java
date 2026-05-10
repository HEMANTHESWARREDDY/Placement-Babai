package com.findmyjob.repository;

import com.findmyjob.model.SearchHistory;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface SearchHistoryRepository extends MongoRepository<SearchHistory, String> {
    
    // Get latest community searches
    List<SearchHistory> findTop50ByOrderBySearchDateDesc();
    
    // Count specific company searches for "Most Qs" or "Trending"
    @Aggregation(pipeline = {
        "{ '$group': { '_id': '$company', 'count': { '$sum': 1 } } }",
        "{ '$sort': { 'count': -1 } }"
    })
    List<Map<String, Object>> findCompanySearchCounts();
}
