package com.findmyjob.controller;

import com.findmyjob.model.JobView;
import com.findmyjob.model.SearchQueryLog;
import com.findmyjob.model.WebsiteView;
import com.findmyjob.model.JobApply;
import com.findmyjob.repository.JobApplyRepository;
import com.findmyjob.repository.JobViewRepository;
import com.findmyjob.repository.SearchQueryLogRepository;
import com.findmyjob.repository.WebsiteViewRepository;
import com.findmyjob.repository.JobRepository;
import com.findmyjob.repository.MentorRepository;
import com.findmyjob.repository.MentorApplicantRepository;
import com.findmyjob.repository.FreeSessionRepository;
import com.findmyjob.repository.SessionJoinRepository;
import com.findmyjob.model.SessionJoin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private WebsiteViewRepository websiteViewRepository;

    @Autowired
    private JobViewRepository jobViewRepository;

    @Autowired
    private SearchQueryLogRepository searchQueryLogRepository;

    @Autowired
    private JobApplyRepository jobApplyRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private MentorApplicantRepository mentorApplicantRepository;

    @Autowired
    private FreeSessionRepository freeSessionRepository;

    @Autowired
    private SessionJoinRepository sessionJoinRepository;

    @PostMapping("/view/website")
    public ResponseEntity<?> recordWebsiteView() {
        websiteViewRepository.save(new WebsiteView(LocalDateTime.now()));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/view/job/{jobId}")
    public ResponseEntity<?> recordJobView(@PathVariable Long jobId) {
        jobViewRepository.save(new JobView(jobId, LocalDateTime.now()));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/apply/job/{jobId}")
    public ResponseEntity<?> recordJobApply(@PathVariable Long jobId) {
        jobApplyRepository.save(new JobApply(jobId, LocalDateTime.now()));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/join/session/{sessionId}")
    public ResponseEntity<?> recordSessionJoin(@PathVariable Long sessionId) {
        sessionJoinRepository.save(new SessionJoin(sessionId, LocalDateTime.now()));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/applies/grouped")
    public ResponseEntity<Map<Long, Long>> getGroupedApplies() {
        List<Object[]> results = jobApplyRepository.countAppliesGroupedByJob();
        Map<Long, Long> groupedApplies = new HashMap<>();
        for (Object[] row : results) {
            groupedApplies.put((Long) row[0], (Long) row[1]);
        }
        return ResponseEntity.ok(groupedApplies);
    }

    @PostMapping("/search")
    public ResponseEntity<?> recordSearch(@RequestParam String keyword) {
        if (keyword != null && !keyword.trim().isEmpty()) {
            searchQueryLogRepository.save(new SearchQueryLog(keyword.trim().toLowerCase(), LocalDateTime.now()));
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/website")
    public ResponseEntity<Map<String, Long>> getWebsiteAnalytics() {
        Map<String, Long> stats = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        stats.put("lifetime", websiteViewRepository.count());
        stats.put("last7Days", websiteViewRepository.countByViewedAtAfter(now.minusDays(7)));
        stats.put("today", websiteViewRepository.countByViewedAtAfter(now.toLocalDate().atStartOfDay()));
        stats.put("last1Hour", websiteViewRepository.countByViewedAtAfter(now.minusHours(1)));

        // Add apply stats
        stats.put("lifetimeApplies", jobApplyRepository.count());
        stats.put("last7DaysApplies", jobApplyRepository.countByAppliedAtAfter(now.minusDays(7)));
        stats.put("todayApplies", jobApplyRepository.countByAppliedAtAfter(now.toLocalDate().atStartOfDay()));
        stats.put("last1HourApplies", jobApplyRepository.countByAppliedAtAfter(now.minusHours(1)));

        // Add jobs created stats
        stats.put("lifetimeJobs", jobRepository.count());
        stats.put("last7DaysJobs", jobRepository.countByPostedDateAfter(now.minusDays(7)));
        stats.put("todayJobs", jobRepository.countByPostedDateAfter(now.toLocalDate().atStartOfDay()));
        stats.put("last1HourJobs", jobRepository.countByPostedDateAfter(now.minusHours(1)));

        // Add mentor stats
        stats.put("lifetimeMentors", mentorRepository.countByStatus("APPROVED"));
        stats.put("last7DaysMentors", mentorRepository.countByStatusAndCreatedAtAfter("APPROVED", now.minusDays(7)));
        stats.put("todayMentors", mentorRepository.countByStatusAndCreatedAtAfter("APPROVED", now.toLocalDate().atStartOfDay()));
        stats.put("last1HourMentors", mentorRepository.countByStatusAndCreatedAtAfter("APPROVED", now.minusHours(1)));

        // Add mentor applicant stats (Pending applications)
        stats.put("lifetimeMentorApplicants", mentorApplicantRepository.countByStatus("PENDING"));
        stats.put("last7DaysMentorApplicants", mentorApplicantRepository.countByStatusAndCreatedAtAfter("PENDING", now.minusDays(7)));
        stats.put("todayMentorApplicants", mentorApplicantRepository.countByStatusAndCreatedAtAfter("PENDING", now.toLocalDate().atStartOfDay()));
        stats.put("last1HourMentorApplicants", mentorApplicantRepository.countByStatusAndCreatedAtAfter("PENDING", now.minusHours(1)));

        // Add free session stats
        stats.put("lifetimeSessions", freeSessionRepository.count());
        stats.put("last7DaysSessions", freeSessionRepository.countByCreatedAtAfter(now.minusDays(7)));
        stats.put("todaySessions", freeSessionRepository.countByCreatedAtAfter(now.toLocalDate().atStartOfDay()));
        stats.put("last1HourSessions", freeSessionRepository.countByCreatedAtAfter(now.minusHours(1)));

        // Add session join stats
        stats.put("lifetimeSessionJoins", sessionJoinRepository.count());
        stats.put("last7DaysSessionJoins", sessionJoinRepository.countByJoinedAtAfter(now.minusDays(7)));
        stats.put("todaySessionJoins", sessionJoinRepository.countByJoinedAtAfter(now.toLocalDate().atStartOfDay()));
        stats.put("last1HourSessionJoins", sessionJoinRepository.countByJoinedAtAfter(now.minusHours(1)));

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<Map<String, Long>> getJobAnalytics(@PathVariable Long jobId) {
        Map<String, Long> stats = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        stats.put("lifetime", jobViewRepository.countByJobId(jobId));
        stats.put("last7Days", jobViewRepository.countByJobIdAndViewedAtAfter(jobId, now.minusDays(7)));
        stats.put("today", jobViewRepository.countByJobIdAndViewedAtAfter(jobId, now.toLocalDate().atStartOfDay()));
        stats.put("last1Hour", jobViewRepository.countByJobIdAndViewedAtAfter(jobId, now.minusHours(1)));

        stats.put("lifetimeApplies", jobApplyRepository.countByJobId(jobId));
        stats.put("last7DaysApplies", jobApplyRepository.countByJobIdAndAppliedAtAfter(jobId, now.minusDays(7)));
        stats.put("todayApplies",
                jobApplyRepository.countByJobIdAndAppliedAtAfter(jobId, now.toLocalDate().atStartOfDay()));
        stats.put("last1HourApplies", jobApplyRepository.countByJobIdAndAppliedAtAfter(jobId, now.minusHours(1)));
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/searches/top")
    public ResponseEntity<List<Map<String, Object>>> getTopSearchesDaily() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        List<Object[]> results = searchQueryLogRepository.findTopSearchesSince(startOfDay, PageRequest.of(0, 5));

        List<Map<String, Object>> formattedResults = results.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("keyword", row[0]);
            map.put("count", row[1]);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(formattedResults);
    }

    @GetMapping("/historical")
    public ResponseEntity<List<Map<String, Object>>> getHistoricalStats() {
        List<Map<String, Object>> history = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 0; i < 15; i++) {
            LocalDate targetDate = today.minusDays(i);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.plusDays(1).atStartOfDay();

            long views = websiteViewRepository.countByViewedAtBetween(startOfDay, endOfDay);
            long applies = jobApplyRepository.countByAppliedAtBetween(startOfDay, endOfDay);
            long jobsCreated = jobRepository.countByPostedDateBetween(startOfDay, endOfDay);
            long mentorsJoined = mentorRepository.countByStatusAndCreatedAtBetween("APPROVED", startOfDay, endOfDay);
            long mentorApplicants = mentorApplicantRepository.countByStatusAndCreatedAtBetween("PENDING", startOfDay, endOfDay);
            long freeSessionsCreated = freeSessionRepository.countByCreatedAtBetween(startOfDay, endOfDay);
            long sessionJoins = sessionJoinRepository.countByJoinedAtBetween(startOfDay, endOfDay);
            List<Object[]> searches = searchQueryLogRepository.findTopSearchesBetween(startOfDay, endOfDay,
                    PageRequest.of(0, 5));
            List<Map<String, Object>> topSearches = searches.stream().map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("keyword", row[0]);
                m.put("count", row[1]);
                return m;
            }).collect(Collectors.toList());

            Map<String, Object> dayStat = new HashMap<>();
            dayStat.put("date", targetDate.toString());
            dayStat.put("views", views);
            dayStat.put("applies", applies);
            dayStat.put("jobsCreated", jobsCreated);
            dayStat.put("mentorsJoined", mentorsJoined);
            dayStat.put("mentorApplicants", mentorApplicants);
            dayStat.put("freeSessionsCreated", freeSessionsCreated);
            dayStat.put("sessionJoins", sessionJoins);
            dayStat.put("topSearches", topSearches);
            history.add(dayStat);
        }
        return ResponseEntity.ok(history);
    }
}
