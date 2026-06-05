package com.findmyjob.service;

import com.findmyjob.model.Job;
import com.findmyjob.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    public List<Job> getAllJobs() {
        try {
            return jobRepository.findByIsDeletedFalse();
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in getAllJobs: " + e.getMessage() + ". Falling back to in-memory mock jobs.");
            return getMockJobs();
        }
    }

    public List<Job> getDeletedJobs() {
        try {
            return jobRepository.findByIsDeletedTrue();
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in getDeletedJobs: " + e.getMessage() + ". Returning empty list.");
            return new java.util.ArrayList<>();
        }
    }

    public Optional<Job> getJobById(String id) {
        try {
            return jobRepository.findById(id);
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in getJobById: " + e.getMessage() + ". Falling back to in-memory mock jobs.");
            return getMockJobs().stream().filter(j -> j.getId().equals(id)).findFirst();
        }
    }

    public Job createJob(Job job) {
        return jobRepository.save(job);
    }

    private boolean isPastDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty() || "Don't know".equalsIgnoreCase(dateStr.trim())) {
            return false;
        }
        try {
            java.time.LocalDate expiry;
            String trimmed = dateStr.trim();
            if (trimmed.contains("-")) {
                String[] parts = trimmed.split("-");
                if (parts[0].length() == 4) {
                    // YYYY-MM-DD
                    expiry = java.time.LocalDate.parse(trimmed);
                } else if (parts[0].length() == 2 && parts[2].length() == 4) {
                    // DD-MM-YYYY
                    expiry = java.time.LocalDate.of(
                        Integer.parseInt(parts[2]),
                        Integer.parseInt(parts[1]),
                        Integer.parseInt(parts[0])
                    );
                } else {
                    return false;
                }
            } else {
                return false;
            }
            java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
            return expiry.isBefore(today);
        } catch (Exception e) {
            return false;
        }
    }

    public Job updateJob(String id, Job jobDetails) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));

        job.setTitle(jobDetails.getTitle());
        job.setCompany(jobDetails.getCompany());
        job.setCompanyLogo(jobDetails.getCompanyLogo());
        job.setLocation(jobDetails.getLocation());
        job.setDescription(jobDetails.getDescription());
        job.setExperienceLevel(jobDetails.getExperienceLevel());
        job.setJobType(jobDetails.getJobType());
        job.setCategory(jobDetails.getCategory());
        job.setSkills(jobDetails.getSkills());
        job.setSalary(jobDetails.getSalary());
        job.setApplyLink(jobDetails.getApplyLink());
        job.setRole(jobDetails.getRole());
        job.setCompanyType(jobDetails.getCompanyType());
        job.setResponsibilities(jobDetails.getResponsibilities());
        job.setRequirements(jobDetails.getRequirements());
        job.setPassoutYear(jobDetails.getPassoutYear());
        job.setExpiryDate(jobDetails.getExpiryDate());

        // Move from history to jobs if it was deleted (expired) and is now updated with an acceptable date
        if (Boolean.TRUE.equals(job.getIsDeleted())) {
            job.setIsDeleted(false);
            job.setDeletedAt(null);
        }

        return jobRepository.save(job);
    }

    public void deleteJob(String id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        job.setIsDeleted(true);
        job.setDeletedAt(java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        jobRepository.save(job);
    }

    public void deleteJobPermanently(String id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        jobRepository.delete(job);
    }

    public void restoreJob(String id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        job.setIsDeleted(false);
        job.setDeletedAt(null);
        jobRepository.save(job);
    }

    public List<Job> searchJobs(String keyword) {
        try {
            return jobRepository.searchJobs(keyword);
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in searchJobs: " + e.getMessage() + ". Falling back to in-memory mock search.");
            if (keyword == null || keyword.trim().isEmpty()) {
                return getMockJobs();
            }
            String kw = keyword.toLowerCase().trim();
            java.util.List<Job> matched = new java.util.ArrayList<>();
            for (Job j : getMockJobs()) {
                if ((j.getTitle() != null && j.getTitle().toLowerCase().contains(kw)) ||
                    (j.getCompany() != null && j.getCompany().toLowerCase().contains(kw)) ||
                    (j.getLocation() != null && j.getLocation().toLowerCase().contains(kw)) ||
                    (j.getSkills() != null && j.getSkills().toLowerCase().contains(kw)) ||
                    (j.getPassoutYear() != null && j.getPassoutYear().toLowerCase().contains(kw))) {
                    matched.add(j);
                }
            }
            return matched;
        }
    }

    public List<Job> searchByLocation(String location) {
        try {
            return jobRepository.findByLocationContainingIgnoreCaseAndIsDeletedFalse(location);
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB query failed in searchByLocation: " + e.getMessage() + ". Falling back to in-memory mock search.");
            if (location == null || location.trim().isEmpty()) {
                return getMockJobs();
            }
            String loc = location.toLowerCase().trim();
            java.util.List<Job> matched = new java.util.ArrayList<>();
            for (Job j : getMockJobs()) {
                if (j.getLocation() != null && j.getLocation().toLowerCase().contains(loc)) {
                    matched.add(j);
                }
            }
            return matched;
        }
    }

    private List<Job> getMockJobs() {
        java.util.List<Job> mockJobs = new java.util.ArrayList<>();
        
        Job j1 = new Job();
        j1.setId("mock-1");
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
        mockJobs.add(j1);

        Job j2 = new Job();
        j2.setId("mock-2");
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
        mockJobs.add(j2);

        Job j3 = new Job();
        j3.setId("mock-3");
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
        mockJobs.add(j3);

        Job j4 = new Job();
        j4.setId("mock-4");
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
        mockJobs.add(j4);

        Job j5 = new Job();
        j5.setId("mock-5");
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
        mockJobs.add(j5);

        Job j6 = new Job();
        j6.setId("mock-6");
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
        mockJobs.add(j6);

        Job j7 = new Job();
        j7.setId("mock-7");
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
        mockJobs.add(j7);

        Job j8 = new Job();
        j8.setId("mock-8");
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
        mockJobs.add(j8);

        return mockJobs;
    }
}
