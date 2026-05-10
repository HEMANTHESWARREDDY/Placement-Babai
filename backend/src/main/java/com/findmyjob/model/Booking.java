package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import java.time.LocalDateTime;

@Document(collection = "bookings")
@Data
public class Booking {
    @Id
    private String id;

    private String mentorId;
    private String mentorName;
    private String mentorEmail;
    private String serviceType;
    private Double price;
    private String guestName;
    private String guestEmail;
    private String guestWhatsapp;
    private String bookingDate; // Store as string for simplicity or LocalDate
    private String bookingTime; // Time slot like "10:30 AM"
    
    private String customRequest;
    
    private String meetLink;
    
    private String status = "PENDING";
    private LocalDateTime createdAt = LocalDateTime.now();
}
