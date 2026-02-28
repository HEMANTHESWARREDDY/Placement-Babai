package com.findmyjob.config;

import com.findmyjob.model.Admin;
import com.findmyjob.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create default admin if it doesn't exist
        if (!adminRepository.existsByUsername("Bobby")) {
            Admin admin = new Admin();
            admin.setUsername("Bobby");
            admin.setEmail("bobby@placementbabai.com");
            admin.setPassword(passwordEncoder.encode("PlacementBabai@14"));
            admin.setCreatedAt(LocalDateTime.now());
            adminRepository.save(admin);
            System.out.println("✅ Default admin created: username=Bobby, password=PlacementBabai@14");
        } else {
            System.out.println("ℹ️ Bobby admin user already exists.");
        }
    }
}
