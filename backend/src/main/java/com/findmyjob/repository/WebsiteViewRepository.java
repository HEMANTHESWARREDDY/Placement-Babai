package com.findmyjob.repository;

import com.findmyjob.model.WebsiteView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

@Repository
public interface WebsiteViewRepository extends JpaRepository<WebsiteView, Long> {
    long countByViewedAtAfter(LocalDateTime date);

    long countByViewedAtBetween(LocalDateTime start, LocalDateTime end);
}
