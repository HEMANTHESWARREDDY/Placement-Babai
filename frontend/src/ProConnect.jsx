import React, { useState } from 'react';
import './ProConnect.css';

function ProConnect() {
    const pros = [
        { id: 1, name: "Rahul Sharma", role: "Senior SDE @ Amazon", exp: "8+ Yrs Exp", expertise: "System Design, FAANG Interviews", initials: "RS", color: "#f59e0b" },
        { id: 2, name: "Priya Patel", role: "Frontend Lead @ Google", exp: "6+ Yrs Exp", expertise: "React Performance, UI/UX", initials: "PP", color: "#10b981" },
        { id: 3, name: "Amit Kumar", role: "Cloud Architect @ Microsoft", exp: "10+ Yrs Exp", expertise: "Azure, Cloud Migration", initials: "AK", color: "#3b82f6" },
        { id: 4, name: "Sneha Gupta", role: "Data Scientist @ Meta", exp: "5+ Yrs Exp", expertise: "Machine Learning, Resume Review", initials: "SG", color: "#8b5cf6" },
        { id: 5, name: "Vikram Singh", role: "Engineering Manager @ Uber", exp: "12+ Yrs Exp", expertise: "Leadership, Career Growth", initials: "VS", color: "#ef4444" },
        { id: 6, name: "Neha Verma", role: "Product Designer @ Atlassian", exp: "7+ Yrs Exp", expertise: "Product Thinking, Portfolios", initials: "NV", color: "#06b6d4" },
    ];

    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchExperience, setSearchExperience] = useState('');

    const filteredPros = pros.filter(pro => {
        let matchKw = true;
        if (searchKeyword.trim()) {
            const kw = searchKeyword.toLowerCase();
            matchKw =
                pro.name.toLowerCase().includes(kw) ||
                pro.role.toLowerCase().includes(kw) ||
                pro.expertise.toLowerCase().includes(kw);
        }

        let matchExp = true;
        if (searchExperience !== '') {
            const expVal = parseInt(searchExperience, 10);
            const proExpVal = parseInt(pro.exp, 10);
            if (!isNaN(expVal) && !isNaN(proExpVal)) {
                // Show mentors with AT LEAST the required experience
                matchExp = proExpVal >= expVal;
            }
        }

        return matchKw && matchExp;
    });

    return (
        <div className="pro-connect-container">
            <div className="pro-hero">
                <h1>Pro <span className="highlight-text">Connect</span></h1>

                {/* Search Bar for Pros */}
                <div className="search-container" style={{ marginTop: '2rem' }}>
                    <div className="search-input-group">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by Role, Company, or Skills"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>

                    <div className="search-input-group search-exp-input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="search-icon" style={{ marginRight: 0 }}>🎓</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Years of experience</span>
                        <input
                            type="number"
                            min="0"
                            max="30"
                            className="search-input search-exp-number"
                            placeholder=""
                            value={searchExperience}
                            onChange={(e) => setSearchExperience(e.target.value)}
                        />
                        {searchExperience !== '' && (
                            <span className="exp-badge">
                                {parseInt(searchExperience, 10) === 0 ? '🌱 Fresher' : parseInt(searchExperience, 10) <= 3 ? '📅 Junior' : '🚀 Senior'}
                            </span>
                        )}
                    </div>

                    <button className="search-btn" onClick={() => {
                        // The filtering is real-time, but this button provides psychological closure
                        document.querySelector('.pro-profiles-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        Search Mentors
                    </button>
                </div>
            </div>

            <div className="pro-profiles-section">
                <h2>Meet Our Mentors</h2>
                {filteredPros.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>
                        No mentors found matching your search criteria. Try a different search!
                    </div>
                ) : (
                    <div className="pro-grid">
                        {filteredPros.map(pro => (
                            <div className="pro-card" key={pro.id}>
                                <div className="pro-avatar" style={{ backgroundColor: pro.color }}>
                                    {pro.initials}
                                </div>
                                <h3 className="pro-name">{pro.name}</h3>
                                <p className="pro-role">{pro.role}</p>
                                <p className="pro-exp">⏱️ {pro.exp}</p>
                                <div className="pro-expertise">
                                    <span>💡</span> {pro.expertise}
                                </div>
                                <button className="book-session-btn" onClick={() => alert("Booking session flow coming soon!")}>Book a Session</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProConnect;
