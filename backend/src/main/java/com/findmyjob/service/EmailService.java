package com.findmyjob.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String fromEmail;

    @org.springframework.scheduling.annotation.Async
    public void sendResetCode(String to, String code) {
        System.out.println("DEBUG: Code for " + to + " is " + code);
        
        if (mailSender == null || fromEmail == null || fromEmail.isEmpty()) {
            System.out.println("Email ignored - No JavaMailSender or MAIL_USERNAME configured.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Password Reset Code - PlacementBabai");
            message.setText("Your password reset code is: " + code + "\n\nThis code will expire in 10 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Email failed to send for " + to + ": " + e.getMessage());
        }
    }
}
