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
                        email: m.email || '',
                        linkedin: m.linkedin || '',
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

    const isSearching = searchKeyword.trim() !== '' || searchExperience !== '';

    const filteredPros = mentors.filter(pro => {
        let matchKw = true;
        if (searchKeyword.trim()) {
            const kw = searchKeyword.toLowerCase();
            matchKw =
                (pro.name && pro.name.toLowerCase().includes(kw)) ||
                (pro.role && pro.role.toLowerCase().includes(kw)) ||
                (pro.company && pro.company.toLowerCase().includes(kw)) ||
                (pro.expertise && pro.expertise.toLowerCase().includes(kw));
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
                    Connect faster. Grow faster. Get hired faster.
                </div>


                {/* Search Bar for Pros */}
                <div className="search-container" style={{ marginTop: '1.5rem', position: 'relative' }}>
                    <div className="search-input-group" style={{ flex: '1.2' }}>
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by Name, Role, Company, or Skills"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                        {(() => {
                            const suggestions = mentors
                                .filter(m => 
                                    m.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                                    (m.role && m.role.toLowerCase().includes(searchKeyword.toLowerCase())) ||
                                    (m.company && m.company.toLowerCase().includes(searchKeyword.toLowerCase()))
                                )
                                .slice(0, 2);
                            
                            if (searchKeyword.trim() === '' || suggestions.length === 0) return null;

                            return (
                                <div className="search-suggestions">
                                    {suggestions.map(suggestion => (
                                        <div 
                                            key={suggestion.id} 
                                            className="suggestion-item"
                                            onClick={() => {
                                                setSearchKeyword(suggestion.name);
                                                document.querySelector('.pro-profiles-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                        >
                                            <div className="suggestion-avatar" style={{ backgroundColor: suggestion.avatarBg }}>
                                                {suggestion.image ? <img src={suggestion.image} alt="" /> : suggestion.initials}
                                            </div>
                                            <div className="suggestion-info">
                                                <div className="suggestion-name">{suggestion.name}</div>
                                                <div className="suggestion-meta">{suggestion.role} @ {suggestion.company}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
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

                {/* Popular Searches for Mentors */}
                <div className="popular-searches">
                    <span className="popular-label">🔥 Trending:</span>
                    {['AI Developer', 'Machine Learning', 'Data Science', 'Generative AI', 'Python'].slice(0, 2).map(tag => (
                        <button key={tag} className="popular-tag" onClick={() => {
                            setSearchKeyword(tag);
                            document.querySelector('.pro-profiles-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            {tag}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    <button
                        className="become-mentor-hero-btn"
                        onClick={() => setShowRegisterMentor(true)}
                    >
                        Become a Mentor
                    </button>
                </div>
            </div>

            <div className="pro-profiles-section">
                <div className="pro-section-header">
                    <div className="pro-section-title">
                        <h2>{isSearching ? 'Search Results' : 'Top Mentors'}</h2>
                        <p>
                            {isSearching 
                                ? `Found ${filteredPros.length} mentor${filteredPros.length === 1 ? '' : 's'} matching your criteria.`
                                : 'Unlock your potential with elite mentorship. Connect with top industry experts and accelerate your career growth.'
                            }
                        </p>
                    </div>
                    {!isSearching && (
                        <button className="pro-view-all-btn" onClick={() => setShowAllMentors(true)}>
                            View All <span className="pro-view-all-arrow">❯</span>
                        </button>
                    )}
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
                                    <div className="tm-socials" style={{ 
                                        display: 'flex', 
                                        gap: '0.8rem', 
                                        justifyContent: 'flex-end', 
                                        marginBottom: '0.5rem',
                                        paddingRight: '0.2rem'
                                    }}>
                                        {pro.email && (
                                            <a href={`mailto:${pro.email}`} className="tm-social-icon" title="Email" onClick={(e) => e.stopPropagation()} style={{ color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                            </a>
                                        )}
                                        {pro.linkedin && (
                                            <a href={pro.linkedin} target="_blank" rel="noopener noreferrer" className="tm-social-icon" title="LinkedIn" onClick={(e) => e.stopPropagation()} style={{ color: '#0077b5', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                                            </a>
                                        )}
                                        <div className="tm-social-icon" title="Share" style={{ cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }} onClick={(e) => {
                                            e.stopPropagation();
                                            if (navigator.share) {
                                                navigator.share({ title: pro.name, text: pro.role, url: `${window.location.origin}${window.location.pathname}?pro=${pro.id}` }).catch(() => {});
                                            } else {
                                                navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?pro=${pro.id}`);
                                                alert('Link copied to clipboard!');
                                            }
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                                        <h3 className="tm-name" style={{ margin: 0 }}>{pro.name}</h3>
                                        <div className="tm-rating" style={{ margin: 0 }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#eab308' }}>
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                            </svg>
                                            {pro.rating}
                                        </div>
                                    </div>
                                    <p className="tm-role">
                                        {pro.role} @ {pro.company || 'Industry'} | {pro.expertise}
                                    </p>
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
