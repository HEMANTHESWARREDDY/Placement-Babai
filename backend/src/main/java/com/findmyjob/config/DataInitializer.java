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


    @Autowired
    private com.findmyjob.repository.FreeSessionRepository sessionRepository;

    @Autowired
    private com.findmyjob.repository.JobRepository jobRepository;

    @Override
    public void run(String... args) throws Exception {
        try {
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

            // Seed sample jobs if none exist
            if (jobRepository.count() == 0) {
                com.findmyjob.model.Job j1 = new com.findmyjob.model.Job();
                j1.setTitle("Java Full Stack Developer");
                j1.setCompany("Infosys");
                j1.setCompanyLogo("I");
                j1.setLocation("Pune");
                j1.setDescription("We are looking for a Java Full Stack Developer with experience in Spring Boot and React.");
                j1.setExperienceLevel("1-3 years");
                j1.setJobType("Full-time");
                j1.setCategory("Development");
                j1.setSkills("Java, Spring Boot, React, JavaScript, SQL");
                j1.setSalary("₹ 5,00,000 - ₹ 8,00,000 P.A.");
                j1.setApplyLink("https://infosys.com/careers");
                j1.setRole("Full Stack Developer");
                j1.setCompanyType("IT Services");
                j1.setPassoutYear("2023, 2024");
                j1.setIsDeleted(false);
                jobRepository.save(j1);

                com.findmyjob.model.Job j2 = new com.findmyjob.model.Job();
                j2.setTitle("Junior Java Developer");
                j2.setCompany("Rezo.ai");
                j2.setCompanyLogo("R");
                j2.setLocation("Remote (India)");
                j2.setDescription("Join our AI team to build robust backend systems using Java and Spring Boot.");
                j2.setExperienceLevel("0-2 years");
                j2.setJobType("Full-time");
                j2.setCategory("Development");
                j2.setSkills("Java, Spring Boot, Rest API, Hibernate");
                j2.setSalary("₹ 4,00,000 - ₹ 6,00,000 P.A.");
                j2.setApplyLink("https://rezo.ai/careers");
                j2.setRole("Backend Developer");
                j2.setCompanyType("Product Startup");
                j2.setPassoutYear("2024, 2025");
                j2.setIsDeleted(false);
                jobRepository.save(j2);

                com.findmyjob.model.Job j3 = new com.findmyjob.model.Job();
                j3.setTitle("Python Intern");
                j3.setCompany("Executive Softway");
                j3.setCompanyLogo("E");
                j3.setLocation("Karimnagar");
                j3.setDescription("Great opportunity for engineering freshers to work on real-world Python and Django projects.");
                j3.setExperienceLevel("Freshers");
                j3.setJobType("Internship");
                j3.setCategory("Internship");
                j3.setSkills("Python, Django, HTML, CSS, Databases");
                j3.setSalary("₹ 10,000 - ₹ 15,000 /month");
                j3.setApplyLink("https://executivesoftway.com");
                j3.setRole("Python Intern");
                j3.setCompanyType("Software Agency");
                j3.setPassoutYear("2025, 2026");
                j3.setIsDeleted(false);
                jobRepository.save(j3);

                com.findmyjob.model.Job j4 = new com.findmyjob.model.Job();
                j4.setTitle("Computer Operator");
                j4.setCompany("Hemanth Kumar Proprietor");
                j4.setCompanyLogo("H");
                j4.setLocation("Local");
                j4.setDescription("Looking for a skilled computer operator for data entry, office administration, and document management.");
                j4.setExperienceLevel("0-1 year");
                j4.setJobType("Full-time");
                j4.setCategory("Administration");
                j4.setSkills("MS Office, Excel, Data Entry, English Typing");
                j4.setSalary("₹ 1,80,000 - ₹ 2,40,000 P.A.");
                j4.setApplyLink("#");
                j4.setRole("Data Entry Operator");
                j4.setCompanyType("Proprietorship");
                j4.setPassoutYear("Any");
                j4.setIsDeleted(false);
                jobRepository.save(j4);

                com.findmyjob.model.Job j5 = new com.findmyjob.model.Job();
                j5.setTitle("Frontend Developer");
                j5.setCompany("TechCorp");
                j5.setCompanyLogo("T");
                j5.setLocation("Bangalore");
                j5.setDescription("Looking for a passionate frontend developer proficient in React and modern CSS styling.");
                j5.setExperienceLevel("2-4 years");
                j5.setJobType("Full-time");
                j5.setCategory("Development");
                j5.setSkills("React, JavaScript, HTML5, CSS3, Tailwind");
                j5.setSalary("₹ 6,00,000 - ₹ 10,00,000 P.A.");
                j5.setApplyLink("https://techcorp.com/jobs");
                j5.setRole("Frontend Engineer");
                j5.setCompanyType("Enterprise");
                j5.setPassoutYear("2022, 2023");
                j5.setIsDeleted(false);
                jobRepository.save(j5);

                com.findmyjob.model.Job j6 = new com.findmyjob.model.Job();
                j6.setTitle("Backend Developer");
                j6.setCompany("CloudTech");
                j6.setCompanyLogo("C");
                j6.setLocation("Hyderabad");
                j6.setDescription("Build high-performance REST APIs and microservices on AWS cloud databases.");
                j6.setExperienceLevel("1-3 years");
                j6.setJobType("Full-time");
                j6.setCategory("Development");
                j6.setSkills("Java, Spring Boot, AWS, Docker, MongoDB");
                j6.setSalary("₹ 7,00,000 - ₹ 11,00,000 P.A.");
                j6.setApplyLink("https://cloudtech.io/careers");
                j6.setRole("Backend Engineer");
                j6.setCompanyType("Cloud Solutions");
                j6.setPassoutYear("2023, 2024");
                j6.setIsDeleted(false);
                jobRepository.save(j6);

                com.findmyjob.model.Job j7 = new com.findmyjob.model.Job();
                j7.setTitle("Data Analyst");
                j7.setCompany("Analytics Pro");
                j7.setCompanyLogo("A");
                j7.setLocation("Mumbai");
                j7.setDescription("Translate raw business data into actionable marketing insights and visualization dashboards.");
                j7.setExperienceLevel("0-2 years");
                j7.setJobType("Full-time");
                j7.setCategory("Analytics");
                j7.setSkills("Python, SQL, Tableau, Power BI, Excel");
                j7.setSalary("₹ 4,50,000 - ₹ 7,00,000 P.A.");
                j7.setApplyLink("https://analyticspro.com");
                j7.setRole("Data Analyst");
                j7.setCompanyType("Consulting");
                j7.setPassoutYear("2024, 2025");
                j7.setIsDeleted(false);
                jobRepository.save(j7);

                com.findmyjob.model.Job j8 = new com.findmyjob.model.Job();
                j8.setTitle("UI/UX Designer");
                j8.setCompany("Design Studio");
                j8.setCompanyLogo("D");
                j8.setLocation("Delhi");
                j8.setDescription("Shape beautiful, modern product layouts and mockups inside Figma.");
                j8.setExperienceLevel("1-3 years");
                j8.setJobType("Full-time");
                j8.setCategory("Design");
                j8.setSkills("Figma, Adobe XD, Wireframing, UX Research");
                j8.setSalary("₹ 5,00,000 - ₹ 8,50,000 P.A.");
                j8.setApplyLink("https://designstudio.com");
                j8.setRole("UI/UX Designer");
                j8.setCompanyType("Design Agency");
                j8.setPassoutYear("2023, 2024");
                j8.setIsDeleted(false);
                jobRepository.save(j8);

                System.out.println("✅ Seeded initial sample jobs");
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
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB connection failed during data seeding: " + e.getMessage());
            System.err.println("ℹ️ Server will continue starting in offline / mock mode.");
        }
    }
}
