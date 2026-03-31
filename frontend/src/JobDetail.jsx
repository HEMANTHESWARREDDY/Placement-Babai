import { useEffect, useState, useRef } from 'react';
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

    const [showAts, setShowAts] = useState(false);
    const [atsFile, setAtsFile] = useState(null);
    const [isCheckingAts, setIsCheckingAts] = useState(false);
    const [atsResult, setAtsResult] = useState(null);
    const [atsError, setAtsError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleAtsFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setAtsFile(e.target.files[0]);
            setAtsResult(null);
            setAtsError(null);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragover" || e.type === "dragenter") {
            setIsDragging(true);
        } else if (e.type === "dragleave" || e.type === "drop") {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setAtsFile(e.dataTransfer.files[0]);
            setAtsResult(null);
            setAtsError(null);
        }
    };

    const handleCheckAts = async () => {
        if (!atsFile) return;
        setIsCheckingAts(true);
        setAtsError(null);

        const formData = new FormData();
        formData.append('resume', atsFile);

        try {
            const res = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/ats-check`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setAtsResult(data);
            } else {
                setAtsError(data.error || 'Failed to check score');
            }
        } catch (err) {
            setAtsError('Network error occurred while analyzing.');
        } finally {
            setIsCheckingAts(false);
        }
    };

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
        <>
            <div className="jd-overlay" onClick={(e) => {
                if (e.target === e.currentTarget && !showAts) onClose();
            }}>
                <div className="jd-modal">
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
                                    background: 'rgba(217, 119, 6, 0.15)',
                                    border: '1px solid rgba(217, 119, 6, 0.4)',
                                    color: '#b45309',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '20px',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem'
                                }}>
                                    <span style={{ fontSize: '0.85rem', animation: 'pulse 2s infinite' }}>🔥</span>
                                    <span style={{ color: '#b45309', fontWeight: 'bold' }}>Posted Today</span>
                                </span>
                            )}
                            {job.salary && (
                                <span className="jd-badge jd-badge-green">
                                    💰 {job.salary}
                                </span>
                            )}
                            <span className="jd-badge jd-badge-blue">📍 {job.location}</span>
                            {job.jobType && (
                                <span className="jd-badge jd-badge-purple">💼 {job.jobType}</span>
                            )}
                        </div>
                        <p className="jd-posted">🗓️ Posted on {formatDate(job.postedDate)}</p>
                    </div>

                    <div className="jd-apply-bar">
                        <button className="jd-apply-btn" onClick={handleApply}>
                            Apply Now →
                        </button>
                        <button className="jd-ats-btn" onClick={() => setShowAts(true)}>
                            <span style={{ marginRight: '6px' }}>📝</span> Check ATS Score
                        </button>
                        <span className="jd-apply-note">You will be redirected to the company's job page</span>
                    </div>

                    <div className="jd-divider" />

                    {job.description && (
                        <section className="jd-section">
                            <h2 className="jd-section-title">📋 About the Role</h2>
                            <p className="jd-description">{job.description}</p>
                        </section>
                    )}

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

            {showAts && (
                <div className="ats-overlay" onClick={() => setShowAts(false)}>
                    <div className="ats-modal" onClick={e => e.stopPropagation()}>
                        <button className="ats-close" onClick={() => setShowAts(false)}>×</button>
                        <h2>ATS Match Checker</h2>
                        <p className="ats-desc">Upload your resume to see how well it matches this job's keywords, requirements, and role.</p>

                        <div 
                            className={`ats-upload-area ${isDragging ? 'dragging' : ''}`} 
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDrag}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={handleAtsFileChange}
                            />
                            {atsFile ? (
                                <div className="ats-file-display">
                                    <button 
                                        className="ats-remove-file" 
                                        onClick={(e) => { e.stopPropagation(); setAtsFile(null); setAtsResult(null); }}
                                        title="Remove file"
                                    >×</button>
                                    <div className="ats-file-icon-wrapper">
                                        {atsFile.name.endsWith('.pdf') ? (
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        ) : (
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0073b1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        )}
                                    </div>
                                    <p>{atsFile.name}</p>
                                    <span className="ats-change-file">Click to change file</span>
                                </div>
                            ) : (
                                <div className="ats-upload-prompt">
                                    <div className="ats-resume-symbol">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0073b1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="14" r="2"></circle><line x1="12" y1="16" x2="12" y2="18"></line><line x1="10" y1="18" x2="14" y2="18"></line></svg>
                                    </div>
                                    <p>Drop your resume here or click to browse</p>
                                    <span style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>PDF, DOCX, PPTX</span>
                                </div>
                            )}
                        </div>

                        {atsError && <p className="ats-error">{atsError}</p>}

                        {atsResult ? (
                            <div className="ats-result-box">
                                <div className="ats-progress-container">
                                    <svg className="ats-progress-svg" viewBox="0 0 100 100">
                                        <circle className="ats-progress-bg" cx="50" cy="50" r="45" />
                                        <circle
                                            className="ats-progress-bar"
                                            cx="50" cy="50" r="45"
                                            stroke={atsResult.score >= 70 ? '#10b981' : atsResult.score >= 40 ? '#f59e0b' : '#ef4444'}
                                            strokeDasharray="283"
                                            strokeDashoffset={283 - (283 * atsResult.score) / 100}
                                        />
                                    </svg>
                                    <div className="ats-progress-text">
                                        <span className="ats-score-value">{atsResult.score}%</span>
                                        <span className="ats-score-label">MATCH</span>
                                    </div>
                                </div>

                                <h3>{atsResult.message}</h3>

                                <div className="ats-analysis-details">
                                    <div className="ats-detail-section">
                                        <h4>✅ Matched Skills</h4>
                                        <div className="ats-skill-pills">
                                            {atsResult.matched_skills?.map((s, i) => (
                                                <span key={i} className="ats-pill matched">{s}</span>
                                            ))}
                                            {(!atsResult.matched_skills || atsResult.matched_skills.length === 0) && (
                                                <span className="ats-empty-msg">No key skills matched yet.</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ats-detail-section">
                                        <h4>❌ Missing Skills</h4>
                                        <div className="ats-skill-pills">
                                            {atsResult.missing_skills?.map((s, i) => (
                                                <span key={i} className="ats-pill missing">{s}</span>
                                            ))}
                                            {(!atsResult.missing_skills || atsResult.missing_skills.length === 0) && (
                                                <span className="ats-empty-msg">Great! No major skills missing.</span>
                                            )}
                                        </div>
                                    </div>

                                    {atsResult.tips && atsResult.tips.length > 0 && (
                                        <div className="ats-detail-section">
                                            <h4>💡 Improvement Tips</h4>
                                            <ul className="ats-tips-list">
                                                {atsResult.tips.map((tip, i) => (
                                                    <li key={i}>{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="jd-ats-btn"
                                    style={{ marginTop: '2rem', width: '100%', background: '#f8fafc' }}
                                    onClick={() => { setAtsResult(null); setAtsFile(null); }}
                                >
                                    Check Another Resume
                                </button>
                            </div>
                        ) : (
                            <button
                                className="ats-check-btn"
                                disabled={!atsFile || isCheckingAts}
                                onClick={handleCheckAts}
                            >
                                {isCheckingAts ? 'Analyzing...' : 'Analyze Match'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default JobDetail;
