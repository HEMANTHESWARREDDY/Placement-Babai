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
@CrossOrigin(origins = "*")
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
    public List<Booking> getBookingsByMentor(@PathVariable Long mentorId) {
        return bookingRepository.findByMentorId(mentorId);
    }
    
    @GetMapping("/all")
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
}
