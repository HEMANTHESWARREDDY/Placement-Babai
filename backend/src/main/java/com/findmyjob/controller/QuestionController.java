package com.findmyjob.controller;

import com.findmyjob.model.Question;
import com.findmyjob.model.SearchHistory;
import com.findmyjob.repository.QuestionRepository;
import com.findmyjob.repository.SearchHistoryRepository;
import com.findmyjob.service.GeminiInterviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "*")
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private SearchHistoryRepository searchHistoryRepository;

    @Autowired
    private GeminiInterviewService geminiInterviewService;

    @GetMapping("/{company}")
    public Map<String, List<Question>> getQuestionsByCompany(@PathVariable String company, @RequestParam(required = false) String role) {
        List<Question> questions = questionRepository.findByCompanyIgnoreCase(company);
        
        // If NO questions exist in DB, generate them in REAL-TIME via AI
        if (questions.isEmpty()) {
            List<Question> generated = geminiInterviewService.generateQuestions(company, role);
            if (!generated.isEmpty()) {
                questionRepository.saveAll(generated);
                questions = generated;
            }
        }

        // Log the search regardless (real-time community updates)
        if (role != null) {
            SearchHistory history = new SearchHistory();
            history.setCompany(company);
            history.setRole(role);
            history.setQuestionCount(questions.size());
            searchHistoryRepository.save(history);
        }

        // Group by category: HR, Technical, Coding
        return questions.stream()
                .collect(Collectors.groupingBy(Question::getCategory));
    }

    @GetMapping("/community")
    public List<SearchHistory> getCommunitySearches() {
        return searchHistoryRepository.findTop50ByOrderBySearchDateDesc();
    }

    // Helper to seed some data easily via API if needed (or just use for testing)
    @PostMapping("/seed")
    public String seedData() {
        if (questionRepository.count() > 0) return "Data already exists";

        String[][] data = {
            {"accenture", "HR", "Tell me about yourself?"},
            {"accenture", "HR", "Why Accenture?"},
            {"accenture", "Technical", "Explain SDLC models."},
            {"accenture", "Technical", "What is OOPs concept?"},
            {"accenture", "Coding", "Write a program to reverse a string."},
            {"tcs", "HR", "Where do you see yourself in 5 years?"},
            {"tcs", "Technical", "What is a primary key in SQL?"},
            {"infosys", "Coding", "Find the largest number in an array."},
            {"google", "Technical", "How does Google Search work?"},
            {"google", "Coding", "Implement a LRU Cache."},
            {"deloitte", "HR", "How do you handle conflict in a team?"}
        };

        for (String[] d : data) {
            Question q = new Question();
            q.setCompany(d[0]);
            q.setCategory(d[1]);
            q.setContent(d[2]);
            questionRepository.save(q);
        }

        // Also seed some search history
        String[][] historyData = {
            {"Accenture", "Infrastructure Engineer", "103"},
            {"Google", "Frontend Developer", "52"},
            {"TCS", "System Engineer", "45"}
        };
        for (String[] h : historyData) {
            SearchHistory sh = new SearchHistory();
            sh.setCompany(h[0]);
            sh.setRole(h[1]);
            sh.setQuestionCount(Integer.parseInt(h[2]));
            sh.setSearchDate(LocalDateTime.now().minusDays(1));
            searchHistoryRepository.save(sh);
        }

        return "Seeded questions and history";
    }
}
