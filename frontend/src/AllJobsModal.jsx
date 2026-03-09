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

    return (
        <div className="aj-overlay" onClick={onClose}>
            <div className="aj-modal" onClick={e => e.stopPropagation()}>
                <div className="aj-header">
                    <h2>All Jobs ({jobs.length})</h2>
                    <button className="aj-close" onClick={onClose}>✕</button>
                </div>
                <div className="aj-content">
                    {jobs.map((job) => {
                        const isNewJob = job.postedDate && new Date(job.postedDate).toDateString() === new Date().toDateString();
                        const isLastDay = job.expiryDate && job.expiryDate !== "Don't know" && new Date(job.expiryDate).toDateString() === new Date().toDateString();
                        return (
                            <div
                                key={job.id}
                                className="job-card aj-override-card"
                                onClick={() => openJob(job)}
                                title="Click to view job details"
                                style={{ position: 'relative' }}
                            >
                                <div className="job-card-body">
                                    <div className="job-card-header">
                                        <div className="company-logo">
                                            {getCompanyInitials(job.company)}
                                        </div>
                                        <div className="job-info">
                                            <h3 className="job-title">{job.title}</h3>
                                            <p className="company-name">{job.company}</p>
                                        </div>
                                    </div>

                                    <div className="job-details">
                                        {isNewJob && (
                                            <div className="job-detail-item" style={{
                                                background: 'rgba(217, 119, 6, 0.15)',
                                                border: '1px solid rgba(217, 119, 6, 0.4)',
                                                color: '#b45309',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '20px',
                                                fontWeight: '700',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.2rem'
                                            }}>
                                                <span style={{ fontSize: '0.85rem', animation: 'pulse 2s infinite' }}>🔥</span>
                                                <span>Posted Today</span>
                                            </div>
                                        )}
                                        {isLastDay && (
                                            <div className="job-detail-item" style={{
                                                background: 'rgba(230, 74, 25, 0.1)',
                                                border: '1px solid rgba(230, 74, 25, 0.3)',
                                                color: '#e64a19',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '20px',
                                                fontWeight: '800',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.2rem'
                                            }}>
                                                <span style={{ fontSize: '0.85rem', animation: 'bounce 2s infinite' }}>⏳</span>
                                                <span>Last Day to Apply</span>
                                            </div>
                                        )}
                                        <div className="job-detail-item">
                                            <span className="job-detail-icon">💰</span>
                                            <span>{job.salary || '—'}</span>
                                        </div>
                                        {job.experienceLevel && (
                                            <div className="job-detail-item">
                                                <span className="job-detail-icon">📅</span>
                                                <span>{job.experienceLevel}</span>
                                            </div>
                                        )}
                                        {job.passoutYear && (
                                            <div className="job-detail-item">
                                                <span className="job-detail-icon">🎓</span>
                                                <span>{job.passoutYear}</span>
                                            </div>
                                        )}
                                        <div className="job-detail-item">
                                            <span className="job-detail-icon">📍</span>
                                            <span>{job.location}</span>
                                        </div>
                                        {job.jobType && (
                                            <div className="job-detail-item">
                                                <span className="job-detail-icon">💼</span>
                                                <span>{job.jobType}</span>
                                            </div>
                                        )}
                                    </div>

                                    {job.description && (
                                        <p className="job-description">{job.description}</p>
                                    )}

                                    {job.skills && (
                                        <div className="job-skills">
                                            {job.skills.split(',').map((skill, index) => (
                                                <span key={index} className="skill-tag">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="job-card-footer" style={{ flex: 'none' }}>
                                    <span className="view-details-hint" style={{ opacity: 1, visibility: 'visible', bottom: '0px' }}>View Details →</span>
                                </div>
                            </div>
                        )
                    })}
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
