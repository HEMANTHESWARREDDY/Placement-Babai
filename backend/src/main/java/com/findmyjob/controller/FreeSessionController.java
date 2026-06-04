package com.findmyjob.controller;

import com.findmyjob.model.FreeSession;
import com.findmyjob.repository.FreeSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class FreeSessionController {

    @Autowired
    private FreeSessionRepository repository;

    @GetMapping
    public List<FreeSession> getAllSessions() {
        try {
            return repository.findByDeletedFalseOrderByCreatedAtDesc();
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in getAllSessions: " + e.getMessage() + ". Falling back to in-memory mock sessions.");
            return getMockSessions();
        }
    }

    @GetMapping("/active")
    public List<FreeSession> getActiveSessions() {
        try {
            return repository.findByActiveTrueAndDeletedFalse();
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in getActiveSessions: " + e.getMessage() + ". Falling back to in-memory mock sessions.");
            return getMockSessions();
        }
    }

    @GetMapping("/deleted")
    public List<FreeSession> getDeletedSessions() {
        try {
            return repository.findByDeletedTrueOrderByDeletedAtDesc();
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in getDeletedSessions: " + e.getMessage() + ". Returning empty list.");
            return new java.util.ArrayList<>();
        }
    }

    @PostMapping
    public ResponseEntity<?> createSession(@RequestBody FreeSession session) {
        try {
            FreeSession saved = repository.save(session);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(java.util.Map.of("message", "Database Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FreeSession> updateSession(@PathVariable String id, @RequestBody FreeSession details) {
        return repository.findById(id).map(session -> {
            session.setTitle(details.getTitle());
            session.setDescription(details.getDescription());
            session.setLink(details.getLink());
            session.setSchedule(details.getSchedule());
            session.setSkills(details.getSkills());
            session.setActive(details.isActive());
            session.setSessionDate(details.getSessionDate());
            return ResponseEntity.ok(repository.save(session));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/restore/{id}")
    public ResponseEntity<FreeSession> restoreSession(@PathVariable String id) {
        return repository.findById(id).map(session -> {
            session.setDeleted(false);
            session.setDeletedAt(null);
            return ResponseEntity.ok(repository.save(session));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable String id) {
        return repository.findById(id).map(session -> {
            session.setDeleted(true);
            session.setDeletedAt(java.time.LocalDateTime.now());
            repository.save(session);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/permanent/{id}")
    public ResponseEntity<Void> permanentDelete(@PathVariable String id) {
        return repository.findById(id).map(session -> {
            repository.delete(session);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/today-count")
    public long getTodayCount() {
        try {
            return repository.countBySessionDateAndActiveTrueAndDeletedFalse(java.time.LocalDate.now());
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in getTodayCount: " + e.getMessage() + ". Returning default count.");
            return 1;
        }
    }

    private List<FreeSession> getMockSessions() {
        java.util.List<FreeSession> mockSessions = new java.util.ArrayList<>();
        
        FreeSession s1 = new FreeSession();
        s1.setId("mock-session-1");
        s1.setTitle("Daily Mock Interview Call");
        s1.setDescription("Live technical & HR mock rounds with real-time feedback.");
        s1.setSchedule("7 PM IST");
        s1.setLink("https://meet.google.com/lookup/placementbabai");
        s1.setActive(true);
        s1.setSessionDate(java.time.LocalDate.now());
        mockSessions.add(s1);

        FreeSession s2 = new FreeSession();
        s2.setId("mock-session-2");
        s2.setTitle("Resume Review Workshop");
        s2.setDescription("Weekly group session for profile optimization and ATS checking.");
        s2.setSchedule("Every Saturday 11 AM IST");
        s2.setLink("https://meet.google.com/lookup/placementbabai-resume");
        s2.setActive(true);
        s2.setSessionDate(java.time.LocalDate.now().plusDays(2));
        mockSessions.add(s2);

        FreeSession s3 = new FreeSession();
        s3.setId("mock-session-3");
        s3.setTitle("Q&A with Industry Mentors");
        s3.setDescription("Interactive session on career growth and placement strategies.");
        s3.setSchedule("Bi-weekly Sundays 4 PM IST");
        s3.setLink("https://meet.google.com/lookup/placementbabai-qa");
        s3.setActive(true);
        s3.setSessionDate(java.time.LocalDate.now().plusDays(5));
        mockSessions.add(s3);
        
        return mockSessions;
    }
}
