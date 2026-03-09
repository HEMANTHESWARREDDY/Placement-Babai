import React, { useEffect } from 'react';
import './AllJobsModal.css';

function AllJobsModal({ jobs, onClose, openJob }) {
    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const getCompanyInitials = (company) => {
        if (!company) return 'C';
        return company
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Recently posted';
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Posted today';
        if (diffDays === 1) return 'Posted 1 day ago';
        if (diffDays < 30) return `Posted ${diffDays} days ago`;
        return `Posted a month ago`;
    };

    const isEarlyApplicant = (dateStr) => {
        if (!dateStr) return true; // Just for visuals
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    return (
        <div className="aj-overlay" onClick={onClose}>
            <div className="aj-modal" onClick={e => e.stopPropagation()}>
                <div className="aj-header">
                    <h2>All Jobs ({jobs.length})</h2>
                    <button className="aj-close" onClick={onClose}>✕</button>
                </div>
                <div className="aj-content">
                    {jobs.map(job => (
                        <div key={job.id} className="aj-job-card" onClick={() => openJob(job)}>
                            <div className="aj-card-left">
                                <h3 className="aj-job-title">{job.title}</h3>
                                <p className="aj-company-name">{job.company}</p>

                                <div className="aj-job-meta">
                                    <span className="aj-meta-item">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                        {job.experienceLevel || "0-2, Fresher"}
                                    </span>
                                    <span className="aj-meta-item">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                        {job.location || "Multiple Locations (India)"}
                                    </span>
                                </div>

                                {isEarlyApplicant(job.postedDate) && (
                                    <div className="aj-early-applicant">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        Early Applicant
                                    </div>
                                )}

                                <p className="aj-posted-date">{formatDate(job.postedDate)}</p>
                            </div>

                            <div className="aj-card-right">
                                <div className="aj-company-logo">
                                    {getCompanyInitials(job.company)}
                                </div>
                                <div className="aj-card-actions">
                                    <button className="aj-save-btn" onClick={(e) => { e.stopPropagation(); alert('Job saved!'); }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                        Save
                                    </button>
                                    <button className="aj-apply-btn" onClick={(e) => { e.stopPropagation(); window.open(job.applyLink || 'https://www.foundit.in/jobs', '_blank', 'noopener,noreferrer'); }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                        Quick Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {jobs.length === 0 && (
                        <div className="aj-empty">
                            No jobs found. Try adjusting your filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AllJobsModal;
