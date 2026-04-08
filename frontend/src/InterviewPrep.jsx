import React, { useState, useEffect } from 'react';
import './InterviewPrep.css';

const TRENDING_COMPANIES = [
    { name: 'Accenture', searches: '542 searches', icon: 'A', color: '#1e40af' },
    { name: 'Deloitte', searches: '282 searches', icon: 'D', color: '#10b981' },
    { name: 'TCS', searches: '257 searches', icon: 'T', color: '#4f46e5' },
    { name: 'Infosys', searches: '193 searches', icon: 'I', color: '#2563eb' },
    { name: 'Capgemini', searches: '157 searches', icon: 'C', color: '#0ea5e9' },
];

const RECENT_COMMUNITY = [
    { company: 'Accenture', role: 'Infrastructure Engineer', questions: 103, date: 'Apr 8' },
    { company: 'Google', role: 'Frontend Developer', questions: 50, date: 'Apr 7' },
    { company: 'Amazon', role: 'SDE-1', questions: 120, date: 'Apr 7' },
    { company: 'TCS', role: 'System Engineer', questions: 45, date: 'Apr 6' },
];

function InterviewPrep() {
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [activeTab, setActiveTab] = useState('community');

    const handleGenerate = (e) => {
        e.preventDefault();
        alert(`Generating questions for ${role} at ${company}... (Feature coming soon!)`);
    };

    return (
        <div className="ip-container">
            {/* Hero Section */}
            <div className="ip-hero">
                <div className="ip-hero-badges">
                    <span className="ip-breadcrumb">Interviews / Tomorrow I have Interview</span>
                </div>
                <h1 className="ip-hero-title">Tomorrow I have Interview</h1>
                <p className="ip-hero-subtitle">
                    Interview tomorrow? Get 100 company-specific questions with detailed answers in 2 minutes.
                </p>

                {/* Trending Section */}
                <div className="ip-trending-header">
                    <h3><span className="ip-trending-icon">📈</span> Trending Companies</h3>
                    <button className="ip-view-all-link">View All 133+ →</button>
                </div>
                <div className="ip-trending-grid">
                    {TRENDING_COMPANIES.map((c, i) => (
                        <div key={i} className="ip-trending-card">
                            <div className="ip-trending-card-icon" style={{ backgroundColor: c.color }}>{c.icon}</div>
                            <div className="ip-trending-card-info">
                                <h4>{c.name}</h4>
                                <span>{c.searches}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Banner / Premium Toggle */}
                <div className="ip-premium-banner">
                    <div className="ip-pb-left">
                        <div className="ip-pb-icon">✨</div>
                        <div className="ip-pb-text">
                            <div className="ip-pb-tag">NEW</div>
                            <h4>Custom Prep <span className="ip-pro-badge">PRO</span></h4>
                            <p>Pick your skills, set question counts per skill, choose question types — get exactly the questions YOU need.</p>
                        </div>
                    </div>
                    <div className="ip-pb-right">
                        <div className="ip-pb-progress">0/1</div>
                        <button className="ip-pb-btn">Try it Now →</button>
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="ip-action-row">
                    {/* Form Section */}
                    <div className="ip-form-container">
                        <h3>Interview Details</h3>
                        <p>Choose from top 100 companies and 50 roles. More companies coming soon!</p>
                        
                        <form className="ip-form" onSubmit={handleGenerate}>
                            <div className="ip-input-flex">
                                <div className="ip-input-group">
                                    <label><span className="ip-icon">🏢</span> Company Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Google, Microsoft, Stripe"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="ip-input-group">
                                    <label><span className="ip-icon">🎯</span> Target Role</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Frontend Engineer, PM"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="ip-form-footer">
                                <div className="ip-free-credits">⚡ 2 of 2 free searches left today</div>
                                <button type="submit" className="ip-generate-btn">
                                    <span className="ip-icon">🔍</span> Generate Questions
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* History / Community Section */}
                    <div className="ip-activity-container">
                        <div className="ip-tabs">
                            <button 
                                className={`ip-tab ${activeTab === 'my-searches' ? 'active' : ''}`}
                                onClick={() => setActiveTab('my-searches')}
                            >
                                <span className="ip-tab-icon">🕒</span> My Searches
                            </button>
                            <button 
                                className={`ip-tab ${activeTab === 'community' ? 'active' : ''}`}
                                onClick={() => setActiveTab('community')}
                            >
                                <span className="ip-tab-icon">👥</span> Community
                            </button>
                        </div>

                        <div className="ip-activity-list">
                            {activeTab === 'community' ? (
                                RECENT_COMMUNITY.map((item, i) => (
                                    <div key={i} className="ip-activity-item">
                                        <div className="ip-ai-left">
                                            <div className="ip-ai-avatar">{item.company[0]}</div>
                                            <div className="ip-ai-info">
                                                <h5>{item.company}</h5>
                                                <p>{item.role}</p>
                                                <span>🕒 {item.date}, 2026</span>
                                            </div>
                                        </div>
                                        <div className="ip-ai-right">
                                            <div className="ip-ai-qs">{item.questions} Qs</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="ip-empty-activity">
                                    <p>No recent searches. Start by generating questions!</p>
                                </div>
                            )}
                        </div>
                        <button className="ip-view-all-activity">View All →</button>
                    </div>
                </div>
            </div>

            {/* Explore Section */}
            <div className="ip-explore-section">
                <div className="ip-explore-header">
                    <h2><span className="ip-explore-icon">👥</span> Explore Interview Prep</h2>
                    <p>Browse 53 company+role combos — click to view questions</p>
                    <button className="ip-generate-yours-btn">← Generate Yours</button>
                </div>

                <div className="ip-explore-filters">
                    <div className="ip-ef-tabs">
                        <button className="active">Community</button>
                        <button>My Searches</button>
                        <button>Custom Preps</button>
                    </div>
                </div>

                <div className="ip-explore-search-bar">
                    <span className="ip-esb-icon">🔍</span>
                    <input type="text" placeholder="accenture" />
                    <div className="ip-esb-views">
                        <button className="active">▦</button>
                        <button>≡</button>
                    </div>
                </div>

                <div className="ip-explore-tags">
                    <button className="active">Newest</button>
                    <button>Most Qs</button>
                    <button>A-Z</button>
                    <button className="ip-clear-btn">✕ Clear</button>
                </div>

                <div className="ip-table-container">
                    <table className="ip-table">
                        <thead>
                            <tr>
                                <th>COMPANY</th>
                                <th>ROLE</th>
                                <th>QUESTIONS</th>
                                <th>CATEGORIES</th>
                                <th>DATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_COMMUNITY.map((item, i) => (
                                <tr key={i}>
                                    <td className="ip-td-company">
                                        <div className="ip-td-icon" style={{ backgroundColor: '#14b8a6' }}>{item.company[0]}</div>
                                        {item.company}
                                    </td>
                                    <td>{item.role}</td>
                                    <td className="ip-td-qs">{item.questions}</td>
                                    <td>
                                        <div className="ip-td-categories">
                                            <span className="cat-behavioral">Behavioral</span>
                                            <span className="cat-exp">Experience</span>
                                            <span className="cat-intro">Introduction</span>
                                        </div>
                                    </td>
                                    <td className="ip-td-date">{item.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default InterviewPrep;
