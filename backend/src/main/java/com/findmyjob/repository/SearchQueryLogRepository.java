package com.findmyjob.repository;

import com.findmyjob.model.SearchQueryLog;
import com.findmyjob.model.SearchQueryResult;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchQueryLogRepository extends MongoRepository<SearchQueryLog, String> {

    @Aggregation(pipeline = {
        "{ '$match': { 'searchedAt': { '$gt': ?0 } } }",
        "{ '$group': { '_id': '$keyword', 'count': { '$sum': 1 } } }",
        "{ '$sort': { 'count': -1 } }"
    })
    List<SearchQueryResult> findTopSearchesSince(LocalDateTime date);

    @Aggregation(pipeline = {
        "{ '$match': { 'searchedAt': { '$gte': ?0, '$lt': ?1 } } }",
        "{ '$group': { '_id': '$keyword', 'count': { '$sum': 1 } } }",
        "{ '$sort': { 'count': -1 } }"
    })
    List<SearchQueryResult> findTopSearchesBetween(LocalDateTime start, LocalDateTime end);
}
