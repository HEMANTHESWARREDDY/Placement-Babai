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

    @Autowired
    private com.findmyjob.repository.FreeSessionRepository sessionRepository;

    @Override
    public void run(String... args) throws Exception {
        // Create initial free sessions if none exist
        if (sessionRepository.count() == 0) {
            com.findmyjob.model.FreeSession s1 = new com.findmyjob.model.FreeSession();
            s1.setTitle("Daily Mock Interview Call");
            s1.setDescription("Live technical & HR mock rounds with real-time feedback.");
            s1.setSchedule("7 PM IST");
            s1.setLink("https://meet.google.com/lookup/placementbabai");
            s1.setActive(true);
            sessionRepository.save(s1);

            com.findmyjob.model.FreeSession s2 = new com.findmyjob.model.FreeSession();
            s2.setTitle("Resume Review Workshop");
            s2.setDescription("Weekly group session for profile optimization and ATS checking.");
            s2.setSchedule("Every Saturday 11 AM IST");
            s2.setLink("https://meet.google.com/lookup/placementbabai-resume");
            s2.setActive(true);
            sessionRepository.save(s2);

            com.findmyjob.model.FreeSession s3 = new com.findmyjob.model.FreeSession();
            s3.setTitle("Q&A with Industry Mentors");
            s3.setDescription("Interactive session on career growth and placement strategies.");
            s3.setSchedule("Bi-weekly Sundays 4 PM IST");
            s3.setLink("https://meet.google.com/lookup/placementbabai-qa");
            s3.setActive(true);
            sessionRepository.save(s3);
            
            System.out.println("✅ Seeded initial free sessions");
        }

        // Backfill null is_deleted columns to false for existing jobs
        try {
            jdbcTemplate.execute("UPDATE jobs SET is_deleted = false WHERE is_deleted IS NULL");
            System.out.println("✅ Backfilled existing jobs where is_deleted was NULL");
        } catch (Exception e) {
            System.out.println("⚠️ Could not backfill is_deleted, perhaps table doesn't exist yet: " + e.getMessage());
        }
        // Backfill null is_available columns to true for existing mentors
        try {
            jdbcTemplate.execute("UPDATE mentors SET is_available = true WHERE is_available IS NULL");
            System.out.println("✅ Backfilled existing mentors where is_available was NULL");
        } catch (Exception e) {
            System.out.println("⚠️ Could not backfill is_available for mentors: " + e.getMessage());
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
