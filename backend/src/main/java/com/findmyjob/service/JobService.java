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
        return jobRepository.findByIsDeletedFalse();
    }

    public List<Job> getDeletedJobs() {
        return jobRepository.findByIsDeletedTrue();
    }

    public Optional<Job> getJobById(String id) {
        return jobRepository.findById(id);
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

        if (jobDetails.getExpiryDate() != null && isPastDate(jobDetails.getExpiryDate())) {
            throw new RuntimeException("Expiry date is not valid. It must be a future date.");
        }

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

    public void restoreJob(String id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        job.setIsDeleted(false);
        job.setDeletedAt(null);
        jobRepository.save(job);
    }

    public List<Job> searchJobs(String keyword) {
        return jobRepository.searchJobs(keyword);
    }

    public List<Job> searchByLocation(String location) {
        return jobRepository.findByLocationContainingIgnoreCaseAndIsDeletedFalse(location);
    }
}
