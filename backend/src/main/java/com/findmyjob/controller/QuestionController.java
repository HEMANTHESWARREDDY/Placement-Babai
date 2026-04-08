package com.findmyjob.controller;

import com.findmyjob.model.Question;
import com.findmyjob.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "*")
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @GetMapping("/{company}")
    public Map<String, List<Question>> getQuestionsByCompany(@PathVariable String company) {
        List<Question> questions = questionRepository.findByCompanyIgnoreCase(company);
        
        // Group by category: HR, Technical, Coding
        return questions.stream()
                .collect(Collectors.groupingBy(Question::getCategory));
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
            {"infosys", "Coding", "Find the largest number in an array."}
        };

        for (String[] d : data) {
            Question q = new Question();
            q.setCompany(d[0]);
            q.setCategory(d[1]);
            q.setContent(d[2]);
            questionRepository.save(q);
        }

        return "Seeded " + data.length + " questions";
    }
}
