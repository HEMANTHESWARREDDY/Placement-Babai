import React, { useState, useEffect, useRef } from 'react';
import ProDetail from './ProDetail';
import AllMentorsList from './AllMentorsList';
import RegisterMentorModal from './RegisterMentorModal';
import { API_BASE_URL } from './config';
import './ProConnect.css';

function ProConnect({ onMentorLoginClick }) {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchExperience, setSearchExperience] = useState('');
    const [selectedPro, setSelectedPro] = useState(null);
    const [showAllMentors, setShowAllMentors] = useState(() => localStorage.getItem('showAllMentors') === 'true');
    const [showRegisterMentor, setShowRegisterMentor] = useState(false);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const scrollRef = useRef(null);

    const isSearching = searchKeyword.trim() !== '' || searchExperience !== '';

    const filteredPros = mentors.filter(pro => {
        let matchKw = true;
        if (searchKeyword.trim()) {
            const kw = searchKeyword.toLowerCase();
            matchKw =
                (pro.name && pro.name.toLowerCase().includes(kw)) ||
                (pro.role && pro.role.toLowerCase().includes(kw)) ||
                (pro.company && pro.company.toLowerCase().includes(kw)) ||
                (pro.expertise && pro.expertise.toLowerCase().includes(kw)) ||
                (pro.serviceKeywords && pro.serviceKeywords.toLowerCase().includes(kw));
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

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const sl = Math.ceil(scrollLeft);
            
            // Only show arrows if the container is truly scrollable
            const isScrollable = scrollWidth > clientWidth + 20;
            
            // Use a larger threshold (40px) to ensure no phantom arrow at start
            setCanScrollLeft(isScrollable && sl > 40);
            setCanScrollRight(isScrollable && (sl + clientWidth < scrollWidth - 20));
        }
    };

    useEffect(() => {
        if (!loading && !showAllMentors && !isSearching) {
            const timer = setTimeout(checkScroll, 300);
            window.addEventListener('resize', checkScroll);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [loading, showAllMentors, mentors, searchKeyword, filteredPros.length, isSearching]);

    const scrollNext = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
    };

    const scrollPrev = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        localStorage.setItem('showAllMentors', showAllMentors);
    }, [showAllMentors]);

    useEffect(() => {
        fetchMentors();
    }, []);

    // Deep linking for mentor profile
    useEffect(() => {
        if (mentors.length === 0) return;
        const params = new URLSearchParams(window.location.search);
        const proId = params.get('pro');
        if (proId) {
            const found = mentors.find(m => String(m.id) === String(proId));
            if (found) {
                setSelectedPro(found);
                setShowAllMentors(true); 
            }
        }
    }, [mentors]);

    // Update URL when selectedPro changes
    useEffect(() => {
        if (loading && mentors.length === 0) return;
        const url = new URL(window.location.href);
        const currentProId = url.searchParams.get('pro');
        if (selectedPro) {
            if (String(currentProId) !== String(selectedPro.id)) {
                url.searchParams.set('pro', selectedPro.id);
                window.history.pushState({}, '', url.toString());
            }
        } else {
            if (currentProId) {
                url.searchParams.delete('pro');
                window.history.pushState({}, '', url.toString());
            }
        }
    }, [selectedPro, loading, mentors]);

    const fetchMentors = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentors`);
            if (res.ok) {
                const data = await res.json();
                const processed = data.map(m => {
                    let finalServices = [];
                    try {
                        if (m.services) {
                            if (typeof m.services === 'string') {
                                finalServices = JSON.parse(m.services);
                            } else if (Array.isArray(m.services)) {
                                finalServices = m.services;
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing services', m.id, e);
                    }
                    
                    // Fallback to defaults if empty
                    if (!finalServices || finalServices.length === 0) {
                        finalServices = [
                            { keywords: '1:1 Mentorship, Career Guidance, Mock Interview', title: '1:1 Mentorship', price: 'Free', tag: '✨ Popular' },
                            { keywords: 'Resume Review, ATS Optimization, Profile Evaluation', title: 'Resume Review', price: 'Free', tag: '⭐ Best Seller' }
                        ];
                    }
                    
                    const serviceKeywords = finalServices.map(s => s.keywords || '').join(', ');
                    return {
                        ...m,
                        exp: m.experience ? (m.experience.toLowerCase().includes('year') ? m.experience : `${m.experience} Years of experience`) : '1 Year of experience',
                        rating: m.rating || '4.8',
                        initials: m.name ? m.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'M',
                        image: m.image || null,
                        headerBg: m.headerBg || 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        avatarBg: m.avatarBg || '#1e293b',
                        services: finalServices,
                        serviceKeywords: serviceKeywords
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
                {selectedPro && <ProDetail pro={selectedPro} onClose={() => setSelectedPro(null)} />}
            </div>
        );
    }

    return (
        <div className="pro-connect-container">
            <div className="pro-hero">
                <h1 className="pro-hero-title">
                    <div className="pro-title-top">Pro <span className="highlight-text">Connect</span></div>
                    <div className="pro-title-bottom">Let Placement<span className="highlight-violet">Babai</span> Connect <span className="mobile-break">You with Experts</span></div>
                </h1>
                
                <p className="pro-subtitle">Guidance from Industry Professionals for Your Career Growth</p>
                <p className="pro-desc">Connect, ask, learn, and improve</p>

                <div className="search-container" style={{ position: 'relative' }}>
                    <div className="search-input-group" style={{ flex: '1.2' }}>
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by Name, Role, Company, or Skills"
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
                    </div>

                    <button className="search-btn" onClick={() => document.querySelector('.pro-profiles-section')?.scrollIntoView({ behavior: 'smooth' })}>
                        Search Mentors
                    </button>
                </div>

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

                <div className="pro-hero-btn-wrapper">
                    <button className="become-mentor-hero-btn" onClick={() => setShowRegisterMentor(true)}>
                        Become a Mentor
                    </button>
                </div>

                <div className="pro-hero-stats">
                    <div className="pro-hero-stat">
                        <span className="pro-stat-number">50+</span>
                        <span className="pro-stat-label">Mentors</span>
                    </div>
                    <div className="pro-hero-stat-divider" />
                    <div className="pro-hero-stat">
                        <span className="pro-stat-number">25+</span>
                        <span className="pro-stat-label">Companies</span>
                    </div>
                    <div className="pro-hero-stat-divider" />
                    <div className="pro-hero-stat">
                        <span className="pro-stat-number">1,000+</span>
                        <span className="pro-stat-label">Students Guided</span>
                    </div>
                    <div className="pro-hero-stat-divider" />
                    <div className="pro-hero-stat">
                        <span className="pro-stat-number">200+</span>
                        <span className="pro-stat-label">Career Sessions</span>
                    </div>
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
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>Loading mentors...</div>
                ) : filteredPros.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>No mentors found.</div>
                ) : (
                    <div className="pro-grid-slider-wrapper">
                        <div 
                            className={`pro-grid ${!isSearching ? 'top-mentors-grid' : ''}`}
                            ref={!isSearching ? scrollRef : null}
                            onScroll={!isSearching ? checkScroll : null}
                        >
                            {filteredPros.map(pro => (
                                <div className="tm-card" key={pro.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPro(pro)}>
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
                                        <div className="tm-socials" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '0.2rem', paddingRight: '0.2rem' }}>
                                            <div className="tm-rating" style={{ margin: 0 }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#eab308' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                                {pro.rating}
                                            </div>
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
                                        </div>
                                        <h3 className="tm-name" style={{ margin: '0 0 0.2rem 0' }}>{pro.name}</h3>
                                        <p className="tm-role">
                                            {pro.role} @ {pro.company || 'Industry'} | {(() => {
                                                let expValue = pro.experience || pro.exp || '1';
                                                // If it's already a full descriptive string, just fix the 1 years case
                                                if (expValue.toString().toLowerCase().includes('experience') || expValue.toString().toLowerCase().includes('exp')) {
                                                    return expValue.toString().replace(/1 Years/g, '1 Year');
                                                }
                                                // Otherwise, treat as a number (e.g. "2" or "2 Year") and format it
                                                const num = parseInt(expValue);
                                                if (isNaN(num)) return expValue;
                                                return `${num} ${num === 1 ? 'Year' : 'Years'} of exp`;
                                            })()} | {pro.topics ? pro.topics.substring(0, 100) : 'No expertise added yet'}
                                        </p>
                                        <button className="tm-btn" onClick={() => setSelectedPro(pro)}>View Profile</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {!isSearching && filteredPros.length > 1 && (
                            <>
                                {canScrollLeft && (
                                    <button className="pro-slider-arrow prev" onClick={scrollPrev} aria-label="Previous">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                    </button>
                                )}
                                {canScrollRight && (
                                    <button className="pro-slider-arrow next" onClick={scrollNext} aria-label="Next">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {selectedPro && <ProDetail pro={selectedPro} onClose={() => setSelectedPro(null)} />}
            {showRegisterMentor && <RegisterMentorModal onClose={() => setShowRegisterMentor(false)} onLoginClick={onMentorLoginClick} />}
        </div>
    );
}

export default ProConnect;
