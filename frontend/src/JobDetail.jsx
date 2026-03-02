import { useEffect, useState } from 'react';
import { API_BASE_URL } from './config';

import './JobDetail.css';

function JobDetail({ job, onClose }) {
    const getCompanyInitials = (company) => {
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

    const [copiedTop, setCopiedTop] = useState(false);
    const [copiedBottom, setCopiedBottom] = useState(false);

    const handleShareTop = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('job', job.id);
        navigator.clipboard.writeText(url.toString()).then(() => {
            setCopiedTop(true);
            setTimeout(() => setCopiedTop(false), 2000);
        });
    };

    const handleShareBottom = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('job', job.id);
        navigator.clipboard.writeText(url.toString()).then(() => {
            setCopiedBottom(true);
            setTimeout(() => setCopiedBottom(false), 2000);
        });
    };

    const handleApply = () => {
        // Track the apply
        fetch(`${API_BASE_URL}/api/analytics/apply/job/${job.id}`, { method: 'POST' })
            .catch(err => console.error('Failed to track apply:', err));

        const link = job.applyLink || 'https://www.foundit.in/jobs';
        window.open(link, '_blank', 'noopener,noreferrer');
    };

    const skills = job.skills ? job.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const responsibilities = job.responsibilities
        ? job.responsibilities.split('\n').filter(Boolean)
        : [];
    const requirements = job.requirements
        ? job.requirements.split('\n').filter(Boolean)
        : [];

    return (
        <div className="jd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="jd-modal">
                {/* Top Action Buttons */}
                <div className="jd-top-actions">
                    <button
                        className="jd-share-icon-btn"
                        onClick={handleShareTop}
                        aria-label="Share job"
                        title={copiedTop ? 'Link copied!' : 'Share this job'}
                    >
                        {copiedTop ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                        )}
                        <span className="jd-share-icon-label">{copiedTop ? 'Copied!' : 'Share'}</span>
                    </button>
                    <button className="jd-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {/* Header */}
                <div className="jd-header">
                    <div className="jd-company-logo">
                        {getCompanyInitials(job.company)}
                    </div>
                    <div className="jd-header-info">
                        <h1 className="jd-title">{job.title}</h1>
                        <p className="jd-company">{job.company}</p>
                    </div>
                </div>

                <div className="jd-badges-container">
                    <div className="jd-meta-row">
                        {job.postedDate && new Date(job.postedDate).toDateString() === new Date().toDateString() && (
                            <span className="jd-badge" style={{
                                background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
                                color: 'white',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '20px',
                                fontWeight: '700',
                                boxShadow: '0 4px 10px rgba(255, 65, 108, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                border: 'none'
                            }}>
                                <span style={{ fontSize: '0.85rem', animation: 'pulse 2s infinite' }}>🔥</span>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>Posted Today</span>
                            </span>
                        )}
                        {job.expiryDate && job.expiryDate !== "Don't know" && new Date(job.expiryDate).toDateString() === new Date().toDateString() && (
                            <span className="jd-badge" style={{
                                background: 'linear-gradient(135deg, #ffb347, #ffcc33)',
                                color: '#333',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '20px',
                                fontWeight: '800',
                                boxShadow: '0 4px 10px rgba(255, 179, 71, 0.4)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                border: 'none'
                            }}>
                                <span style={{ fontSize: '0.85rem', animation: 'bounce 2s infinite' }}>⏳</span>
                                <span>Last Day to Apply</span>
                            </span>
                        )}
                        {job.salary && (
                            <span className="jd-badge jd-badge-green">
                                💰 {job.salary}
                            </span>
                        )}
                        {job.experienceLevel && (
                            <span className="jd-badge jd-badge-teal">
                                📅 {job.experienceLevel}
                            </span>
                        )}
                        {job.passoutYear && (
                            <span className="jd-badge jd-badge-green">
                                🎓 {job.passoutYear}
                            </span>
                        )}
                        <span className="jd-badge jd-badge-blue">📍 {job.location}</span>
                        {job.jobType && (
                            <span className="jd-badge jd-badge-purple">💼 {job.jobType}</span>
                        )}
                        {job.category && (
                            <span className="jd-badge jd-badge-orange">🏷️ {job.category}</span>
                        )}
                    </div>
                    {job.postedDate && new Date(job.postedDate).toDateString() === new Date().toDateString() ? (
                        <p className="jd-posted" style={{ color: '#ff4b2b', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #ff4b2b', padding: '0.2rem 0.6rem', borderRadius: '1rem', background: 'rgba(255, 75, 43, 0.05)', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem', animation: 'pulse 2s infinite' }}>🔥</span> Posted Today !
                        </p>
                    ) : (
                        <p className="jd-posted">🗓️ Posted on {formatDate(job.postedDate)}</p>
                    )}
                </div>

                {/* Apply + Share Bar */}
                <div className="jd-apply-bar">
                    <button className="jd-apply-btn" onClick={handleApply}>
                        Apply Now →
                    </button>
                    <span className="jd-apply-note">You will be redirected to the company's job page</span>
                </div>

                <div className="jd-divider" />

                {/* About the Job */}
                {job.description && (
                    <section className="jd-section">
                        <h2 className="jd-section-title">📋 About the Role</h2>
                        <p className="jd-description">{job.description}</p>
                    </section>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <section className="jd-section">
                        <h2 className="jd-section-title">🛠️ Required Skills</h2>
                        <div className="jd-skills">
                            {skills.map((skill, i) => (
                                <span key={i} className="jd-skill-tag">{skill}</span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Responsibilities */}
                {responsibilities.length > 0 && (
                    <section className="jd-section">
                        <h2 className="jd-section-title">🎯 Key Responsibilities</h2>
                        <ul className="jd-list">
                            {responsibilities.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Requirements */}
                {requirements.length > 0 && (
                    <section className="jd-section">
                        <h2 className="jd-section-title">✅ Requirements & Qualifications</h2>
                        <ul className="jd-list">
                            {requirements.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Bottom Apply */}
                <div className="jd-footer">
                    <button className="jd-apply-btn jd-apply-btn-lg" onClick={handleApply}>
                        🚀 Apply for this Job
                    </button>
                    <div className="jd-footer-secondary">
                        <button className="jd-share-btn" onClick={handleShareBottom}>
                            {copiedBottom ? '✅ Copied!' : '🔗 Share'}
                        </button>
                        <button className="jd-close-btn" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobDetail;
