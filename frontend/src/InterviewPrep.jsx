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
    { company: 'Deloitte', role: 'Audit Associate', questions: 85, date: 'Apr 7' },
    { company: 'Capgemini', role: 'Software Engineer', questions: 92, date: 'Apr 7' },
    { company: 'TCS', role: 'System Engineer', questions: 45, date: 'Apr 6' },
];

function QuestionItem({ question, index }) {
    const [showAnswer, setShowAnswer] = useState(false);

    return (
        <div className={`ip-qs-item ${showAnswer ? 'expanded' : ''}`} onClick={() => setShowAnswer(!showAnswer)}>
            <span className="ip-qs-num">{index + 1}.</span>
            <div className="ip-qs-body">
                <p className="ip-qs-text">{question.content}</p>
                {showAnswer && question.answer && (
                    <div className="ip-qs-answer">
                        <div className="ip-answer-header">
                            <span className="ip-ai-badge">AI ANSWER</span>
                        </div>
                        <p>{question.answer}</p>
                    </div>
                )}
                <button className="ip-toggle-answer">
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>
            </div>
        </div>
    );
}

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

    const filteredCommunity = communityData.filter(item => {
        const isOneOfTopFive = TRENDING_COMPANIES.some(c => c.name.toLowerCase() === item.company.toLowerCase());
        if (!isOneOfTopFive) return false;
        
        return item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.role.toLowerCase().includes(searchTerm.toLowerCase());
    });

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
                    <button className="ip-view-all-link">Top Companies →</button>
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


            </div>

            {/* Explore Section */}
            <div className="ip-explore-section">
                <div className="ip-explore-header">
                    <h2><span className="ip-explore-icon">👥</span> Explore Interview Prep</h2>
                    <p>Browse top company+role combos — click to view questions</p>
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
                            {loading ? (
                                <div className="ip-generating-loader">
                                    <div className="ip-spinner"></div>
                                    <p>AI is generating custom interview questions for you...</p>
                                    <span>This usually takes about 10-15 seconds.</span>
                                </div>
                            ) : Object.keys(groupedQuestions || {}).length === 0 ? (
                                <p className="ip-no-qs">No questions found for this company.</p>
                            ) : (
                                Object.entries(groupedQuestions).map(([category, qs]) => (
                                    <div key={category} className="ip-category-section">
                                        <h3>{category} Questions</h3>
                                        <div className="ip-qs-list">
                                            {qs.map((q, idx) => (
                                                <QuestionItem key={idx} question={q} index={idx} />
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
