package com.findmyjob.controller;

import com.findmyjob.model.FreeSession;
import com.findmyjob.repository.FreeSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class FreeSessionController {

    @Autowired
    private FreeSessionRepository repository;

    @GetMapping
    public List<FreeSession> getAllSessions() {
        return repository.findAll();
    }

    @GetMapping("/active")
    public List<FreeSession> getActiveSessions() {
        return repository.findByActiveTrue();
    }

    @PostMapping
    public FreeSession createSession(@RequestBody FreeSession session) {
        return repository.save(session);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FreeSession> updateSession(@PathVariable Long id, @RequestBody FreeSession details) {
        return repository.findById(id).map(session -> {
            session.setTitle(details.getTitle());
            session.setDescription(details.getDescription());
            session.setLink(details.getLink());
            session.setSchedule(details.getSchedule());
            session.setActive(details.isActive());
            return ResponseEntity.ok(repository.save(session));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        return repository.findById(id).map(session -> {
            repository.delete(session);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
