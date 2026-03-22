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

    public void sendResetCode(String to, String code) {
        System.out.println("DEBUG: Code for " + to + " is " + code);
        
        if (mailSender == null || fromEmail == null || fromEmail.isEmpty()) {
            System.out.println("Email ignored - No JavaMailSender or MAIL_USERNAME configured.");
            return;
        }

        try {
            System.out.println("Attempting to send reset code to " + to + " via " + fromEmail + "...");
            
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(mailSender.createMimeMessage(), "utf-8");
            helper.setFrom(fromEmail, "PlacementBabai");
            helper.setTo(to);
            helper.setSubject("Password Reset Code - PlacementBabai");
            helper.setText("Your password reset code is: <b>" + code + "</b><br><br>This code will expire in 10 minutes.", true);
            
            mailSender.send(helper.getMimeMessage());
            System.out.println("Email SENT SUCCESS for " + to);
        } catch (Exception e) {
            System.err.println("Email failed to send for " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
