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
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
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
                            <div className="aj-desktop-layout">
                                <div className="aj-card-top">
                                    <div className="aj-company-logo">
                                        {getCompanyInitials(job.company)}
                                    </div>
                                    <div className="aj-card-header-info">
                                        <h3 className="aj-job-title">{job.title}</h3>
                                        <div className="aj-company-meta-row">
                                            <p className="aj-company-name">{job.company}</p>
                                            <span className="aj-card-posted-inline">
                                                📅 Posted on {formatDate(job.postedDate)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="aj-card-actions">
                                        <span className="aj-view-details-txt">View Details &rarr;</span>
                                    </div>
                                </div>

                                <div className="aj-card-badges">
                                    {job.salary && (
                                        <span className="aj-badge aj-badge-green">
                                            💰 {job.salary}
                                        </span>
                                    )}
                                    {job.experienceLevel && (
                                        <span className="aj-badge aj-badge-teal">
                                            📅 {job.experienceLevel}
                                        </span>
                                    )}
                                    <span className="aj-badge aj-badge-blue">
                                        📍 {job.location || 'Multiple Locations'}
                                    </span>
                                    {job.jobType && (
                                        <span className="aj-badge aj-badge-purple">
                                            💼 {job.jobType}
                                        </span>
                                    )}
                                    {job.category && (
                                        <span className="aj-badge aj-badge-orange">
                                            🏷️ {job.category}
                                        </span>
                                    )}
                                </div>

                                {job.skills && (
                                    <div className="aj-card-skills-section">
                                        <div className="aj-skills-header">
                                            <h4>🛠️ Required Skills</h4>
                                        </div>
                                        <div className="aj-skills-list">
                                            {job.skills.split(',').map((skill, index) => (
                                                <span key={index} className="aj-skill-tag">{skill.trim()}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="aj-mobile-layout">
                                <div className="aj-mob-header">
                                    <div className="aj-mob-title-col">
                                        <h3 className="aj-mob-title">{job.title}</h3>
                                        <p className="aj-mob-company">{job.company}</p>
                                    </div>
                                    <div className="aj-mob-logo">
                                        {getCompanyInitials(job.company)}
                                    </div>
                                </div>

                                <div className="aj-mob-meta">
                                    <div className="aj-mob-meta-item">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                        {job.experienceLevel || "0-2 Yrs"}
                                    </div>
                                    <div className="aj-mob-meta-item">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                        {job.location || "On-site"}
                                    </div>
                                </div>

                                <div className="aj-mob-early">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                    Early Applicant
                                </div>

                                <div className="aj-mob-actions">
                                    <button className="aj-mob-save" onClick={(e) => { e.stopPropagation(); alert('Job saved!'); }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                        Save
                                    </button>
                                    <button className="aj-mob-apply" onClick={(e) => { e.stopPropagation(); window.open(job.applyLink || 'https://www.foundit.in/jobs', '_blank', 'noopener,noreferrer'); }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                        Apply Now
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
