package com.findmyjob.repository;

import com.findmyjob.model.DailyBugHunterQuiz;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyBugHunterQuizRepository extends MongoRepository<DailyBugHunterQuiz, String> {
    Optional<DailyBugHunterQuiz> findByDateStamp(String dateStamp);
    List<DailyBugHunterQuiz> findTop4ByOrderByDateStampDesc();
}
