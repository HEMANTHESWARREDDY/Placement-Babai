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

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [collapsedSections, setCollapsedSections] = useState({
        skills: true,
        strengths: true,
        weaknesses: true,
        formatting: true
    });

    const toggleSection = (sec) => {
        setCollapsedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    const getSubscoreColor = (score) => {
        if (score >= 70) return '#10b981'; // Green
        if (score >= 40) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    };

    const getVisualProgress = (score) => {
        return score === 0 ? 4 : score;
    };

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

    const handleShareTop = async () => {
        const url = new URL(window.location.href);
        url.searchParams.set('job', job.id);
        const shareUrl = url.toString();

        if (navigator.share) {
            try {
                await navigator.share({
                    title: job.title,
                    text: `Check out this job: ${job.title} at ${job.company}`,
                    url: shareUrl
                });
            } catch (err) {
                // If user cancels or share fails, copy to clipboard as fallback
                if (err.name !== 'AbortError') copyToClipboard(shareUrl, 'top');
            }
        } else {
            copyToClipboard(shareUrl, 'top');
        }
    };

    const handleShareBottom = async () => {
        const url = new URL(window.location.href);
        url.searchParams.set('job', job.id);
        const shareUrl = url.toString();

        if (navigator.share) {
            try {
                await navigator.share({
                    title: job.title,
                    text: `Check out this job: ${job.title} at ${job.company}`,
                    url: shareUrl
                });
            } catch (err) {
                if (err.name !== 'AbortError') copyToClipboard(shareUrl, 'bottom');
            }
        } else {
            copyToClipboard(shareUrl, 'bottom');
        }
    };

    const copyToClipboard = (text, position) => {
        navigator.clipboard.writeText(text).then(() => {
            if (position === 'top') {
                setCopiedTop(true);
                setTimeout(() => setCopiedTop(false), 2000);
            } else {
                setCopiedBottom(true);
                setTimeout(() => setCopiedBottom(false), 2000);
            }
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
                    <div className={`ats-modal ${!atsResult ? 'compact' : ''}`} onClick={e => e.stopPropagation()}>
                        <button className="ats-close" onClick={() => setShowAts(false)}>×</button>
                        <h2>ATS Match Checker</h2>
                        <p className="ats-desc">Upload your resume to see how well it matches this job's keywords, requirements, and role.</p>

                        {/* Upload Area - Hidden when showing results */}
                        {!atsResult && (
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
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setAtsFile(null); 
                                                setAtsResult(null); 
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
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
                        )}

                        {atsError && <p className="ats-error">{atsError}</p>}

                        {atsResult ? (
                            <div className="ats-result-box">
                                <div className="ats-header-summary">
                                    <div className="ats-progress-outer">
                                        <div className="ats-progress-container">
                                            <svg className="ats-progress-svg" viewBox="0 0 100 100">
                                                <circle className="ats-progress-bg" cx="50" cy="50" r="45" />
                                                <circle
                                                    className="ats-progress-bar"
                                                    cx="50" cy="50" r="45"
                                                    stroke={getSubscoreColor(atsResult.score)}
                                                    strokeDasharray="283"
                                                    strokeDashoffset={283 - (283 * getVisualProgress(atsResult.score)) / 100}
                                                />
                                            </svg>
                                            <div className="ats-progress-text">
                                                <span className="ats-score-value">{atsResult.score}</span>
                                                <span className="ats-score-label">ATS MATCH</span>
                                            </div>
                                        </div>
                                        <p className="ats-overall-message">{atsResult.message}</p>
                                    </div>

                                    {/* Grid of Subscores */}
                                    {atsResult.subScores && (
                                        <div className="ats-subscores-grid">
                                            <div className="ats-subscore-card">
                                                <div className="ats-subscore-header">
                                                    <span className="ats-subscore-icon">🛠️</span>
                                                    <span className="ats-subscore-title">Skills Match</span>
                                                    <span className="ats-subscore-num">{atsResult.subScores.skillsMatch}%</span>
                                                </div>
                                                <div className="ats-subscore-bar-bg">
                                                    <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(atsResult.subScores.skillsMatch)}%`, background: getSubscoreColor(atsResult.subScores.skillsMatch) }} />
                                                </div>
                                            </div>
                                            <div className="ats-subscore-card">
                                                <div className="ats-subscore-header">
                                                    <span className="ats-subscore-icon">💼</span>
                                                    <span className="ats-subscore-title">Experience</span>
                                                    <span className="ats-subscore-num">{atsResult.subScores.experienceMatch}%</span>
                                                </div>
                                                <div className="ats-subscore-bar-bg">
                                                    <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(atsResult.subScores.experienceMatch)}%`, background: getSubscoreColor(atsResult.subScores.experienceMatch) }} />
                                                </div>
                                            </div>
                                            <div className="ats-subscore-card">
                                                <div className="ats-subscore-header">
                                                    <span className="ats-subscore-icon">🎯</span>
                                                    <span className="ats-subscore-title">Content Match</span>
                                                    <span className="ats-subscore-num">{atsResult.subScores.keywordMatch}%</span>
                                                </div>
                                                <div className="ats-subscore-bar-bg">
                                                    <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(atsResult.subScores.keywordMatch)}%`, background: getSubscoreColor(atsResult.subScores.keywordMatch) }} />
                                                </div>
                                            </div>
                                            <div className="ats-subscore-card">
                                                <div className="ats-subscore-header">
                                                    <span className="ats-subscore-icon">🚀</span>
                                                    <span className="ats-subscore-title">Projects</span>
                                                    <span className="ats-subscore-num">{atsResult.subScores.projectRelevance}%</span>
                                                </div>
                                                <div className="ats-subscore-bar-bg">
                                                    <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(atsResult.subScores.projectRelevance)}%`, background: getSubscoreColor(atsResult.subScores.projectRelevance) }} />
                                                </div>
                                            </div>
                                            <div className="ats-subscore-card">
                                                <div className="ats-subscore-header">
                                                    <span className="ats-subscore-icon">📄</span>
                                                    <span className="ats-subscore-title">Formatting</span>
                                                    <span className="ats-subscore-num">{atsResult.subScores.formattingScore}%</span>
                                                </div>
                                                <div className="ats-subscore-bar-bg">
                                                    <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(atsResult.subScores.formattingScore)}%`, background: getSubscoreColor(atsResult.subScores.formattingScore) }} />
                                                </div>
                                            </div>
                                            <div className="ats-subscore-card">
                                                <div className="ats-subscore-header">
                                                    <span className="ats-subscore-icon">🎓</span>
                                                    <span className="ats-subscore-title">Education</span>
                                                    <span className="ats-subscore-num">{atsResult.subScores.educationMatch}%</span>
                                                </div>
                                                <div className="ats-subscore-bar-bg">
                                                    <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(atsResult.subScores.educationMatch)}%`, background: getSubscoreColor(atsResult.subScores.educationMatch) }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="ats-analysis-details">
                                    {/* AI Insights Card */}
                                    {atsResult.aiInsights && (
                                        <div className="ats-insight-card">
                                            <div className="ats-insight-header">
                                                <span className="ats-insight-avatar">🤖</span>
                                                <h4>AI Recruiter Insights</h4>
                                            </div>
                                            <p className="ats-insight-text">{atsResult.aiInsights}</p>
                                        </div>
                                    )}

                                    {isMobile ? (
                                        <>
                                            {/* Keywords Section */}
                                            {atsResult.keywordAnalysis && (
                                                <div className="ats-detail-section collapsible">
                                                    <button 
                                                        className={`ats-section-toggle-btn ${!collapsedSections.skills ? 'active' : ''}`}
                                                        onClick={() => toggleSection('skills')}
                                                    >
                                                        <span className="ats-section-toggle-title">🛠️ Skills Match Analysis</span>
                                                        <span className="ats-section-toggle-chevron">{collapsedSections.skills ? '▼' : '▲'}</span>
                                                    </button>
                                                    <div className={`ats-section-collapse-content ${collapsedSections.skills ? 'collapsed' : ''}`}>
                                                        <div className="ats-keywords-container" style={{ marginTop: '1.25rem' }}>
                                                            <div className="ats-keywords-box matched">
                                                                <h5>Matched Skills ({atsResult.keywordAnalysis.matched?.length || 0})</h5>
                                                                <div className="ats-keyword-list">
                                                                    {atsResult.keywordAnalysis.matched?.map((k, i) => (
                                                                        <div key={i} className="ats-keyword-badge matched">
                                                                            <span className="ats-keyword-name">{k.keyword}</span>
                                                                            {k.synonymUsed && k.synonymUsed !== 'exact' && (
                                                                                <span className="ats-keyword-synonym">via "{k.synonymUsed}"</span>
                                                                            )}
                                                                            {k.category && (
                                                                                <span className="ats-keyword-category">{k.category}</span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {(!atsResult.keywordAnalysis.matched || atsResult.keywordAnalysis.matched.length === 0) && (
                                                                        <p className="ats-empty-text">No skills matched yet.</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="ats-keywords-box missing">
                                                                <h5>Missing Core Skills ({atsResult.keywordAnalysis.missing?.length || 0})</h5>
                                                                <div className="ats-keyword-list">
                                                                    {atsResult.keywordAnalysis.missing?.map((k, i) => (
                                                                        <div key={i} className="ats-keyword-badge missing">
                                                                            <span className="ats-keyword-name">{k.keyword}</span>
                                                                            {k.importance && (
                                                                                <span className={`ats-keyword-importance ${k.importance.toLowerCase()}`}>
                                                                                    {k.importance}
                                                                                </span>
                                                                            )}
                                                                            {k.category && (
                                                                                <span className="ats-keyword-category">{k.category}</span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {(!atsResult.keywordAnalysis.missing || atsResult.keywordAnalysis.missing.length === 0) && (
                                                                        <p className="ats-empty-text">Perfect! No critical missing skills.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Key Strengths Collapsible */}
                                            <div className="ats-detail-section collapsible">
                                                <button 
                                                    className={`ats-section-toggle-btn ${!collapsedSections.strengths ? 'active' : ''}`}
                                                    onClick={() => toggleSection('strengths')}
                                                >
                                                    <span className="ats-section-toggle-title">💪 Key Strengths</span>
                                                    <span className="ats-section-toggle-chevron">{collapsedSections.strengths ? '▼' : '▲'}</span>
                                                </button>
                                                <div className={`ats-section-collapse-content ${collapsedSections.strengths ? 'collapsed' : ''}`}>
                                                    <div className="ats-keywords-box matched" style={{ border: '1px solid #bbf7d0', boxShadow: 'none', marginTop: '1.25rem' }}>
                                                        <ul className="ats-bullet-list">
                                                            {atsResult.strengths?.map((s, i) => (
                                                                <li key={i}>
                                                                    <span className="ats-bullet-icon green">✓</span>
                                                                    <span>{s}</span>
                                                                </li>
                                                            ))}
                                                            {(!atsResult.strengths || atsResult.strengths.length === 0) && (
                                                                <p className="ats-empty-text">No major strengths analyzed.</p>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Improvement Areas Collapsible */}
                                            <div className="ats-detail-section collapsible">
                                                <button 
                                                    className={`ats-section-toggle-btn ${!collapsedSections.weaknesses ? 'active' : ''}`}
                                                    onClick={() => toggleSection('weaknesses')}
                                                >
                                                    <span className="ats-section-toggle-title">⚠️ Improvement Areas</span>
                                                    <span className="ats-section-toggle-chevron">{collapsedSections.weaknesses ? '▼' : '▲'}</span>
                                                </button>
                                                <div className={`ats-section-collapse-content ${collapsedSections.weaknesses ? 'collapsed' : ''}`}>
                                                    <div className="ats-keywords-box missing" style={{ border: '1px solid #fecdd3', boxShadow: 'none', marginTop: '1.25rem' }}>
                                                        <ul className="ats-bullet-list">
                                                            {atsResult.weaknesses?.map((w, i) => (
                                                                <li key={i}>
                                                                    <span className="ats-bullet-icon red">!</span>
                                                                    <span>{w}</span>
                                                                </li>
                                                            ))}
                                                            {(!atsResult.weaknesses || atsResult.weaknesses.length === 0) && (
                                                                <p className="ats-empty-text">No significant improvement areas detected.</p>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Formatting checks */}
                                            {atsResult.formattingAnalysis && (
                                                <div className="ats-detail-section collapsible">
                                                    <button 
                                                        className={`ats-section-toggle-btn ${!collapsedSections.formatting ? 'active' : ''}`}
                                                        onClick={() => toggleSection('formatting')}
                                                    >
                                                        <span className="ats-section-toggle-title">📋 ATS Formatting Checks</span>
                                                        <span className="ats-section-toggle-chevron">{collapsedSections.formatting ? '▼' : '▲'}</span>
                                                    </button>
                                                    <div className={`ats-section-collapse-content ${collapsedSections.formatting ? 'collapsed' : ''}`}>
                                                        <div className="ats-formatting-grid" style={{ marginTop: '1.25rem' }}>
                                                            <div className="ats-format-check-card">
                                                                <div className="ats-format-header">
                                                                    <span className="ats-format-icon">📌</span>
                                                                    <span className="ats-format-title">Bullet Points</span>
                                                                    <span className={`ats-format-pill ${atsResult.formattingAnalysis.bulletPointsCheck?.toLowerCase()}`}>
                                                                        {atsResult.formattingAnalysis.bulletPointsCheck}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ats-format-check-card">
                                                                <div className="ats-format-header">
                                                                    <span className="ats-format-icon">🗂️</span>
                                                                    <span className="ats-format-title">Section Headers</span>
                                                                    <span className={`ats-format-pill ${atsResult.formattingAnalysis.sectionHeaderCheck?.toLowerCase()}`}>
                                                                        {atsResult.formattingAnalysis.sectionHeaderCheck}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ats-format-check-card">
                                                                <div className="ats-format-header">
                                                                    <span className="ats-format-icon">📊</span>
                                                                    <span className="ats-format-title">Tables / Columns</span>
                                                                    <span className={`ats-format-pill ${atsResult.formattingAnalysis.tablesCheck?.toLowerCase()}`}>
                                                                        {atsResult.formattingAnalysis.tablesCheck}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="ats-formatting-feedback">
                                                            <strong>Recruiter Advice:</strong> {atsResult.formattingAnalysis.feedback}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Keywords Section (Desktop Static Flat) */}
                                            {atsResult.keywordAnalysis && (
                                                <div className="ats-detail-section">
                                                    <h4 className="ats-section-subtitle">🛠️ Skills Match Analysis</h4>
                                                    <div className="ats-keywords-container">
                                                        <div className="ats-keywords-box matched">
                                                            <h5>Matched Skills ({atsResult.keywordAnalysis.matched?.length || 0})</h5>
                                                            <div className="ats-keyword-list">
                                                                {atsResult.keywordAnalysis.matched?.map((k, i) => (
                                                                    <div key={i} className="ats-keyword-badge matched">
                                                                        <span className="ats-keyword-name">{k.keyword}</span>
                                                                        {k.synonymUsed && k.synonymUsed !== 'exact' && (
                                                                            <span className="ats-keyword-synonym">via "{k.synonymUsed}"</span>
                                                                        )}
                                                                        {k.category && (
                                                                            <span className="ats-keyword-category">{k.category}</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {(!atsResult.keywordAnalysis.matched || atsResult.keywordAnalysis.matched.length === 0) && (
                                                                    <p className="ats-empty-text">No skills matched yet.</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="ats-keywords-box missing">
                                                            <h5>Missing Core Skills ({atsResult.keywordAnalysis.missing?.length || 0})</h5>
                                                            <div className="ats-keyword-list">
                                                                {atsResult.keywordAnalysis.missing?.map((k, i) => (
                                                                    <div key={i} className="ats-keyword-badge missing">
                                                                        <span className="ats-keyword-name">{k.keyword}</span>
                                                                        {k.importance && (
                                                                            <span className={`ats-keyword-importance ${k.importance.toLowerCase()}`}>
                                                                                {k.importance}
                                                                            </span>
                                                                        )}
                                                                        {k.category && (
                                                                            <span className="ats-keyword-category">{k.category}</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {(!atsResult.keywordAnalysis.missing || atsResult.keywordAnalysis.missing.length === 0) && (
                                                                    <p className="ats-empty-text">Perfect! No critical missing skills.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Strengths & Weaknesses (Desktop Side-by-Side Columns) */}
                                            <div className="ats-columns-grid">
                                                <div className="ats-column-card strengths">
                                                    <h5>💪 Key Strengths</h5>
                                                    <ul className="ats-bullet-list">
                                                        {atsResult.strengths?.map((s, i) => (
                                                            <li key={i}>
                                                                <span className="ats-bullet-icon green">✓</span>
                                                                <span>{s}</span>
                                                            </li>
                                                        ))}
                                                        {(!atsResult.strengths || atsResult.strengths.length === 0) && (
                                                            <p className="ats-empty-text">No major strengths analyzed.</p>
                                                        )}
                                                    </ul>
                                                </div>

                                                <div className="ats-column-card weaknesses">
                                                    <h5>⚠️ Improvement Areas</h5>
                                                    <ul className="ats-bullet-list">
                                                        {atsResult.weaknesses?.map((w, i) => (
                                                            <li key={i}>
                                                                <span className="ats-bullet-icon red">!</span>
                                                                <span>{w}</span>
                                                            </li>
                                                        ))}
                                                        {(!atsResult.weaknesses || atsResult.weaknesses.length === 0) && (
                                                            <p className="ats-empty-text">No significant improvement areas detected.</p>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Formatting checks (Desktop Static Flat) */}
                                            {atsResult.formattingAnalysis && (
                                                <div className="ats-detail-section">
                                                    <h4 className="ats-section-subtitle">📋 ATS Formatting Checks</h4>
                                                    <div className="ats-formatting-grid">
                                                        <div className="ats-format-check-card">
                                                            <div className="ats-format-header">
                                                                <span className="ats-format-icon">📌</span>
                                                                <span className="ats-format-title">Bullet Points</span>
                                                                <span className={`ats-format-pill ${atsResult.formattingAnalysis.bulletPointsCheck?.toLowerCase()}`}>
                                                                    {atsResult.formattingAnalysis.bulletPointsCheck}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ats-format-check-card">
                                                            <div className="ats-format-header">
                                                                <span className="ats-format-icon">🗂️</span>
                                                                <span className="ats-format-title">Section Headers</span>
                                                                <span className={`ats-format-pill ${atsResult.formattingAnalysis.sectionHeaderCheck?.toLowerCase()}`}>
                                                                    {atsResult.formattingAnalysis.sectionHeaderCheck}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ats-format-check-card">
                                                            <div className="ats-format-header">
                                                                <span className="ats-format-icon">📊</span>
                                                                <span className="ats-format-title">Tables / Columns</span>
                                                                <span className={`ats-format-pill ${atsResult.formattingAnalysis.tablesCheck?.toLowerCase()}`}>
                                                                    {atsResult.formattingAnalysis.tablesCheck}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="ats-formatting-feedback">
                                                        <strong>Recruiter Advice:</strong> {atsResult.formattingAnalysis.feedback}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}


                                </div>

                                <button
                                    className="jd-ats-btn"
                                    style={{ marginTop: '0.75rem', width: '100%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', border: 'none', padding: '0.9rem' }}
                                    onClick={() => { 
                                        setAtsResult(null); 
                                        setAtsFile(null); 
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
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
