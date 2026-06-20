import React, { useState, useEffect } from 'react';
import './InterviewPrep.css';
import CustomSelect from './CustomSelect';
import SessionDetail from './SessionDetail';
import { API_BASE_URL } from './config';
import { recordSessionJoin } from './analyticsUtils';

const TRENDING_COMPANIES = [
    { name: 'Accenture', searches: '542 searches', icon: 'A', color: '#1e40af' },
    { name: 'Deloitte', searches: '282 searches', icon: 'D', color: '#10b981' },
    { name: 'TCS', searches: '257 searches', icon: 'T', color: '#4f46e5' },
    { name: 'Infosys', searches: '193 searches', icon: 'I', color: '#2563eb' },
    { name: 'Capgemini', searches: '157 searches', icon: 'C', color: '#0ea5e9' },
    { name: 'HCLTech', searches: '142 searches', icon: 'H', color: '#3b82f6' },
    { name: 'IBM', searches: '128 searches', icon: 'I', color: '#06b6d4' },
    { name: 'Cognizant', searches: '110 searches', icon: 'C', color: '#6366f1' },
    { name: 'Microsoft', searches: '115 searches', icon: 'M', color: '#f59e0b' },
];

const RECENT_COMMUNITY = [
    { company: 'Accenture', role: 'Infrastructure Engineer', questions: 103, date: 'Apr 8' },
    { company: 'Deloitte', role: 'Audit Associate', questions: 85, date: 'Apr 7' },
    { company: 'Capgemini', role: 'Software Engineer', questions: 92, date: 'Apr 7' },
    { company: 'TCS', role: 'System Engineer', questions: 45, date: 'Apr 6' },
];

function QuestionItem({ question, index }) {
    return (
        <div className="ip-qs-item">
            <span className="ip-qs-num">{index + 1}.</span>
            <div className="ip-qs-body">
                <p className="ip-qs-text">{question.content}</p>
            </div>
        </div>
    );
}

