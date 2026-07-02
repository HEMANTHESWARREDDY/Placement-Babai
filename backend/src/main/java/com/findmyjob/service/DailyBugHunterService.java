package com.findmyjob.service;

import com.findmyjob.model.BugHunterQuestion;
import com.findmyjob.model.DailyBugHunterQuiz;
import com.findmyjob.repository.DailyBugHunterQuizRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DailyBugHunterService {

    private static final Logger logger = LoggerFactory.getLogger(DailyBugHunterService.class);

    @Autowired
    private DailyBugHunterQuizRepository dailyBugHunterQuizRepository;

    @Autowired
    private GeminiInterviewService geminiInterviewService;

    // Get today's quiz
    public List<BugHunterQuestion> getDailyQuiz() {
        String dateStamp = LocalDate.now(ZoneId.of("Asia/Kolkata")).format(DateTimeFormatter.ISO_LOCAL_DATE);
        Optional<DailyBugHunterQuiz> existing = dailyBugHunterQuizRepository.findByDateStamp(dateStamp);
        if (existing.isPresent()) {
            return existing.get().getQuestions();
        }
        
        // Generate on-the-fly (self-seeding / fallback)
        logger.info("Daily Bug Hunter quiz not found for date {}, generating on-the-fly...", dateStamp);
        return generateAndSaveQuizForDate(dateStamp);
    }

    // Generate and save quiz for a specific date stamp
    public synchronized List<BugHunterQuestion> generateAndSaveQuizForDate(String dateStamp) {
        // Double check in case another thread generated it while we were waiting
        Optional<DailyBugHunterQuiz> existing = dailyBugHunterQuizRepository.findByDateStamp(dateStamp);
        if (existing.isPresent()) {
            return existing.get().getQuestions();
        }

        // Fetch last 4 days' quizzes to exclude their questions
        List<DailyBugHunterQuiz> recent = dailyBugHunterQuizRepository.findTop4ByOrderByDateStampDesc();
        List<String> excludedTitles = new ArrayList<>();
        for (DailyBugHunterQuiz quiz : recent) {
            if (quiz.getQuestions() != null) {
                for (BugHunterQuestion q : quiz.getQuestions()) {
                    excludedTitles.add(q.getTitle());
                }
            }
        }

        logger.info("Generating daily Bug Hunter quiz for {} excluding titles: {}", dateStamp, excludedTitles);
        List<BugHunterQuestion> questions = geminiInterviewService.generateBugHunterQuestions(excludedTitles);

        DailyBugHunterQuiz quiz = new DailyBugHunterQuiz();
        quiz.setDateStamp(dateStamp);
        quiz.setQuestions(questions);
        quiz.setCreatedAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));

        dailyBugHunterQuizRepository.save(quiz);
        logger.info("Successfully generated and saved daily Bug Hunter quiz for {}", dateStamp);

        return questions;
    }
}
