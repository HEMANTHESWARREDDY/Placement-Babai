import React, { useState } from 'react';
import ProDetail from './ProDetail';
import AllMentorsList from './AllMentorsList';
import RegisterMentorModal from './RegisterMentorModal';
import './ProConnect.css';

const pros = [
    {
        id: 1, name: "Vedansh Dubey", role: "Assistant Manager HR @ Wipro | MBA @XIMB, Ex-TCS, Nestlé", exp: "4 years",
        rating: "4.9", reviews: "346",
        expertise: "HR, Resume Review", initials: "VD",
        image: "https://randomuser.me/api/portraits/men/45.jpg",
        headerBg: "linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)", avatarBg: "#fcd34d",
        about: "Guided 500+ students towards successful placements. specialized in MBA HR roles and tech recruitment.",
        topics: ["Mock Interviews", "Resume Formatting", "Salary Negotiation"],
        skills: ["HR Consulting", "Recruitment", "Communication"],
        fluentIn: ["English", "Hindi"],
        education: ["MBA @XIMB", "BTech @VIT"],
        workExperience: ["Assistant Manager HR @ Wipro", "Ex-TCS", "Nestlé"],
        services: [
            { type: '1:1 Call', title: 'Mock Interview (HR)', price: '₹399', tag: 'Best Seller' },
            { type: 'Query', title: 'Resume Review', price: '₹199', tag: 'Resource' }
        ]
    },
    {
        id: 2, name: "Vaibhav Sharma", role: "Strategy @ Meesho | IIM Lucknow | Top 15 Unstoppable Mentor", exp: "4 years",
        rating: "4.8", reviews: "210",
        expertise: "Consulting", initials: "VS",
        headerBg: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)", avatarBg: "#0ea5e9",
        about: "Winner & Finalist in 23+ Int'l & Nat'l Corporate Case Competitions Recognized as Top 100 Unstoppable B-School Leaders 2024.",
        topics: ["Case Interviews", "B-School Strategy", "Marketing Prep"],
        skills: ["Strategy", "Problem Solving", "Marketing"],
        fluentIn: ["English", "Hindi"],
        education: ["MBA from IIM Lucknow"],
        workExperience: ["Strategy @ Meesho", "Analyst @ Deloitte"],
        services: [
            { type: '1:1 Call', title: 'Case Interview Strategy', price: '₹499', tag: 'Best Seller' },
            { type: 'Query', title: 'Marketing Prep Material', price: '₹199', tag: 'Resource' },
            { type: 'Query', title: 'Winning Case Competitions Guide', price: '₹99', tag: 'Resource' }
        ]
    },
    {
        id: 3, name: "Palak Gupta", role: "Consulting Analyst @ Accenture | MBA (Gold Medalist) @ IIM ...", exp: "3 years",
        rating: "4.9", reviews: "152",
        expertise: "Analytics, Consulting", initials: "PG",
        image: "https://randomuser.me/api/portraits/women/68.jpg",
        headerBg: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)", avatarBg: "#ec4899",
        about: "Gold medalist with deep expertise in analytics and management consulting. Helped 50+ candidates crack MBB.",
        topics: ["Consulting Cases", "Data Frameworks", "Guesstimates"],
        skills: ["Data Analytics", "Consulting", "Excel/SQL"],
        fluentIn: ["English"],
        education: ["MBA (Gold Medalist)", "B.Com Hons"],
        workExperience: ["Consulting Analyst @ Accenture"],
        services: [
            { type: '1:1 Call', title: 'Guesstimate Practice', price: '₹349', tag: 'Best Seller' }
        ]
    },
    {
        id: 4, name: "Shiri Agarwal", role: "Product @ Telstra | MBA @ MDI Gurgaon'24 | Rank 6th ...", exp: "5 years",
        rating: "4.9", reviews: "258",
        expertise: "Product Management", initials: "SA",
        image: "https://randomuser.me/api/portraits/women/44.jpg",
        headerBg: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", avatarBg: "#8b5cf6",
        about: "Product Manager deeply passionate about building consumer tech. Ranked 6th across India in PM competitions.",
        topics: ["PM Interviews", "Product Teardowns", "Portfolio Review"],
        skills: ["Product Strategy", "Figma", "User Research"],
        fluentIn: ["English"],
        education: ["MBA @ MDI Gurgaon'24"],
        workExperience: ["Product @ Telstra", "APM @ Byjus"],
        services: [
            { type: '1:1 Call', title: 'PM Mock Interview', price: '₹599', tag: 'Best Seller' },
            { type: 'Query', title: 'Product Portfolio Review', price: '₹299', tag: 'Resource' }
        ]
    }
];

