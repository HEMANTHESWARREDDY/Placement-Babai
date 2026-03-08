package com.findmyjob.service;

import com.findmyjob.model.Job;
import com.findmyjob.repository.JobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class JobSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(JobSchedulerService.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobService jobService;

    // Run every day at 11:59 PM (23:59:00)
    @Scheduled(cron = "0 59 23 * * ?")
    @Transactional
    public void autoDeleteExpiredJobs() {
        logger.info("Running scheduled task to auto-delete expired jobs...");
        List<Job> activeJobs = jobRepository.findByIsDeletedFalse();
        LocalDate today = LocalDate.now();

        int deletedCount = 0;
        for (Job job : activeJobs) {
            if (job.getExpiryDate() != null && !job.getExpiryDate().trim().isEmpty()) {
                try {
                    LocalDate expiry = LocalDate.parse(job.getExpiryDate().trim());
                    // If the expiry date is today or earlier
                    if (!expiry.isAfter(today)) {
                        jobService.deleteJob(job.getId());
                        deletedCount++;
                        logger.info("Soft-deleted expired job with ID: {}", job.getId());
                    }
                } catch (DateTimeParseException e) {
                    // Ignore parsing errors for formats like "Don't know"
                    logger.debug("Could not parse expiry date '{}' for Job ID: {}", job.getExpiryDate(), job.getId());
                }
            }
        }
        logger.info("Finished auto-delete task. Deleted {} jobs.", deletedCount);
    }

    // Run every day at 2:00 AM to clean up jobs deleted more than 15 days ago
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanUpOldDeletedJobs() {
        logger.info("Running scheduled task to permanently delete jobs soft-deleted more than 15 days ago...");
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(15);
        try {
            jobRepository.deleteOldDeletedJobs(cutoffDate);
            logger.info("Finished permanent deletion task.");
        } catch (Exception e) {
            logger.error("Error during permanent deletion: ", e);
        }
    }
}
