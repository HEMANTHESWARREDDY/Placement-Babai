package com.findmyjob.service;

import com.findmyjob.model.Job;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class JobParserService {

    public Job extractJobFromUrl(String url) {
        Job job = new Job();
        job.setApplyLink(url);

        try {
            // Default timeout and pretend we are a browser to bypass basic bot protection
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            // 1. Try to extract Title
            String title = "";
            if (doc.select("meta[property=og:title]").first() != null) {
                title = doc.select("meta[property=og:title]").first().attr("content");
            } else if (doc.title() != null && !doc.title().isEmpty()) {
                title = doc.title();
            }

            // Cleanup title (e.g. remove " | CompanyName")
            if (title.contains("|"))
                title = title.split("\\|")[0].trim();
            if (title.contains("-"))
                title = title.split("-")[0].trim();
            job.setTitle(title.isEmpty() ? "Parsed Job" : title);

            // 2. Try to extract Company
            String company = "";
            if (doc.select("meta[property=og:site_name]").first() != null) {
                company = doc.select("meta[property=og:site_name]").first().attr("content");
            } else if (url.contains("linkedin.com")) {
                company = "LinkedIn (Parsed)";
            } else if (url.contains("internshala.com")) {
                company = "Internshala (Parsed)";
            } else {
                try {
                    String domain = new java.net.URI(url).getHost();
                    company = domain.startsWith("www.") ? domain.substring(4) : domain;
                } catch (Exception e) {
                }
            }
            job.setCompany(company.isEmpty() ? "Unknown Company" : company);

            // 3. Try to extract Description
            String description = "";
            if (doc.select("meta[property=og:description]").first() != null) {
                description = doc.select("meta[property=og:description]").first().attr("content");
            } else if (doc.select("meta[name=description]").first() != null) {
                description = doc.select("meta[name=description]").first().attr("content");
            }
            job.setDescription(description.length() > 500 ? description.substring(0, 497) + "..." : description);

            // Default some fields just to be safe
            job.setLocation("Remote / Local");
            job.setJobType("Full-time");
            job.setExperienceLevel("0-2 Years");
            job.setSalary("To be discussed");
            job.setCompanyType("Corporate");
            job.setCategory("Technology");
            job.setRole("Developer / Engineer");

            // Look for keywords in text to make smart guesses
            String pageText = doc.body() != null ? doc.body().text().toLowerCase() : "";
            if (pageText.contains("part-time") || pageText.contains("part time")) {
                job.setJobType("Part-time");
            } else if (pageText.contains("internship") || pageText.contains("intern")) {
                job.setJobType("Internship");
            }

            if (pageText.contains("bengaluru") || pageText.contains("bangalore"))
                job.setLocation("Bangalore, India");
            else if (pageText.contains("hyderabad"))
                job.setLocation("Hyderabad, India");
            else if (pageText.contains("pune"))
                job.setLocation("Pune, India");
            else if (pageText.contains("remote"))
                job.setLocation("Remote");

            if (pageText.contains("python") && pageText.contains("java"))
                job.setSkills("Java, Python");
            else if (pageText.contains("react") && pageText.contains("node"))
                job.setSkills("React, Node.js");
            else if (pageText.contains("sales") || pageText.contains("marketing")) {
                job.setCategory("Marketing");
                job.setRole("Specialist");
            }

        } catch (Exception e) {
            // Failed to parse, probably blocked or invalid URL. Return what we safely
            // initialized.
            System.err.println("Failed to scrape URL: " + url + " - " + e.getMessage());
            job.setTitle("Unable to automatically extract details");
            job.setCompany("Unknown");
        }

        return job;
    }
}
