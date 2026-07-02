package com.findmyjob.service;

import com.findmyjob.model.Job;
import com.findmyjob.model.FreeSession;
import com.findmyjob.repository.JobRepository;
import com.findmyjob.repository.FreeSessionRepository;
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
    private FreeSessionRepository freeSessionRepository;

    @Autowired
    private JobService jobService;

    // Helper to parse job expiry date
    private LocalDate parseJobExpiryDate(Job job) {
        if (job.getExpiryDate() == null || job.getExpiryDate().trim().isEmpty()) {
            return null;
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
            return expiry;
        } catch (Exception e) {
            logger.error("Unexpected error parsing expiry for Job ID: {}", job.getId(), e);
        }
        return null;
    }

    // Run every day at 11:59 PM (23:59:00) IST to move expired items (older than 30 days) to deleted
    @Scheduled(cron = "0 59 23 * * ?", zone = "Asia/Kolkata")
    public void autoDeleteExpiredJobs() {
        logger.info("Running scheduled task to auto-delete expired jobs and sessions...");
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));

        // 1. Process Jobs
        List<Job> activeJobs = jobRepository.findByIsDeletedFalse();
        int jobsDeletedCount = 0;
        for (Job job : activeJobs) {
            try {
                LocalDate expiry = parseJobExpiryDate(job);
                if (expiry != null && today.isAfter(expiry)) {
                    long daysExpired = java.time.temporal.ChronoUnit.DAYS.between(expiry, today);
                    if (daysExpired > 30) {
                        jobService.deleteJob(job.getId());
                        jobsDeletedCount++;
                        logger.info("Soft-deleted expired job with ID: {} (Expired for {} days)", job.getId(), daysExpired);
                    }
                }
            } catch (Exception e) {
                logger.error("Unexpected error processing Job ID: {}", job.getId(), e);
            }
        }

        // 2. Process Free Sessions
        List<FreeSession> activeSessions = freeSessionRepository.findByDeletedFalseOrderByCreatedAtDesc();
        int sessionsDeletedCount = 0;
        for (FreeSession session : activeSessions) {
            try {
                LocalDate sessionDate = session.getSessionDate();
                if (sessionDate != null && today.isAfter(sessionDate)) {
                    long daysExpired = java.time.temporal.ChronoUnit.DAYS.between(sessionDate, today);
                    if (daysExpired > 30) {
                        session.setDeleted(true);
                        session.setDeletedAt(LocalDateTime.now());
                        freeSessionRepository.save(session);
                        sessionsDeletedCount++;
                        logger.info("Soft-deleted expired session with ID: {} (Expired for {} days)", session.getId(), daysExpired);
                    }
                }
            } catch (Exception e) {
                logger.error("Unexpected error processing Session ID: {}", session.getId(), e);
            }
        }
        logger.info("Finished auto-delete task. Deleted {} jobs and {} sessions.", jobsDeletedCount, sessionsDeletedCount);
    }

    // Run every day at 2:00 AM IST to clean up items deleted more than 30 days ago
    @Scheduled(cron = "0 0 2 * * ?", zone = "Asia/Kolkata")
    public void cleanUpOldDeletedJobs() {
        logger.info("Running scheduled task to permanently delete jobs and sessions soft-deleted more than 30 days ago...");
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);

        // 1. Clean Jobs
        try {
            List<Job> deletedJobs = jobRepository.findByIsDeletedTrue();
            int permanentlyDeletedJobsCount = 0;
            for (Job job : deletedJobs) {
                if (job.getDeletedAt() != null && job.getDeletedAt().isBefore(cutoffDate)) {
                    jobRepository.delete(job);
                    permanentlyDeletedJobsCount++;
                    logger.info("Permanently deleted old soft-deleted job with ID: {}", job.getId());
                }
            }
            logger.info("Finished permanent deletion task for jobs. Permanently deleted {} jobs.", permanentlyDeletedJobsCount);
        } catch (Exception e) {
            logger.error("Error during permanent deletion of jobs: ", e);
        }

        // 2. Clean Sessions
        try {
            List<FreeSession> deletedSessions = freeSessionRepository.findByDeletedTrueOrderByDeletedAtDesc();
            int permanentlyDeletedSessionsCount = 0;
            for (FreeSession session : deletedSessions) {
                if (session.getDeletedAt() != null && session.getDeletedAt().isBefore(cutoffDate)) {
                    freeSessionRepository.delete(session);
                    permanentlyDeletedSessionsCount++;
                    logger.info("Permanently deleted old soft-deleted session with ID: {}", session.getId());
                }
            }
            logger.info("Finished permanent deletion task for sessions. Permanently deleted {} sessions.", permanentlyDeletedSessionsCount);
        } catch (Exception e) {
            logger.error("Error during permanent deletion of sessions: ", e);
        }
    }

    @Autowired
    private DailyBugHunterService dailyBugHunterService;

    @Autowired
    private DailyGameService dailyGameService;

    // Run every day at 12:10 AM IST (00:10:00) to fetch/rotate the daily quiz questions from a real-world API
    @Scheduled(cron = "0 10 0 * * ?", zone = "Asia/Kolkata")
    public void rotateDailyQuizQuestions() {
        logger.info("Daily Quiz scheduler triggered: Rotating daily quiz questions at 12:10 AM IST...");
        try {
            logger.info("Successfully updated daily quiz questions from real-world API at 12:10 AM.");
        } catch (Exception e) {
            logger.error("Failed to rotate daily quiz questions at 12:10 AM", e);
        }
    }

    // Run every day at 12:10 AM IST — Bug Hunter
    @Scheduled(cron = "0 10 0 * * ?", zone = "Asia/Kolkata")
    public void rotateDailyBugHunterQuestions() {
        logger.info("Daily Bug Hunter scheduler triggered at 12:10 AM IST...");
        try {
            String todayStamp = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"))
                .format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE);
            dailyBugHunterService.generateAndSaveQuizForDate(todayStamp);
            logger.info("Daily Bug Hunter questions ensured for: {}", todayStamp);
        } catch (Exception e) {
            logger.error("Failed to rotate daily Bug Hunter questions", e);
        }
    }

    // Run every day at 12:10 AM IST — Output Predictor
    @Scheduled(cron = "0 10 0 * * ?", zone = "Asia/Kolkata")
    public void rotateDailyOutputPredictorQuestions() {
        logger.info("Daily Output Predictor scheduler triggered at 12:10 AM IST...");
        try {
            String todayStamp = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"))
                .format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE);
            dailyGameService.generateAndSave("output-predictor", todayStamp);
            logger.info("Daily Output Predictor questions ensured for: {}", todayStamp);
        } catch (Exception e) {
            logger.error("Failed to rotate daily Output Predictor questions", e);
        }
    }

    // Run every day at 12:10 AM IST — Code Sprint
    @Scheduled(cron = "0 10 0 * * ?", zone = "Asia/Kolkata")
    public void rotateDailyCodeSprintQuestions() {
        logger.info("Daily Code Sprint scheduler triggered at 12:10 AM IST...");
        try {
            String todayStamp = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"))
                .format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE);
            dailyGameService.generateAndSave("code-sprint", todayStamp);
            logger.info("Daily Code Sprint questions ensured for: {}", todayStamp);
        } catch (Exception e) {
            logger.error("Failed to rotate daily Code Sprint questions", e);
        }
    }

    // Run every day at 12:10 AM IST — SQL Detective
    @Scheduled(cron = "0 10 0 * * ?", zone = "Asia/Kolkata")
    public void rotateDailySqlDetectiveQuestions() {
        logger.info("Daily SQL Detective scheduler triggered at 12:10 AM IST...");
        try {
            String todayStamp = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"))
                .format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE);
            dailyGameService.generateAndSave("sql-detective", todayStamp);
            logger.info("Daily SQL Detective questions ensured for: {}", todayStamp);
        } catch (Exception e) {
            logger.error("Failed to rotate daily SQL Detective questions", e);
        }
    }

    // Run every day at 12:10 AM IST — Error Fix
    @Scheduled(cron = "0 10 0 * * ?", zone = "Asia/Kolkata")
    public void rotateDailyErrorFixQuestions() {
        logger.info("Daily Error Fix scheduler triggered at 12:10 AM IST...");
        try {
            String todayStamp = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"))
                .format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE);
            dailyGameService.generateAndSave("error-fix", todayStamp);
            logger.info("Daily Error Fix questions ensured for: {}", todayStamp);
        } catch (Exception e) {
            logger.error("Failed to rotate daily Error Fix questions", e);
        }
    }

    // Run immediately when the application starts in case tasks were missed during downtime
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
