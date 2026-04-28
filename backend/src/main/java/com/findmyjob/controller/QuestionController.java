package com.findmyjob.controller;

import com.findmyjob.model.Question;
import com.findmyjob.model.SearchHistory;
import com.findmyjob.repository.QuestionRepository;
import com.findmyjob.repository.SearchHistoryRepository;
import com.findmyjob.service.GeminiInterviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private SearchHistoryRepository searchHistoryRepository;

    @Autowired
    private GeminiInterviewService geminiInterviewService;

    @Autowired
    private com.findmyjob.service.ChatGPTInterviewService chatGPTInterviewService;

    @GetMapping("/trending-stats")
    public Map<String, Long> getTrendingStats() {
        return searchHistoryRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        h -> h.getCompany().substring(0, 1).toUpperCase() + h.getCompany().substring(1).toLowerCase(),
                        Collectors.counting()
                ));
    }

    @PostMapping("/record-search")
    public ResponseEntity<?> recordSearch(@RequestBody Map<String, String> body) {
        String company = body.get("company");
        String role = body.getOrDefault("role", "General");
        
        SearchHistory history = new SearchHistory();
        history.setCompany(company);
        history.setRole(role);
        history.setSearchDate(LocalDateTime.now());
        searchHistoryRepository.save(history);
        
        return ResponseEntity.ok("Recorded");
    }

    @GetMapping("/{company}")
    public Map<String, List<Question>> getQuestionsByCompany(@PathVariable String company) {
        List<Question> questions = questionRepository.findByCompanyIgnoreCase(company);
        
        // Instant response from DB (Fast + Reliable)
        // If DB is empty, we group an empty map (or we could trigger a basic seed/gen)
        return questions.stream()
                .collect(Collectors.groupingBy(Question::getCategory));
    }

    @GetMapping("/ai/frequently-asked")
    public Map<String, List<Question>> getAiFrequentlyAsked(
            @RequestParam String company, 
            @RequestParam(required = false, defaultValue = "All") String role,
            @RequestParam(required = false, defaultValue = "All") String category) {
        
        List<Question> generated;
        try {
            generated = geminiInterviewService.generateQuestions(company, role, category);
        } catch (Exception e) {
            System.err.println("[QuestionController] AI Failed (Freq), using fallback: " + e.getMessage());
            generated = new ArrayList<>();
        }

        if (generated == null || generated.isEmpty()) {
            generated = getFallbackQuestions(company, role);
        } else {
            questionRepository.saveAll(generated);
        }
        return generated.stream()
                .collect(Collectors.groupingBy(Question::getCategory));
    }

    @GetMapping("/ai/recently-asked")
    public Map<String, List<Question>> getAiRecentlyAsked(
            @RequestParam String company, 
            @RequestParam(required = false, defaultValue = "All") String role,
            @RequestParam(required = false, defaultValue = "All") String category) {
        
        List<Question> generated;
        try {
            generated = geminiInterviewService.generateQuestions(company, role, category);
        } catch (Exception e) {
            System.err.println("[QuestionController] AI Failed (Recent), using fallback: " + e.getMessage());
            generated = new ArrayList<>();
        }

        if (generated == null || generated.isEmpty()) {
            generated = getFallbackQuestions(company, role);
        } else {
            questionRepository.saveAll(generated);
        }
        return generated.stream()
                .collect(Collectors.groupingBy(Question::getCategory));
    }

    private List<Question> getFallbackQuestions(String company, String role) {
        List<Question> generated = new ArrayList<>();
        
        // Technical
        Question f1 = new Question();
        f1.setCompany(company.toLowerCase());
        f1.setRole(role);
        f1.setCategory("Technical");
        f1.setContent("What are the core values and culture of " + company + "?");
        f1.setAnswer("Accenture focuses on Client Value Creation, One Global Network, Respect for the Individual, Best People, Integrity, and Stewardship.");
        generated.add(f1);

        Question f4 = new Question();
        f4.setCompany(company.toLowerCase());
        f4.setRole(role);
        f4.setCategory("Technical");
        f4.setContent("How does " + company + " help clients with Digital Transformation?");
        f4.setAnswer("Accenture leverages Cloud, AI, and Automation to help businesses modernize their operations and improve customer experiences.");
        generated.add(f4);
        
        // HR
        Question f2 = new Question();
        f2.setCompany(company.toLowerCase());
        f2.setRole(role);
        f2.setCategory("HR");
        f2.setContent("Why are you interested in a career at " + company + "?");
        f2.setAnswer("I admire the company's innovation, global reach, and commitment to helping clients transform their businesses through technology.");
        generated.add(f2);

        Question f5 = new Question();
        f5.setCompany(company.toLowerCase());
        f5.setRole(role);
        f5.setCategory("HR");
        f5.setContent("Tell me about a time you worked in a diverse team at " + company + ".");
        f5.setAnswer("I enjoy working with people from different backgrounds to bring unique perspectives to problem-solving, which is a core value here.");
        generated.add(f5);

        // Managerial
        Question f3 = new Question();
        f3.setCompany(company.toLowerCase());
        f3.setRole(role);
        f3.setCategory("Managerial");
        f3.setContent("Describe a situation where you had to meet a tight deadline at " + company + ".");
        f3.setAnswer("I would prioritize tasks, maintain open communication with stakeholders, and work collaboratively with the team to ensure quality delivery.");
        generated.add(f3);

        Question f6 = new Question();
        f6.setCompany(company.toLowerCase());
        f6.setRole(role);
        f6.setCategory("Managerial");
        f6.setContent("How do you handle conflict within a project team at " + company + "?");
        f6.setAnswer("By addressing the issue early, listening to all perspectives, and finding a professional resolution that keeps the project on track.");
        generated.add(f6);
        
        return generated;
    }

    @GetMapping("/ai/role-based")
    public Map<String, List<Question>> getAiRoleBased(
            @RequestParam String company, 
            @RequestParam String role,
            @RequestParam(required = false, defaultValue = "All") String category) {
        
        List<Question> generated = geminiInterviewService.generateQuestions(company, role, category);
        if (!generated.isEmpty()) {
            questionRepository.saveAll(generated);
        }
        return generated.stream()
                .collect(Collectors.groupingBy(Question::getCategory));
    }

    @GetMapping("/community")
    public List<SearchHistory> getCommunitySearches() {
        return searchHistoryRepository.findTop50ByOrderBySearchDateDesc();
    }

    // Helper to seed some data easily via API if needed (or just use for testing)
    @PostMapping("/seed")
    public ResponseEntity<?> seedData() {
        String[] topCompanies = {"Accenture", "Deloitte", "TCS", "Infosys", "Capgemini"};
        int totalSeeded = 0;

        for (String company : topCompanies) {
            // Delete old data for these companies to avoid duplicates
            List<Question> existing = questionRepository.findByCompanyIgnoreCase(company);
            questionRepository.deleteAll(existing);

            // Manual Seeding (No API Key Required)
            List<Question> manualQuestions = getManualQuestions(company);
            questionRepository.saveAll(manualQuestions);
            totalSeeded += manualQuestions.size();
        }

        // Also seed some search history for the UI
        if (searchHistoryRepository.count() == 0) {
            String[][] historyData = {
                {"Accenture", "AI Engineer", "120"},
                {"Deloitte", "Data Analyst", "85"},
                {"TCS", "Software Engineer", "150"},
                {"Infosys", "System Engineer", "95"},
                {"Capgemini", "Full Stack Developer", "110"}
            };
            for (String[] h : historyData) {
                SearchHistory sh = new SearchHistory();
                sh.setCompany(h[0]);
                sh.setRole(h[1]);
                sh.setQuestionCount(Integer.parseInt(h[2]));
                sh.setSearchDate(LocalDateTime.now().minusDays(new Random().nextInt(5)));
                searchHistoryRepository.save(sh);
            }
        }

        return ResponseEntity.ok("Seeded " + totalSeeded + " common questions across top 5 companies.");
    }

    private List<Question> getManualQuestions(String company) {
        List<Question> qs = new ArrayList<>();
        
        if (company.equalsIgnoreCase("Infosys")) {
            // Technical (17)
            qs.add(new Question(null, company, "Technical", "Can you explain the concept of Object-Oriented Programming and its key principles?", ""));
            qs.add(new Question(null, company, "Technical", "How does encapsulation improve code maintainability? Provide an example.", ""));
            qs.add(new Question(null, company, "Technical", "What is inheritance and how is it implemented in programming?", ""));
            qs.add(new Question(null, company, "Technical", "Can you explain polymorphism with real-world examples?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between an abstract class and an interface?", ""));
            qs.add(new Question(null, company, "Technical", "What is a Database Management System, and why is it important?", ""));
            qs.add(new Question(null, company, "Technical", "Can you explain normalization and its different forms?", ""));
            qs.add(new Question(null, company, "Technical", "What is SQL, and how is it used in database operations?", ""));
            qs.add(new Question(null, company, "Technical", "How do SQL JOIN operations work? Explain different types.", ""));
            qs.add(new Question(null, company, "Technical", "What is an operating system and its primary functions?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between a process and a thread?", ""));
            qs.add(new Question(null, company, "Technical", "Can you explain what a deadlock is and how it can be prevented?", ""));
            qs.add(new Question(null, company, "Technical", "What are the different phases of the Software Development Life Cycle (SDLC)?", ""));
            qs.add(new Question(null, company, "Technical", "How does Agile methodology differ from traditional models?", ""));
            qs.add(new Question(null, company, "Technical", "What is cloud computing and what are its advantages?", ""));
            qs.add(new Question(null, company, "Technical", "What is a RESTful API and how does it work?", ""));
            qs.add(new Question(null, company, "Technical", "How do you analyze the time complexity of an algorithm?", ""));

            // Managerial (16)
            qs.add(new Question(null, company, "Managerial", "How do you prioritize tasks when working on multiple assignments?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe a team project you worked on and your role in it?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle situations where you have tight deadlines?", ""));
            qs.add(new Question(null, company, "Managerial", "How would you resolve a conflict within your team?", ""));
            qs.add(new Question(null, company, "Managerial", "What approach do you follow when you are assigned a task you are unfamiliar with?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you ensure effective communication within a team?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe a situation where you demonstrated leadership skills?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle constructive criticism from peers or supervisors?", ""));
            qs.add(new Question(null, company, "Managerial", "What strategies do you use to stay organized and productive?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you approach problem-solving in challenging situations?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you adapt to changes in project requirements?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you manage stress during high-pressure situations?", ""));
            qs.add(new Question(null, company, "Managerial", "What motivates you to perform well in a team environment?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you ensure the quality of your work before submission?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you give an example of how you handled failure and what you learned from it?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you balance learning new skills while managing ongoing tasks?", ""));

            // HR (17)
            qs.add(new Question(null, company, "HR", "Can you introduce yourself briefly?", ""));
            qs.add(new Question(null, company, "HR", "What motivates you to apply for Infosys?", ""));
            qs.add(new Question(null, company, "HR", "Why should we consider hiring you for this role?", ""));
            qs.add(new Question(null, company, "HR", "What are your key strengths and how do they help you professionally?", ""));
            qs.add(new Question(null, company, "HR", "Can you discuss a weakness and how you are working to improve it?", ""));
            qs.add(new Question(null, company, "HR", "Where do you see yourself in the next five years?", ""));
            qs.add(new Question(null, company, "HR", "Are you open to relocation and working in different environments?", ""));
            qs.add(new Question(null, company, "HR", "What drives you to achieve your goals?", ""));
            qs.add(new Question(null, company, "HR", "Can you share your most significant academic or personal achievement?", ""));
            qs.add(new Question(null, company, "HR", "Describe a situation where you faced failure. What did you learn from it?", ""));
            qs.add(new Question(null, company, "HR", "How do you handle stress or pressure in demanding situations?", ""));
            qs.add(new Question(null, company, "HR", "Why have you chosen a career in the IT industry?", ""));
            qs.add(new Question(null, company, "HR", "What are your long-term career aspirations?", ""));
            qs.add(new Question(null, company, "HR", "What are your hobbies and interests outside academics?", ""));
            qs.add(new Question(null, company, "HR", "How do you respond to feedback or criticism?", ""));
            qs.add(new Question(null, company, "HR", "Do you prefer working independently or as part of a team? Why?", ""));
            qs.add(new Question(null, company, "HR", "Do you have any questions for us?", ""));
            
            // Programming (10)
            qs.add(new Question(null, company, "Programming", "Find the first non-repeating character in a string.", ""));
            qs.add(new Question(null, company, "Programming", "Check if a string contains only digits.", ""));
            qs.add(new Question(null, company, "Programming", "Remove duplicates from a string.", ""));
            qs.add(new Question(null, company, "Programming", "Find the longest substring without repeating characters.", ""));
            qs.add(new Question(null, company, "Programming", "Rotate an array by k positions.", ""));
            qs.add(new Question(null, company, "Programming", "Merge two sorted arrays.", ""));
            qs.add(new Question(null, company, "Programming", "Find the intersection of two arrays.", ""));
            qs.add(new Question(null, company, "Programming", "Implement stack using array.", ""));
            qs.add(new Question(null, company, "Programming", "Check balanced parentheses.", ""));
            qs.add(new Question(null, company, "Programming", "Find the sum of all elements in a matrix.", ""));

        } else if (company.equalsIgnoreCase("Capgemini")) {
            // Technical (17)
            qs.add(new Question(null, company, "Technical", "Can you explain the principles of Object-Oriented Programming?", ""));
            qs.add(new Question(null, company, "Technical", "How does encapsulation help in building secure applications?", ""));
            qs.add(new Question(null, company, "Technical", "What is polymorphism and how is it used in real-world applications?", ""));
            qs.add(new Question(null, company, "Technical", "Can you explain inheritance and its advantages?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between a class and an object?", ""));
            qs.add(new Question(null, company, "Technical", "What is a Database Management System and its role in applications?", ""));
            qs.add(new Question(null, company, "Technical", "What is normalization and why is it important in databases?", ""));
            qs.add(new Question(null, company, "Technical", "How do SQL queries help in data retrieval?", ""));
            qs.add(new Question(null, company, "Technical", "What is a primary key and why is it important?", ""));
            qs.add(new Question(null, company, "Technical", "What are the main functions of an operating system?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between processes and threads?", ""));
            qs.add(new Question(null, company, "Technical", "Can you explain the phases of SDLC?", ""));
            qs.add(new Question(null, company, "Technical", "What is Agile methodology and why is it widely used?", ""));
            qs.add(new Question(null, company, "Technical", "What is cloud computing and its common service models?", ""));
            qs.add(new Question(null, company, "Technical", "What is an API and how does it enable communication between systems?", ""));
            qs.add(new Question(null, company, "Technical", "How does recursion work in programming?", ""));
            qs.add(new Question(null, company, "Technical", "How do you determine the time complexity of a program?", ""));

            // Managerial (16)
            qs.add(new Question(null, company, "Managerial", "How do you contribute effectively in a team environment?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you manage your work when facing tight deadlines?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle stressful situations at work?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe a situation where you took initiative or leadership?", ""));
            qs.add(new Question(null, company, "Managerial", "How would you resolve disagreements within your team?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you prioritize tasks when multiple deadlines overlap?", ""));
            qs.add(new Question(null, company, "Managerial", "What communication strategies do you use to convey your ideas clearly?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you approach learning new technologies or tools?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle feedback from your peers or mentors?", ""));
            qs.add(new Question(null, company, "Managerial", "What techniques do you use for effective time management?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you approach solving a complex problem?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you ensure you stay organized during a project?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you adapt when there are sudden changes in requirements?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe a failure and how you handled it?", ""));
            qs.add(new Question(null, company, "Managerial", "What motivates you to perform better in your work?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you ensure tasks are completed on time with quality?", ""));

            // HR (17)
            qs.add(new Question(null, company, "HR", "Can you tell us about yourself?", ""));
            qs.add(new Question(null, company, "HR", "What interests you about working at Capgemini?", ""));
            qs.add(new Question(null, company, "HR", "Why do you think you are a good fit for this role?", ""));
            qs.add(new Question(null, company, "HR", "What are your strengths and how do they benefit your work?", ""));
            qs.add(new Question(null, company, "HR", "What is one weakness you are currently working on?", ""));
            qs.add(new Question(null, company, "HR", "Where do you see yourself in the next five years?", ""));
            qs.add(new Question(null, company, "HR", "Are you comfortable relocating for this role?", ""));
            qs.add(new Question(null, company, "HR", "What motivates you to achieve success?", ""));
            qs.add(new Question(null, company, "HR", "Can you describe an achievement you are proud of?", ""));
            qs.add(new Question(null, company, "HR", "Tell us about a time you failed and what you learned.", ""));
            qs.add(new Question(null, company, "HR", "How do you manage stress or pressure?", ""));
            qs.add(new Question(null, company, "HR", "Why did you choose a career in the IT field?", ""));
            qs.add(new Question(null, company, "HR", "What are your long-term professional goals?", ""));
            qs.add(new Question(null, company, "HR", "What do you like to do in your free time?", ""));
            qs.add(new Question(null, company, "HR", "How do you react to constructive criticism?", ""));
            qs.add(new Question(null, company, "HR", "Do you prefer working individually or in a team? Why?", ""));
            qs.add(new Question(null, company, "HR", "Do you have any questions for us?", ""));
            
            // Programming (10)
            qs.add(new Question(null, company, "Programming", "Find the largest element in an array.", ""));
            qs.add(new Question(null, company, "Programming", "Reverse words in a sentence.", ""));
            qs.add(new Question(null, company, "Programming", "Count occurrences of each character in a string.", ""));
            qs.add(new Question(null, company, "Programming", "Check if two arrays are equal.", ""));
            qs.add(new Question(null, company, "Programming", "Find duplicate elements in an array.", ""));
            qs.add(new Question(null, company, "Programming", "Implement a queue using array.", ""));
            qs.add(new Question(null, company, "Programming", "Sort an array using bubble sort.", ""));
            qs.add(new Question(null, company, "Programming", "Find the transpose of a matrix.", ""));
            qs.add(new Question(null, company, "Programming", "Check if a string is a substring of another.", ""));
            qs.add(new Question(null, company, "Programming", "Find the power of a number using recursion.", ""));

        } else if (company.equalsIgnoreCase("Accenture")) {
            // Technical (17)
            qs.add(new Question(null, company, "Technical", "Can you explain the principles of Object-Oriented Programming with examples?", ""));
            qs.add(new Question(null, company, "Technical", "How does encapsulation help in designing secure and maintainable systems?", ""));
            qs.add(new Question(null, company, "Technical", "What is polymorphism and how is it implemented in programming languages?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between abstraction and encapsulation?", ""));
            qs.add(new Question(null, company, "Technical", "How does inheritance promote code reusability?", ""));
            qs.add(new Question(null, company, "Technical", "What is a Database Management System and its key advantages?", ""));
            qs.add(new Question(null, company, "Technical", "Can you explain normalization and why it is important?", ""));
            qs.add(new Question(null, company, "Technical", "What are SQL JOIN operations and their types?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between SQL and NoSQL databases?", ""));
            qs.add(new Question(null, company, "Technical", "What are the differences between a stack and a queue?", ""));
            qs.add(new Question(null, company, "Technical", "How does recursion work and where is it used?", ""));
            qs.add(new Question(null, company, "Technical", "How do you evaluate the time complexity of an algorithm?", ""));
            qs.add(new Question(null, company, "Technical", "What are the phases of the Software Development Life Cycle (SDLC)?", ""));
            qs.add(new Question(null, company, "Technical", "How does Agile methodology improve software development?", ""));
            qs.add(new Question(null, company, "Technical", "What is version control and how does Git help in development?", ""));
            qs.add(new Question(null, company, "Technical", "What is a RESTful API and how does it function?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between HTTP and HTTPS?", ""));

            // Managerial (16)
            qs.add(new Question(null, company, "Managerial", "How do you prioritize tasks when working on multiple assignments?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe your role in a team project?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you manage tight deadlines effectively?", ""));
            qs.add(new Question(null, company, "Managerial", "How would you handle conflicts within a team?", ""));
            qs.add(new Question(null, company, "Managerial", "What steps do you take when assigned an unfamiliar task?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you ensure effective communication in a team?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you share an example where you demonstrated leadership?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle feedback and improve from it?", ""));
            qs.add(new Question(null, company, "Managerial", "What strategies do you use to stay organized and productive?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you approach solving complex problems?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you adapt to changes in project requirements?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you manage stress during high-pressure situations?", ""));
            qs.add(new Question(null, company, "Managerial", "What motivates you to perform well in a team?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you ensure quality in your work before submission?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe a situation where you faced failure and what you learned?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you balance learning new skills alongside your responsibilities?", ""));

            // HR (17)
            qs.add(new Question(null, company, "HR", "Can you briefly introduce yourself?", ""));
            qs.add(new Question(null, company, "HR", "Why do you want to work at Accenture?", ""));
            qs.add(new Question(null, company, "HR", "Why should we hire you for this role?", ""));
            qs.add(new Question(null, company, "HR", "What are your strengths and how do they help you professionally?", ""));
            qs.add(new Question(null, company, "HR", "Can you discuss a weakness and how you are improving it?", ""));
            qs.add(new Question(null, company, "HR", "Where do you see yourself in the next five years?", ""));
            qs.add(new Question(null, company, "HR", "Are you open to relocation?", ""));
            qs.add(new Question(null, company, "HR", "What motivates you to achieve your goals?", ""));
            qs.add(new Question(null, company, "HR", "Can you share an achievement you are proud of?", ""));
            qs.add(new Question(null, company, "HR", "Describe a failure and what you learned from it.", ""));
            qs.add(new Question(null, company, "HR", "How do you handle stress or pressure?", ""));
            qs.add(new Question(null, company, "HR", "Why did you choose a career in IT?", ""));
            qs.add(new Question(null, company, "HR", "What are your long-term career goals?", ""));
            qs.add(new Question(null, company, "HR", "What are your hobbies and interests?", ""));
            qs.add(new Question(null, company, "HR", "How do you respond to constructive criticism?", ""));
            qs.add(new Question(null, company, "HR", "Do you prefer working individually or in a team? Why?", ""));
            qs.add(new Question(null, company, "HR", "Do you have any questions for us?", ""));
            
            // Programming (10)
            qs.add(new Question(null, company, "Programming", "Find the second largest element in an array.", ""));
            qs.add(new Question(null, company, "Programming", "Reverse a string without using built-in functions.", ""));
            qs.add(new Question(null, company, "Programming", "Check whether a number is a palindrome.", ""));
            qs.add(new Question(null, company, "Programming", "Count the frequency of elements in an array.", ""));
            qs.add(new Question(null, company, "Programming", "Find the missing number in an array (1 to n).", ""));
            qs.add(new Question(null, company, "Programming", "Check if two strings are anagrams.", ""));
            qs.add(new Question(null, company, "Programming", "Move all zeros to the end of an array.", ""));
            qs.add(new Question(null, company, "Programming", "Find the largest subarray sum (Kadane’s Algorithm).", ""));
            qs.add(new Question(null, company, "Programming", "Remove duplicates from an array.", ""));
            qs.add(new Question(null, company, "Programming", "Find the factorial of a number using recursion.", ""));

        } else if (company.equalsIgnoreCase("Deloitte")) {
            // Technical (17)
            qs.add(new Question(null, company, "Technical", "What is data analysis and why is it important in decision-making?", ""));
            qs.add(new Question(null, company, "Technical", "How is Python used in data analysis and automation?", ""));
            qs.add(new Question(null, company, "Technical", "Can you explain how Pandas is used for data manipulation?", ""));
            qs.add(new Question(null, company, "Technical", "What is SQL and how is it used in handling data?", ""));
            qs.add(new Question(null, company, "Technical", "What are SQL JOINs and how do they work?", ""));
            qs.add(new Question(null, company, "Technical", "What is data cleaning and why is it important?", ""));
            qs.add(new Question(null, company, "Technical", "What is data visualization and which tools have you used?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between lists and tuples in Python?", ""));
            qs.add(new Question(null, company, "Technical", "What is an API and how does it work?", ""));
            qs.add(new Question(null, company, "Technical", "What is JSON and where is it used?", ""));
            qs.add(new Question(null, company, "Technical", "What is cloud computing and its key benefits?", ""));
            qs.add(new Question(null, company, "Technical", "What is machine learning and its types?", ""));
            qs.add(new Question(null, company, "Technical", "What is regression analysis?", ""));
            qs.add(new Question(null, company, "Technical", "What is classification in machine learning?", ""));
            qs.add(new Question(null, company, "Technical", "How is Excel used in data analysis?", ""));
            qs.add(new Question(null, company, "Technical", "What is the ETL process?", ""));
            qs.add(new Question(null, company, "Technical", "What are key steps in analyzing a dataset?", ""));

            // Managerial (16)
            qs.add(new Question(null, company, "Managerial", "How do you approach solving business problems?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe a situation where you worked in a team?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you manage multiple tasks and deadlines?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you communicate complex ideas clearly?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle client expectations?", ""));
            qs.add(new Question(null, company, "Managerial", "What steps do you take when facing an unfamiliar problem?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you prioritize tasks in a project?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle feedback from team members?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you stay organized during multiple assignments?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle stressful situations?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe a leadership experience?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you deal with disagreements in a team?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you adapt to changing business requirements?", ""));
            qs.add(new Question(null, company, "Managerial", "What motivates you in a professional environment?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you ensure accuracy in your work?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you share an example of learning from failure?", ""));

            // HR (17)
            qs.add(new Question(null, company, "HR", "Can you introduce yourself?", ""));
            qs.add(new Question(null, company, "HR", "Why do you want to join Deloitte?", ""));
            qs.add(new Question(null, company, "HR", "Why should we hire you?", ""));
            qs.add(new Question(null, company, "HR", "What are your strengths?", ""));
            qs.add(new Question(null, company, "HR", "What is one weakness you are working on?", ""));
            qs.add(new Question(null, company, "HR", "Where do you see yourself in five years?", ""));
            qs.add(new Question(null, company, "HR", "Why are you interested in consulting?", ""));
            qs.add(new Question(null, company, "HR", "Are you willing to relocate?", ""));
            qs.add(new Question(null, company, "HR", "What motivates you?", ""));
            qs.add(new Question(null, company, "HR", "Can you describe an achievement you are proud of?", ""));
            qs.add(new Question(null, company, "HR", "Tell us about a failure and what you learned.", ""));
            qs.add(new Question(null, company, "HR", "How do you handle stress?", ""));
            qs.add(new Question(null, company, "HR", "Why did you choose this career path?", ""));
            qs.add(new Question(null, company, "HR", "What are your long-term goals?", ""));
            qs.add(new Question(null, company, "HR", "What are your hobbies?", ""));
            qs.add(new Question(null, company, "HR", "How do you handle criticism?", ""));
            qs.add(new Question(null, company, "HR", "Do you have any questions for us?", ""));
            
            // Programming (10)
            qs.add(new Question(null, company, "Programming", "Find the maximum and minimum element in an array.", ""));
            qs.add(new Question(null, company, "Programming", "Reverse an array in-place.", ""));
            qs.add(new Question(null, company, "Programming", "Count vowels and consonants in a string.", ""));
            qs.add(new Question(null, company, "Programming", "Check if a string is a palindrome.", ""));
            qs.add(new Question(null, company, "Programming", "Find common elements between two arrays.", ""));
            qs.add(new Question(null, company, "Programming", "Sort an array using any sorting algorithm.", ""));
            qs.add(new Question(null, company, "Programming", "Implement linear search and binary search.", ""));
            qs.add(new Question(null, company, "Programming", "Find the sum of digits of a number.", ""));
            qs.add(new Question(null, company, "Programming", "Check if a number is prime.", ""));
            qs.add(new Question(null, company, "Programming", "Print Fibonacci series up to n terms.", ""));

        } else if (company.equalsIgnoreCase("TCS")) {
            // Technical (17)
            qs.add(new Question(null, company, "Technical", "What is the difference between C and Java?", ""));
            qs.add(new Question(null, company, "Technical", "What are pointers and how are they used?", ""));
            qs.add(new Question(null, company, "Technical", "What is an array and how is it used?", ""));
            qs.add(new Question(null, company, "Technical", "What is a linked list and how does it differ from arrays?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between stack and queue?", ""));
            qs.add(new Question(null, company, "Technical", "What is an operating system and its functions?", ""));
            qs.add(new Question(null, company, "Technical", "What is the difference between process and thread?", ""));
            qs.add(new Question(null, company, "Technical", "What is DBMS and its advantages?", ""));
            qs.add(new Question(null, company, "Technical", "What is normalization in databases?", ""));
            qs.add(new Question(null, company, "Technical", "What is SQL and how is it used?", ""));
            qs.add(new Question(null, company, "Technical", "What is an IP address and its types?", ""));
            qs.add(new Question(null, company, "Technical", "What is DNS and how does it work?", ""));
            qs.add(new Question(null, company, "Technical", "What are the phases of SDLC?", ""));
            qs.add(new Question(null, company, "Technical", "What is Agile methodology?", ""));
            qs.add(new Question(null, company, "Technical", "What is cloud computing?", ""));
            qs.add(new Question(null, company, "Technical", "How does recursion work?", ""));
            qs.add(new Question(null, company, "Technical", "How do you analyze time complexity?", ""));

            // Managerial (16)
            qs.add(new Question(null, company, "Managerial", "How do you work effectively in a team?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you manage your time during tight deadlines?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle pressure situations?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe a leadership experience?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you resolve conflicts in a team?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you prioritize your tasks?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you learn new skills quickly?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you communicate effectively with team members?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you handle feedback?", ""));
            qs.add(new Question(null, company, "Managerial", "What is your approach to problem-solving?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you manage multiple responsibilities?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you adapt to changes?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you stay motivated?", ""));
            qs.add(new Question(null, company, "Managerial", "Can you describe a failure and what you learned from it?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you ensure your work is accurate?", ""));
            qs.add(new Question(null, company, "Managerial", "How do you balance work and learning?", ""));

            // HR (17)
            qs.add(new Question(null, company, "HR", "Can you tell us about yourself?", ""));
            qs.add(new Question(null, company, "HR", "Why do you want to join TCS?", ""));
            qs.add(new Question(null, company, "HR", "Why should we hire you?", ""));
            qs.add(new Question(null, company, "HR", "What are your strengths?", ""));
            qs.add(new Question(null, company, "HR", "What are your weaknesses?", ""));
            qs.add(new Question(null, company, "HR", "Where do you see yourself in five years?", ""));
            qs.add(new Question(null, company, "HR", "Are you willing to relocate?", ""));
            qs.add(new Question(null, company, "HR", "What motivates you?", ""));
            qs.add(new Question(null, company, "HR", "What is your biggest achievement?", ""));
            qs.add(new Question(null, company, "HR", "Tell us about a failure and what you learned.", ""));
            qs.add(new Question(null, company, "HR", "How do you handle stress?", ""));
            qs.add(new Question(null, company, "HR", "Why did you choose IT as a career?", ""));
            qs.add(new Question(null, company, "HR", "What are your long-term goals?", ""));
            qs.add(new Question(null, company, "HR", "What are your hobbies?", ""));
            qs.add(new Question(null, company, "HR", "How do you handle criticism?", ""));
            qs.add(new Question(null, company, "HR", "Do you prefer working in a team or individually? Why?", ""));
            qs.add(new Question(null, company, "HR", "Do you have any questions for us?", ""));
            
            // Programming (10)
            qs.add(new Question(null, company, "Programming", "Swap two numbers without using a third variable.", ""));
            qs.add(new Question(null, company, "Programming", "Find the GCD of two numbers.", ""));
            qs.add(new Question(null, company, "Programming", "Check whether a number is Armstrong.", ""));
            qs.add(new Question(null, company, "Programming", "Reverse a number.", ""));
            qs.add(new Question(null, company, "Programming", "Find the largest of three numbers.", ""));
            qs.add(new Question(null, company, "Programming", "Count digits in a number.", ""));
            qs.add(new Question(null, company, "Programming", "Print multiplication table of a number.", ""));
            qs.add(new Question(null, company, "Programming", "Find LCM of two numbers.", ""));
            qs.add(new Question(null, company, "Programming", "Check if a year is a leap year.", ""));
            qs.add(new Question(null, company, "Programming", "Convert decimal to binary.", ""));

        } else {
            // Default common questions for others
            String category = "Most Common";
            qs.add(new Question(null, company, category, "General", "Tell me about yourself.", ""));
            qs.add(new Question(null, company, category, "Why do you want to join " + company + "?", ""));
            qs.add(new Question(null, company, category, "What are your strengths and weaknesses?", ""));
        }

        return qs;
    }
}
