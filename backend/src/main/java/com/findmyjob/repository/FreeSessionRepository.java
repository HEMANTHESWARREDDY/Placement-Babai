package com.findmyjob.repository;

import com.findmyjob.model.FreeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FreeSessionRepository extends JpaRepository<FreeSession, Long> {
    List<FreeSession> findByActiveTrue();
}
