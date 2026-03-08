package com.findmyjob.config;

import com.findmyjob.model.Admin;
import com.findmyjob.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Backfill null is_deleted columns to false for existing jobs
        try {
            jdbcTemplate.execute("UPDATE jobs SET is_deleted = false WHERE is_deleted IS NULL");
            System.out.println("✅ Backfilled existing jobs where is_deleted was NULL");
        } catch (Exception e) {
            System.out.println("⚠️ Could not backfill is_deleted, perhaps table doesn't exist yet: " + e.getMessage());
        }

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
