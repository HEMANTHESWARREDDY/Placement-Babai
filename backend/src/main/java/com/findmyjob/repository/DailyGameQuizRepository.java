package com.findmyjob.repository;

import com.findmyjob.model.DailyGameQuiz;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyGameQuizRepository extends MongoRepository<DailyGameQuiz, String> {
    Optional<DailyGameQuiz> findByGameTypeAndDateStamp(String gameType, String dateStamp);
    List<DailyGameQuiz> findTop4ByGameTypeOrderByDateStampDesc(String gameType);
}
