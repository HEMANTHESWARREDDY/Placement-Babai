package com.findmyjob.controller;

import com.findmyjob.model.Booking;
import com.findmyjob.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @PostMapping("/create")
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking) {
        booking.setCreatedAt(LocalDateTime.now());
        if (booking.getStatus() == null) {
            booking.setStatus("PENDING");
        }
        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    @GetMapping("/mentor/{mentorId}")
    public List<Booking> getBookingsByMentor(@PathVariable String mentorId) {
        return bookingRepository.findByMentorId(mentorId);
    }
    
    @GetMapping("/all")
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Booking> updateBookingStatus(
            @PathVariable String id, 
            @RequestParam String status,
            @RequestParam(required = false) String meetLink) {
        return bookingRepository.findById(id)
                .map(booking -> {
                    booking.setStatus(status);
                    if (meetLink != null) {
                        booking.setMeetLink(meetLink);
                    }
                    return ResponseEntity.ok(bookingRepository.save(booking));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable String id) {
        if (bookingRepository.existsById(id)) {
            bookingRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
