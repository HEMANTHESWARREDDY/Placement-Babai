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
                            <div className="aj-card-top">
                                <div className="aj-company-logo">
                                    {getCompanyInitials(job.company)}
                                </div>
                                <div className="aj-card-header-info">
                                    <h3 className="aj-job-title">{job.title}</h3>
                                    <p className="aj-company-name">{job.company}</p>
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

                            <div className="aj-card-posted">
                                📅 Posted on {formatDate(job.postedDate)}
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
