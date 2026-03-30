package com.findmyjob.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaUpdateConfig implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- STARTING MANUAL SCHEMA UPDATE ---");
        try {
            // Manually alter each column to TEXT to ensure character limits are removed in PostgreSQL
            String[] columns = {
                "apply_link", "category", "company", "company_logo", "company_type", 
                "description", "experience_level", "expiry_date", "location", 
                "passout_year", "requirements", "responsibilities", "role", 
                "salary", "skills", "title"
            };

            for (String column : columns) {
                try {
                    jdbcTemplate.execute("ALTER TABLE jobs ALTER COLUMN " + column + " TYPE TEXT");
                    System.out.println("Successfully altered column: " + column);
                } catch (Exception e) {
                    System.err.println("Note: Could not alter column " + column + " (it might already be TEXT): " + e.getMessage());
                }
            }
            System.out.println("--- SCHEMA UPDATE COMPLETED ---");
        } catch (Exception e) {
            System.err.println("Fatal error during schema update: " + e.getMessage());
        }
    }
}
