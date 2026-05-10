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
        return repository.findByDeletedFalseOrderByCreatedAtDesc();
    }

    @GetMapping("/active")
    public List<FreeSession> getActiveSessions() {
        return repository.findByActiveTrueAndDeletedFalse();
    }

    @GetMapping("/deleted")
    public List<FreeSession> getDeletedSessions() {
        return repository.findByDeletedTrueOrderByDeletedAtDesc();
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
        return repository.countBySessionDateAndActiveTrueAndDeletedFalse(java.time.LocalDate.now());
    }
}
