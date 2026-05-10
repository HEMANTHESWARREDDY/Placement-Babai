package com.findmyjob.service;

import com.findmyjob.model.Job;
import com.findmyjob.repository.JobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

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

    // Run every day at 11:59 PM (23:59:00) IST
    @Scheduled(cron = "0 59 23 * * ?", zone = "Asia/Kolkata")
    public void autoDeleteExpiredJobs() {
        logger.info("Running scheduled task to auto-delete expired jobs...");
        List<Job> activeJobs = jobRepository.findByIsDeletedFalse();
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));

        int deletedCount = 0;
        for (Job job : activeJobs) {
            if (job.getExpiryDate() == null || job.getExpiryDate().trim().isEmpty()) {
                continue;
            }
            try {
                LocalDate expiry = null;
                String cleanDate = job.getExpiryDate().trim();
                if (cleanDate.contains("T")) {
                    cleanDate = cleanDate.substring(0, cleanDate.indexOf("T"));
                }

                String[] formats = { "yyyy-MM-dd", "dd-MM-yyyy", "MM/dd/yyyy", "dd/MM/yyyy" };
                for (String format : formats) {
                    try {
                        expiry = LocalDate.parse(cleanDate, java.time.format.DateTimeFormatter.ofPattern(format));
                        break;
                    } catch (Exception e) {
                        // Try next
                    }
                }

                if (expiry != null) {
                    LocalDateTime expiryTime = expiry.atTime(23, 58, 0);

                    // If current time in IST is strictly after the 11:58:00 PM of the expiry date
                    if (now.isAfter(expiryTime)) {
                        jobService.deleteJob(job.getId());
                        deletedCount++;
                        logger.info("Soft-deleted expired job with ID: {}", job.getId());
                    }
                } else {
                    // Only log if it's not the generic "Don't know" phrase
                    if (!"Don't know".equalsIgnoreCase(cleanDate)) {
                        logger.error("Could not parse explicit expiry date '{}' for Job ID: {}", job.getExpiryDate(),
                                job.getId());
                    }
                }
            } catch (Exception e) {
                logger.error("Unexpected error processing Job ID: {}", job.getId(), e);
            }
        }
        logger.info("Finished auto-delete task. Deleted {} jobs.", deletedCount);
    }

    // Run every day at 2:00 AM IST to clean up jobs deleted more than 15 days ago
    @Scheduled(cron = "0 0 2 * * ?", zone = "Asia/Kolkata")
    public void cleanUpOldDeletedJobs() {
        logger.info("Running scheduled task to permanently delete jobs soft-deleted more than 15 days ago...");
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(15);
        try {
            jobRepository.deleteAllByIsDeletedTrueAndDeletedAtBefore(cutoffDate);
            logger.info("Finished permanent deletion task.");
        } catch (Exception e) {
            logger.error("Error during permanent deletion: ", e);
        }
    }

    // Run immediately when the application starts in case tasks were missed during
    // downtime
    @EventListener(ApplicationReadyEvent.class)
    public void runMissedSchedules() {
        logger.info("Application started. Running missed daily scheduled tasks...");
        try {
            autoDeleteExpiredJobs();
            cleanUpOldDeletedJobs();
        } catch (Exception e) {
            logger.error("Error running application startup tasks: ", e);
        }
    }
}
