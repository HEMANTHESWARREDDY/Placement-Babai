import React from 'react';
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

    return (
        <div className="pro-connect-container">
            <div className="pro-hero">
                <h1>Pro <span className="highlight-text">Connect</span></h1>
                <p className="pro-subtitle">A dedicated space to connect with industry professionals, mentors, and experienced engineers.</p>
                <p className="pro-desc">Get career advice, interview tips, resume guidance, and real insights from people working in top tech companies.</p>
                <div className="pro-tagline">Learn from the pros. Grow faster 🚀</div>
            </div>

            <div className="pro-profiles-section">
                <h2>Meet Our Mentors</h2>
                <div className="pro-grid">
                    {pros.map(pro => (
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
            </div>
        </div>
    );
}

export default ProConnect;
