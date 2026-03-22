package com.findmyjob.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendResetCode(String to, String code) {
        if (mailSender == null) {
            System.out.println("No JavaMailSender found. Code for " + to + ": " + code);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("placementbabai@gmail.com");
            message.setTo(to);
            message.setSubject("Password Reset Code - PlacementBabai");
            message.setText("Your password reset code is: " + code + "\n\nThis code will expire in 10 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
            // Log code even if it fails so it can be manually shared if needed
            System.out.println("Code for " + to + ": " + code);
        }
    }
}