function InterviewPrep() {
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [groupedQuestions, setGroupedQuestions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [communityData, setCommunityData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeFilter, setActiveFilter] = useState('Most Common');
    const [trendingStats, setTrendingStats] = useState({});
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSessionsModal, setShowSessionsModal] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [sessionSearch, setSessionSearch] = useState('');
    const [sessionSort, setSessionSort] = useState('newest');
    const [expandedSessionId, setExpandedSessionId] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [questionsPerPage, setQuestionsPerPage] = useState(
        window.innerWidth <= 768 ? 6 : 8
    );

    useEffect(() => {
        const handleResize = () => {
            setQuestionsPerPage(window.innerWidth <= 768 ? 6 : 8);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchCommunityData();
        fetchTrendingStats();
    }, []);

    const fetchTrendingStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/questions/trending-stats`);
            if (res.ok) {
                const data = await res.json();
                setTrendingStats(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const recordSearch = async (compName) => {
        if (!compName) return;
        try {
            await fetch(`${API_BASE_URL}/api/questions/record-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company: compName, role: targetRole || 'General' })
            });
            fetchTrendingStats();
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, selectedCompany, targetRole, activeCategory]);

    useEffect(() => {
        if (selectedCompany) {
            if (activeFilter !== 'Most Common') {
                setGroupedQuestions(null);
                fetchAiQuestions(activeFilter === 'Recently Asked' ? 'recently' : 'frequently');
            } else {
                fetchQuestions(selectedCompany);
            }
        } else {
            setGroupedQuestions(null);
        }
    }, [activeFilter, selectedCompany, targetRole, activeCategory]);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/sessions/active`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (err) {
            console.error("Sessions fetch error:", err);
        }
    };

    const isSessionPast = (session) => {
        if (!session.sessionDate) return false;
        
        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        
        // 1. If date has passed
        if (session.sessionDate < todayStr) return true;
        
        // 2. If it's today, check time if schedule exists
        if (session.sessionDate === todayStr && session.schedule) {
            try {
                // Simple parser for "7 PM" or "7:30 PM" or "19:00"
                const timeStr = session.schedule.toUpperCase();
                let hours = 0;
                let minutes = 0;
                
                const timeMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/);
                if (timeMatch) {
                    hours = parseInt(timeMatch[1]);
                    minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                    const ampm = timeMatch[3];
                    
                    if (ampm === 'PM' && hours < 12) hours += 12;
                    if (ampm === 'AM' && hours === 12) hours = 0;
                    
                    const sessionTime = new Date();
                    sessionTime.setHours(hours, minutes, 0, 0);
                    
                    // Hide if current time is after session time (giving 30 mins grace period)
                    return now.getTime() > (sessionTime.getTime() + 30 * 60 * 1000);
                }
            } catch (e) {
                console.error("Time parse error:", e);
            }
        }
        
        return false;
    };

    const filteredSessions = sessions
        .filter(s => !isSessionPast(s)) // Filter out past sessions
        .filter(s =>
            (s.title || '').toLowerCase().includes(sessionSearch.toLowerCase()) ||
            (s.description || '').toLowerCase().includes(sessionSearch.toLowerCase())
        )
        .sort((a, b) => {
            if (sessionSort === 'newest' || sessionSort === 'today') {
                const now = new Date();
                const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
                const isTodayA = a.sessionDate === todayStr;
                const isTodayB = b.sessionDate === todayStr;

                if (isTodayA && !isTodayB) return -1;
                if (!isTodayA && isTodayB) return 1;

                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            }
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        })
        .filter(s => {
            if (sessionSort !== 'today') return true;
            const now = new Date();
            const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            return s.sessionDate === todayStr;
        });

    const top3Sessions = sessions
        .filter(s => !isSessionPast(s))
        .sort((a, b) => {
            const now = new Date();
            const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            const isTodayA = a.sessionDate === todayStr;
            const isTodayB = b.sessionDate === todayStr;

            if (isTodayA && !isTodayB) return -1;
            if (!isTodayA && isTodayB) return 1;

            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        })
        .slice(0, 3);



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
    };
    const fetchQuestions = async (compName) => {
        if (!compName) return;
        setLoading(true);
        try {
            const url = `${API_BASE_URL}/api/questions/${compName.toLowerCase()}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setGroupedQuestions(data);
                setCurrentPage(1);
                recordSearch(compName);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAiQuestions = async (type) => {
        setLoading(true);
        try {
            const role = targetRole || 'Professional';
            let endpoint = 'frequently-asked';
            if (type === 'recently') endpoint = 'recently-asked';
            if (type === 'frequently') endpoint = 'frequently-asked';

            const url = `${API_BASE_URL}/api/questions/ai/${endpoint}?company=${selectedCompany}&role=${encodeURIComponent(role)}&category=${activeCategory}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setGroupedQuestions(data);
                recordSearch(selectedCompany);
            } else {
                const errorText = await res.text();
                alert("AI Generation failed: " + res.status + " - " + errorText);
            }
        } catch (error) {
            console.error("AI Fetch error:", error);
            alert("Connection error while calling AI. Please check if your backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleAiShuffle = () => {
        if (!groupedQuestions) return;
        const newGrouped = { ...groupedQuestions };
        Object.keys(newGrouped).forEach(cat => {
            if (Array.isArray(newGrouped[cat])) {
                newGrouped[cat] = [...newGrouped[cat]].sort(() => Math.random() - 0.5);
            }
        });
        setGroupedQuestions(newGrouped);
        setCurrentPage(1);
    };

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setSuggestionIndex(-1);
        setCompany(val);
        if (val.trim()) {
            const companySuggestions = TRENDING_COMPANIES
                .filter(c => c.name.toLowerCase().includes(val.toLowerCase()))
                .map(c => c.name);
            setSuggestions([...new Set([...companySuggestions])]);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e) => {
        if (suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestionIndex >= 0) {
                const s = suggestions[suggestionIndex];
                setSearchTerm(s);
                setCompany(s);
                setSelectedCompany(s);
                setShowSuggestions(false);
                fetchQuestions(s);
            } else if (searchTerm) {
                setSelectedCompany(searchTerm);
                fetchQuestions(searchTerm);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div className="ip-container">
            <div className="ip-hero">
                <h1 className="ip-hero-title">
                    <div className="ip-title-top">Prep<span className="highlight-text">Zo</span></div>
                    <div className="ip-title-bottom">Let Placement<span className="highlight-violet">Babai</span> Prepare <span className="mobile-break">You for Interviews</span></div>
                </h1>

                <p className="ip-subtitle">Practice with Company-Specific Questions for Top Companies</p>
                <p className="ip-desc">Practice, Perform, and get Placed</p>

                <div className="search-container ip-hero-search" style={{ position: 'relative' }}>
                    <div className="search-input-group" style={{ flex: '3.15 1 0', minWidth: '0' }}>
                        <span className="search-icon">🏢</span>
                            <input
                                type="text"
                                className="search-input ip-company-input"
                                placeholder="Company"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchTerm && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="search-suggestions ip-suggestions">
                                {suggestions.map((s, i) => (
                                    <div 
                                        key={i} 
                                        className={`suggestion-item ${i === suggestionIndex ? 'active' : ''}`} 
                                        onClick={() => {
                                            setSearchTerm(s);
                                            setCompany(s);
                                            setSelectedCompany(s);
                                            setShowSuggestions(false);
                                            fetchQuestions(s);
                                        }}
                                        onMouseEnter={() => setSuggestionIndex(i)}
                                    >
                                        <div className="suggestion-info">
                                            <span className="suggestion-name">{s}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="search-input-group search-exp-input-group" style={{ flex: '5.35 1 0', minWidth: '0', borderLeft: '1px solid #e2e8f0' }}>
                        <span className="search-icon">💼</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Role"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                        />
                    </div>

                    <div className="search-input-group ip-type-group" style={{ flex: '1.5 1 0', minWidth: '0', borderLeft: '1px solid #e2e8f0', borderRight: 'none', paddingLeft: '0.4rem', paddingRight: '0.4rem', cursor: 'pointer' }}
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                        <div className="ip-custom-select-trigger">
                            <span className="ip-cst-text">{activeFilter}</span>
                            <span className={`ip-cst-arrow ${showFilterDropdown ? 'open' : ''}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </span>
                        </div>

                        {showFilterDropdown && (
                            <div className="ip-custom-dropdown">
                                {['Most Common', 'Recently Asked', 'Frequently Asked'].map(option => (
                                    <div
                                        key={option}
                                        className={`ip-custom-option ${activeFilter === option ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFilter(option);
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="search-btn" onClick={() => {
                        if (searchTerm) {
                            setSelectedCompany(searchTerm);
                            fetchQuestions(searchTerm);
                            setTimeout(() => {
                                document.querySelector('.ip-inline-questions')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }
                    }}>
                        <span className="search-btn-text">Search Questions</span>
                        <span className="search-btn-icon">🔍</span>
                    </button>
                </div>

                <div className="popular-searches">
                    <span className="popular-label">🔥 Trending:</span>
                    {TRENDING_COMPANIES.slice(0, 3).map(c => (
                        <button key={c.name} className="popular-tag" onClick={() => {
                            setSearchTerm(c.name);
                            setCompany(c.name);
                            setSelectedCompany(c.name);
                            fetchQuestions(c.name);
                            document.querySelector('.ip-details-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            {c.name}
                        </button>
                    ))}
                </div>

                <div className="ip-hero-actions">
                    <button className="ip-hero-action-btn" onClick={() => setShowSessionsModal(true)}>
                        <span className="btn-icon">🎁</span> Book Free Sessions
                    </button>
                </div>

                <div className="ip-hero-stats">
                    <div className="ip-hero-stat">
                        <span className="ip-stat-number">1,000+</span>
                        <span className="ip-stat-label">Questions</span>
                    </div>
                    <div className="ip-hero-stat-divider" />
                    <div className="ip-hero-stat">
                        <span className="ip-stat-number">10+</span>
                        <span className="ip-stat-label">Top Companies</span>
                    </div>
                    <div className="ip-hero-stat-divider" />
                    <div className="ip-hero-stat">
                        <span className="ip-stat-number">5,000+</span>
                        <span className="ip-stat-label">Students Prepped</span>
                    </div>
                    <div className="ip-hero-stat-divider" />
                    <div className="ip-hero-stat">
                        <span className="ip-stat-number">35+</span>
                        <span className="ip-stat-label">Free Sessions Conducted</span>
                    </div>
                </div>
            </div>


            {top3Sessions.length > 0 && (
                <div className="ip-homepage-sessions" style={{ marginBottom: '1rem' }}>
                    <div className="ip-section-header-row">
                        <h3 className="ip-section-subtitle">🎁 Featured Free Sessions</h3>
                        <button className="ip-view-all-btn" onClick={() => setShowSessionsModal(true)}>
                            View All <span className="arrow">→</span>
                        </button>
                    </div>
                    <div className="ip-homepage-sessions-container">
                        <div className="ip-sessions-grid">
                            {top3Sessions.map(session => (
                                <div key={session.id} className="ip-session-card-home" onClick={() => setSelectedSession(session)}>
                                    <div className="ip-session-badge-home">⚡ FREE SESSION</div>
                                    <h4 className="ip-session-title-home">{session.title}</h4>
                                    {session.sessionDate && (
                                        <div className="ip-session-date-home">
                                            📅 {new Date(session.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}
                                        </div>
                                    )}
                                    {session.description && (
                                        <p className="ip-session-desc-home" title={session.description}>
                                            {session.description} {session.schedule && `• ${session.schedule}`}
                                        </p>
                                    )}
                                    {session.skills && (
                                        <div className="ip-session-skills-home" style={{ 
                                            display: 'flex', 
                                            gap: '0.4rem', 
                                            flexWrap: 'nowrap', 
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            marginBottom: '1rem',
                                            marginTop: '0.5rem',
                                            width: '100%'
                                        }}>
                                            {session.skills.split(',').map((skill, idx) => (
                                                <span key={idx} className="ip-session-skill-tag-home" style={{
                                                    fontSize: '0.68rem',
                                                    background: 'rgba(124, 58, 237, 0.1)',
                                                    color: '#a855f7',
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    fontWeight: '600',
                                                    border: '1px solid rgba(124, 58, 237, 0.2)',
                                                    whiteSpace: 'nowrap',
                                                    display: 'inline-block'
                                                }}>
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="ip-session-footer-home">
                                        <button className="ip-session-view-btn" onClick={(e) => { e.stopPropagation(); setSelectedSession(session); }}>Details</button>
                                        <a 
                                            href={session.link} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="ip-session-join-btn" 
                                            onClick={(e) => { e.stopPropagation(); recordSessionJoin(session.id); }}
                                        >
                                            Join Now
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="ip-explore-header-wrapper" style={{ marginBottom: '1.25rem', padding: '0 0.5rem' }}>
                <div className="ip-explore-header">
                    <h2><span>🔍 Explore Prep<span className="highlight-orange">Zo</span></span></h2>
                    <p>Browse company+role combos from top companies — search questions</p>
                </div>
            </div>
            {selectedCompany && (
                <div className="ip-inline-questions">
                    <div className="ip-qs-layout">
                        <div className="ip-qs-main">
                            <div className="ip-inline-header">
                                <h3><span className="ip-ih-icon">📋</span> {activeFilter} {selectedCompany} Questions</h3>
                            </div>

                            <div className="ip-qs-sidebar">
                                <div className="ip-category-filters-vertical">
                                    {['All', 'Technical', 'Programming', 'Managerial', 'HR'].map(cat => (
                                        <button
                                            key={cat}
                                            className={`ip-cat-filter-v ${activeCategory === cat ? 'active' : ''}`}
                                            onClick={() => {
                                                setActiveCategory(cat);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                    <button className="ip-shuffle-btn" onClick={handleAiShuffle}>
                                        <span className="ip-shuffle-icon">🔀</span> Shuffle Questions
                                    </button>
                                </div>
                            </div>

                            <div className="ip-inline-content">
                                {loading ? (
                                    <div className="ip-generating-loader">
                                        <div className="ip-spinner"></div>
                                        <p>Loading questions...</p>
                                    </div>
                                ) : (() => {
                                    let currentCategoryQs = activeCategory === 'All'
                                        ? Object.values(groupedQuestions || {}).flat()
                                        : (groupedQuestions || {})[activeCategory] || [];

                                    if (targetRole && targetRole.trim() !== '') {
                                        currentCategoryQs = currentCategoryQs.filter(q => {
                                            if (!q.role) return false;
                                            const qRole = q.role.toLowerCase();
                                            const target = targetRole.toLowerCase();
                                            return qRole.includes(target) || qRole === 'general';
                                        });
                                    }

                                    if (currentCategoryQs.length === 0 && !loading) return (
                                        <div className="ip-no-qs-container">
                                            <div className="ip-no-qs-icon">🔍</div>
                                            <p className="ip-no-qs">
                                                No {activeFilter.toLowerCase()} {activeCategory !== 'All' ? activeCategory : ''} questions found {targetRole ? ` for the "${targetRole}" role ` : ''} at {selectedCompany}.
                                            </p>
                                            <p className="ip-no-qs-sub">Try removing the role filter or switching categories to see more content.</p>
                                        </div>
                                    );

                                    if (loading) return null; // Show nothing while loading (loader is handled above)

                                    const totalPages = Math.ceil(currentCategoryQs.length / questionsPerPage);
                                    const startIndex = (currentPage - 1) * questionsPerPage;
                                    const currentQs = currentCategoryQs.slice(startIndex, startIndex + questionsPerPage);

                                    const handlePageChange = (newPage) => {
                                        setCurrentPage(newPage);
                                        const target = document.querySelector('.ip-inline-questions');
                                        if (target) {
                                            window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
                                        }
                                    };

                                    return (
                                        <>
                                            <div className="ip-qs-list">
                                                {currentQs.map((q, idx) => (
                                                    <QuestionItem key={startIndex + idx} question={q} index={startIndex + idx} />
                                                ))}
                                            </div>

                                            <button className="ip-shuffle-btn-mobile" onClick={handleAiShuffle}>
                                                <span className="ip-shuffle-icon">🔀</span> Shuffle Questions
                                            </button>

                                            {totalPages > 1 && (
                                                <div className="ip-pagination">
                                                    <button
                                                        className="ip-pag-btn prev"
                                                        disabled={currentPage === 1}
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                    >
                                                        ← <span className="ip-pag-label">Prev</span>
                                                    </button>
                                                    <div className="ip-page-numbers">
                                                        {(() => {
                                                            const pages = [];
                                                            let start = currentPage;
                                                            let end = Math.min(totalPages, currentPage + 3);

                                                            // Ensure at least 3 pages are visible when approaching the end
                                                            if (totalPages - currentPage < 2 && totalPages > 2) {
                                                                start = Math.max(1, totalPages - 2);
                                                            }

                                                            for (let i = start; i <= end; i++) {
                                                                pages.push(i);
                                                            }
                                                            return pages.map(num => (
                                                                <button
                                                                    key={num}
                                                                    className={`ip-page-num ${currentPage === num ? 'active' : ''}`}
                                                                    onClick={() => handlePageChange(num)}
                                                                >
                                                                    {num}
                                                                </button>
                                                            ));
                                                        })()}
                                                    </div>
                                                    <button
                                                        className="ip-pag-btn next"
                                                        disabled={currentPage === totalPages}
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                    >
                                                        <span className="ip-pag-label">Next</span> →
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSessionsModal && (
                <div className="ip-modal-overlay" onClick={() => setShowSessionsModal(false)}>
                    <div className="ip-sessions-modal" onClick={e => e.stopPropagation()}>
                        <div className="ip-modal-header">
                            <h3><span className="modal-icon">🎁</span> Free Mentorship Sessions</h3>
                            <button className="ip-modal-close" onClick={() => setShowSessionsModal(false)}>×</button>
                        </div>
                        <div className="ip-modal-body">
                            <p className="modal-intro">Get expert guidance with our curated free sessions by Placement Babai.</p>

                            <div className="sessions-toolbar">
                                <div className="session-filters">
                                    <div className="session-search-group">
                                        <span className="session-search-icon">🔍</span>
                                        <input
                                            type="text"
                                            placeholder="Search sessions..."
                                            value={sessionSearch}
                                            onChange={(e) => setSessionSearch(e.target.value)}
                                            className="session-search-input"
                                        />
                                    </div>
                                </div>
                                <CustomSelect 
                                    options={[
                                        { label: 'Newest First', value: 'newest' },
                                        { label: 'Oldest First', value: 'oldest' },
                                        { label: 'Today', value: 'today' },
                                    ]}
                                    value={sessionSort}
                                    onChange={(val) => setSessionSort(val)}
                                    theme="dark"
                                />
                            </div>

                            <div className="sessions-list">
                                {filteredSessions.length > 0 ? (
                                    filteredSessions.map(session => (
                                         <div key={session.id} className="session-card" onClick={() => setSelectedSession(session)}>
                                             <div className="session-info">
                                                 <div className="session-header-row" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                                                     <h4 style={{ margin: 0 }}>{session.title}</h4>
                                                     {session.sessionDate && (
                                                         <span className="session-date-tag" style={{ 
                                                             fontSize: '0.75rem', 
                                                             background: 'rgba(249, 115, 22, 0.1)', 
                                                             color: '#f97316', 
                                                             padding: '2px 8px', 
                                                             borderRadius: '6px',
                                                             fontWeight: '700',
                                                             border: '1px solid rgba(249, 115, 22, 0.2)',
                                                             whiteSpace: 'nowrap'
                                                         }}>
                                                             📅 {new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                         </span>
                                                     )}
                                                 </div>
                                                  <p 
                                                      className="session-desc"
                                                      title="Click for full details"
                                                  >
                                                      {session.description} {session.schedule && `• ${session.schedule}`}
                                                  </p>
                                                  {session.skills && (
                                                      <div className="session-skills-tags" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem', maxHeight: '1.4rem', overflow: 'hidden' }}>
                                                          {session.skills.split(',').map((skill, idx) => (
                                                              <span key={idx} className="session-skill-tag" style={{
                                                                  fontSize: '0.65rem',
                                                                  background: 'rgba(124, 58, 237, 0.1)',
                                                                  color: '#7c3aed',
                                                                  padding: '2px 8px',
                                                                  borderRadius: '4px',
                                                                  fontWeight: '600',
                                                                  border: '1px solid rgba(124, 58, 237, 0.2)'
                                                              }}>
                                                                  {skill.trim()}
                                                              </span>
                                                          ))}
                                                      </div>
                                                  )}
                                              </div>
                                             <a href={session.link} target="_blank" rel="noreferrer" className="session-link-btn" onClick={(e) => { e.stopPropagation(); recordSessionJoin(session.id); }}>Join Now</a>
                                         </div>
                                    ))
                                ) : (
                                    <p className="no-sessions" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                                        {sessionSearch ? "No sessions found matching your search." : "No active sessions available at the moment. Check back soon!"}
                                    </p>
                                )}
                            </div>

                            <div className="modal-footer">
                                <p>Powered by <span className="highlight-violet">Placement Babai</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedSession && (
                <SessionDetail 
                    session={selectedSession} 
                    onClose={() => setSelectedSession(null)} 
                />
            )}
        </div>
    );
}

export default InterviewPrep;
