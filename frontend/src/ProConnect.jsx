import React, { useState, useEffect } from 'react';
import ProDetail from './ProDetail';
import AllMentorsList from './AllMentorsList';
import RegisterMentorModal from './RegisterMentorModal';
import { API_BASE_URL } from './config';
import './ProConnect.css';

function ProConnect({ onMentorLoginClick }) {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchExperience, setSearchExperience] = useState('');
    const [selectedPro, setSelectedPro] = useState(null);
    const [showAllMentors, setShowAllMentors] = useState(false);
    const [showRegisterMentor, setShowRegisterMentor] = useState(false);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentors`);
            if (res.ok) {
                const data = await res.json();
                const processed = data.map(m => {
                    let parsedServices = [];
                    try {
                        if (m.services) {
                            parsedServices = JSON.parse(m.services);
                        }
                    } catch (e) {
                        console.error('Error parsing services for mentor', m.id, e);
                    }

                    const finalServices = (parsedServices && parsedServices.length > 0) ? parsedServices : [
                        { type: '1:1 Call', title: '1:1 Call Mentorship', price: '₹499', tag: 'Best Seller' },
                        { type: 'Resume Review', title: 'Resume Review', price: '₹199', tag: 'Resource' }
                    ];

                    return {
                        ...m,
                        id: m.id,
                        name: m.name,
                        role: m.role || 'Industry Expert',
                        exp: m.experience ? (m.experience.toLowerCase().includes('year') ? m.experience : `${m.experience} Years of experience`) : '1 Year of experience',
                        rating: m.rating || '4.8',
                        reviews: m.reviews || '0',
                        expertise: m.skills || '',
                        initials: m.name ? m.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'M',
                        image: m.image || null,
                        headerBg: (m.headerBg && m.headerBg.trim() !== '') ? m.headerBg : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        avatarBg: m.avatarBg || '#1e293b',
                        about: m.bio || '',
                        topics: m.topics || '',
                        education: m.education || '',
                        workExperience: m.workExperience || '',
                        isAvailable: m.isAvailable === true,
                        services: finalServices
                    };
                });
                setMentors(processed);
            }
        } catch (e) {
            console.error('Error fetching mentors:', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredPros = mentors.filter(pro => {
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

        let matchAvail = pro.isAvailable === true;

        return matchKw && matchExp && matchAvail;
    });

    if (showAllMentors) {
        return (
            <div className="pro-connect-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b', fontSize: '1.25rem' }}>Loading mentors...</div>
                ) : (
                    <AllMentorsList
                        mentors={filteredPros}
                        onBack={() => setShowAllMentors(false)}
                        onSelectPro={setSelectedPro}
                    />
                )}
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
                        <p>Unlock your potential with elite mentorship. Connect with top industry experts and accelerate your career growth.</p>
                    </div>
                    <button className="pro-view-all-btn" onClick={() => setShowAllMentors(true)}>
                        View All <span className="pro-view-all-arrow">❯</span>
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>
                        Loading mentors...
                    </div>
                ) : filteredPros.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>
                        No mentors found matching your search criteria. Try a different search!
                    </div>
                ) : (
                    <div className="pro-grid">
                        {filteredPros.map(pro => (
                            <div className="tm-card" key={pro.id}>
                                <div className="tm-header" style={{ 
                                    background: pro.headerBg?.includes('gradient') ? pro.headerBg : 
                                               (pro.headerBg?.startsWith('http') || pro.headerBg?.startsWith('data:image')) ? `url(${pro.headerBg}) center/cover no-repeat` : 
                                               pro.headerBg || '#fbcfe8'
                                }}></div>
                                <div className="tm-avatar-container">
                                    <div className="tm-avatar" style={{ backgroundColor: pro.avatarBg }}>
                                        {pro.image ? <img src={pro.image} alt={pro.name} className="tm-avatar-img" /> : pro.initials}
                                    </div>

                                </div>
                                <div className="tm-content">
                                    <h3 className="tm-name">{pro.name}</h3>
                                    <div className="tm-rating">⭐ {pro.rating}</div>
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
                <RegisterMentorModal 
                    onClose={() => setShowRegisterMentor(false)} 
                    onLoginClick={onMentorLoginClick}
                />
            )}
        </div>
    );
}

export default ProConnect;
