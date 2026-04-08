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
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [groupedQuestions, setGroupedQuestions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [communityData, setCommunityData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCommunityData();
    }, []);

    const fetchCommunityData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/questions/community`);
            if (res.ok) {
                const data = await res.json();
                setCommunityData(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        fetchQuestions(company, role);
    };

    const fetchQuestions = async (compName, targetRole) => {
        setLoading(true);
        try {
            // Include role if available to log search
            const url = targetRole 
                ? `${API_BASE_URL}/api/questions/${compName.toLowerCase()}?role=${encodeURIComponent(targetRole)}`
                : `${API_BASE_URL}/api/questions/${compName.toLowerCase()}`;
                
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setGroupedQuestions(data);
                setSelectedCompany(compName);
                fetchCommunityData(); // Refresh list to show new search
            } else {
                alert("No questions found for this company yet.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCommunity = communityData.filter(item => 
        item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <div key={i} className="ip-trending-card" onClick={() => fetchQuestions(c.name)}>
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
                    <input 
                        type="text" 
                        placeholder="Search by company or role..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="ip-esb-views">
                        <button className="active">▦</button>
                        <button>≡</button>
                    </div>
                </div>

                <div className="ip-explore-tags">
                    <button className="active">Newest</button>
                    <button>Most Qs</button>
                    <button>A-Z</button>
                    <button className="ip-clear-btn" onClick={() => setSearchTerm('')}>✕ Clear</button>
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
                            {filteredCommunity.length > 0 ? (
                                filteredCommunity.map((item, i) => (
                                    <tr key={i} onClick={() => fetchQuestions(item.company, item.role)} style={{ cursor: 'pointer' }}>
                                        <td className="ip-td-company">
                                            <div className="ip-td-icon" style={{ backgroundColor: '#14b8a6' }}>{item.company[0]}</div>
                                            {item.company}
                                        </td>
                                        <td>{item.role}</td>
                                        <td className="ip-td-qs">{item.questionCount}</td>
                                        <td>
                                            <div className="ip-td-categories">
                                                <span className="cat-behavioral">Behavioral</span>
                                                <span className="cat-exp">Experience</span>
                                                <span className="cat-intro">Introduction</span>
                                            </div>
                                        </td>
                                        <td className="ip-td-date">
                                            {item.searchDate ? new Date(item.searchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Apr 8'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        No community searches found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Questions View Overlay (If selected) */}
            {selectedCompany && (
                <div className="ip-questions-overlay">
                    <div className="ip-questions-modal">
                        <div className="ip-qm-header">
                            <button className="ip-back-btn" onClick={() => setSelectedCompany(null)}>← Back</button>
                            <h2>{selectedCompany} Interview Questions</h2>
                        </div>
                        
                        <div className="ip-qm-content">
                            {Object.keys(groupedQuestions).length === 0 ? (
                                <p className="ip-no-qs">No questions found for this company.</p>
                            ) : (
                                Object.entries(groupedQuestions).map(([category, qs]) => (
                                    <div key={category} className="ip-category-section">
                                        <h3>{category} Questions</h3>
                                        <div className="ip-qs-list">
                                            {qs.map((q, idx) => (
                                                <div key={idx} className="ip-qs-item">
                                                    <span className="ip-qs-num">{idx + 1}.</span>
                                                    <p>{q.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InterviewPrep;
