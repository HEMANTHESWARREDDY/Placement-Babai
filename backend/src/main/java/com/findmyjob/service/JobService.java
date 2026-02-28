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
        return jobRepository.findAll();
    }

    public Optional<Job> getJobById(Long id) {
        return jobRepository.findById(id);
    }

    public Job createJob(Job job) {
        return jobRepository.save(job);
    }

    public Job updateJob(Long id, Job jobDetails) {
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

        return jobRepository.save(job);
    }

    public void deleteJob(Long id) {
        jobRepository.deleteById(id);
    }

    public List<Job> searchJobs(String keyword) {
        return jobRepository.searchJobs(keyword);
    }

    public List<Job> searchByLocation(String location) {
        return jobRepository.findByLocationContainingIgnoreCase(location);
    }
}
