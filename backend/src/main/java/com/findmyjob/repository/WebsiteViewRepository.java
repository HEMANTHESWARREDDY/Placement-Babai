package com.findmyjob.repository;

import com.findmyjob.model.WebsiteView;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

@Repository
public interface WebsiteViewRepository extends MongoRepository<WebsiteView, String> {
    long countByViewedAtAfter(LocalDateTime date);

    long countByViewedAtBetween(LocalDateTime start, LocalDateTime end);
}
