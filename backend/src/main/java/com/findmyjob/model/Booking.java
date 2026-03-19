package com.findmyjob.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long mentorId;
    private String mentorName;
    private String mentorEmail;
    private String serviceType;
    private Double price;
    private String guestName;
    private String guestEmail;
    private String guestWhatsapp;
    private String bookingDate; // Store as string for simplicity or LocalDate
    private String bookingTime; // Time slot like "10:30 AM"
    
    @Column(columnDefinition = "TEXT")
    private String customRequest;
    
    private String meetLink;
    
    private String status = "PENDING";
    private LocalDateTime createdAt = LocalDateTime.now();
}