function ProConnect() {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchExperience, setSearchExperience] = useState('');
    const [selectedPro, setSelectedPro] = useState(null);
    const [showAllMentors, setShowAllMentors] = useState(false);
    const [showRegisterMentor, setShowRegisterMentor] = useState(false);

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

    if (showAllMentors) {
        return (
            <div className="pro-connect-container">
                <AllMentorsList
                    mentors={filteredPros}
                    onBack={() => setShowAllMentors(false)}
                    onSelectPro={setSelectedPro}
                />
                {selectedPro && (
                    <ProDetail pro={selectedPro} onClose={() => setSelectedPro(null)} />
                )}
            </div>
        );
    }

    return (
        <div className="pro-connect-container">
            <div className="pro-hero">
                <h1>Pro <span className="highlight-text">Connect</span></h1>

                <p className="pro-subtitle">
                    A dedicated space to connect with industry professionals, mentors, and experienced engineers.
                </p>
                <div className="pro-tagline">
                    Connect faster. Grow faster. Get hired faster. 🚀
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    <button
                        className="become-mentor-hero-btn"
                        onClick={() => setShowRegisterMentor(true)}
                    >
                        Become a Mentor
                    </button>
                </div>

                {/* Search Bar for Pros */}
                <div className="search-container" style={{ marginTop: '2.5rem' }}>
                    <div className="search-input-group" style={{ flex: '1.2' }}>
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by Role, Company, or Skills"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>

                    <div className="search-input-group search-exp-input-group" style={{ flex: '0.9', borderLeft: '1px solid #e2e8f0', paddingLeft: '1.4rem' }}>
                        <span className="search-icon">🎓</span>
                        <input
                            type="text"
                            className="search-input search-exp-number"
                            placeholder="Years of experience"
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
                <div className="pro-section-header">
                    <div className="pro-section-title">
                        <h2>Top Mentors</h2>
                        <p>In search of excellence? Explore the highest-rated mentors as recognized by the learner community.</p>
                    </div>
                    <button className="pro-view-all-btn" onClick={() => setShowAllMentors(true)}>
                        View All <span className="pro-view-all-arrow">❯</span>
                    </button>
                </div>

                {filteredPros.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>
                        No mentors found matching your search criteria. Try a different search!
                    </div>
                ) : (
                    <div className="pro-grid">
                        {filteredPros.map(pro => (
                            <div className="tm-card" key={pro.id}>
                                <div className="tm-header" style={{ background: pro.headerBg }}></div>
                                <div className="tm-avatar-container">
                                    <div className="tm-avatar" style={{ backgroundColor: pro.avatarBg }}>
                                        {pro.image ? <img src={pro.image} alt={pro.name} className="tm-avatar-img" /> : pro.initials}
                                    </div>
                                    <div className="tm-trophy">🏆</div>
                                </div>
                                <div className="tm-content">
                                    <h3 className="tm-name">{pro.name}</h3>
                                    <div className="tm-rating">⭐ {pro.rating} <span>({pro.reviews} Reviews)</span></div>
                                    <p className="tm-role">{pro.role}</p>
                                    <button className="tm-btn" onClick={() => setSelectedPro(pro)}>View Profile</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Render details modal if selected */}
            {selectedPro && (
                <ProDetail pro={selectedPro} onClose={() => setSelectedPro(null)} />
            )}

            {/* Render Become Mentor Modal */}
            {showRegisterMentor && (
                <RegisterMentorModal onClose={() => setShowRegisterMentor(false)} />
            )}
        </div>
    );
}

export default ProConnect;
