import React, { useState, useMemo, useEffect, useRef } from 'react';
import './AllMentorsList.css';

function AllMentorsList({ mentors, onBack, onSelectPro }) {
    const [sortBy, setSortBy] = useState('bookings');
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [filterExperience, setFilterExperience] = useState('all');
    const [showTopMentorsOnly, setShowTopMentorsOnly] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const sortMenuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
                setShowSortMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sortMenuRef]);

    const filteredAndSortedMentors = useMemo(() => {
        let result = mentors.filter(p => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = p.name.toLowerCase().includes(term) ||
                p.role.toLowerCase().includes(term) ||
                (p.company && p.company.toLowerCase().includes(term)) ||
                (p.topics && p.topics.toLowerCase().includes(term)) ||
                (p.skills && p.skills.toLowerCase().includes(term));
            
            let matchesCategory = true;
            if (selectedCategory) {
                const cat = selectedCategory.toLowerCase();
                // Special check for '1:1 Mentorship' which matches many services
                const is1to1 = cat.includes('1:1');
                
                matchesCategory = (p.topics && p.topics.toLowerCase().includes(cat)) ||
                                 (p.skills && p.skills.toLowerCase().includes(cat)) ||
                                 (p.role && p.role.toLowerCase().includes(cat)) ||
                                 (p.services && p.services.some(s => s.title.toLowerCase().includes(cat))) ||
                                 (is1to1 && p.services && p.services.some(s => s.title.toLowerCase().includes('mentor')));
            }

            // Experience filter
            let matchesExperience = true;
            if (filterExperience !== 'all') {
                const requiredExp = parseInt(filterExperience, 10);
                const proExpVal = parseInt(p.experience || p.exp || '0', 10);
                if (isNaN(proExpVal) || proExpVal < requiredExp) {
                    matchesExperience = false;
                }
            }

            // Availability filter - only show available mentors
            let matchesAvailability = p.isAvailable === true;

            return matchesSearch && matchesCategory && matchesExperience && matchesAvailability;
        });

        if (showTopMentorsOnly) {
            // Rank by combined score (bookings * 2 + rating * 3) and slice top 5
            result.sort((a, b) => {
                const scoreA = (a.bookingCount || 0) * 2 + (a.rating || 0) * 3;
                const scoreB = (b.bookingCount || 0) * 2 + (b.rating || 0) * 3;
                return scoreB - scoreA;
            });
            result = result.slice(0, 5);
        } else {
            if (sortBy === 'bookings') {
                result.sort((a, b) => {
                    const countA = a.bookingCount || 0;
                    const countB = b.bookingCount || 0;
                    if (countB !== countA) return countB - countA;
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                });
            } else if (sortBy === 'name-asc') {
                result.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
            } else if (sortBy === 'name-desc') {
                result.sort((a, b) => (b.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
            } else if (sortBy === 'newest') {
                result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            } else if (sortBy === 'oldest') {
                result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            }
        }
        return result;
    }, [mentors, sortBy, searchTerm, selectedCategory, filterExperience, showTopMentorsOnly]);

    const topServices = useMemo(() => {
        const counts = {};
        mentors.forEach(pro => {
            if (pro.services && Array.isArray(pro.services)) {
                pro.services.forEach(srv => {
                    if (srv && srv.title) {
                        const title = srv.title.trim();
                        counts[title] = (counts[title] || 0) + 1;
                    }
                });
            }
        });

        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([title]) => {
                let icon = '💼';
                const lower = title.toLowerCase();
                if (lower.includes('resume') || lower.includes('cv') || lower.includes('profile')) icon = '📄';
                else if (lower.includes('interview') || lower.includes('mock') || lower.includes('prep') || lower.includes('coding')) icon = '👨‍💻';
                else if (lower.includes('career') || lower.includes('guidance') || lower.includes('path')) icon = '💼';
                else if (lower.includes('branding') || lower.includes('personal') || lower.includes('linkedin') || lower.includes('portfolio') || lower.includes('brand')) icon = '✨';
                else if (lower.includes('mentorship') || lower.includes('1:1') || lower.includes('one-on-one') || lower.includes('mentor')) icon = '🤝';
                else if (lower.includes('system design') || lower.includes('architecture')) icon = '🏗️';
                else if (lower.includes('query') || lower.includes('sql') || lower.includes('database')) icon = '🗄️';
                else if (lower.includes('referral') || lower.includes('job')) icon = '✉️';

                return { icon, label: title };
            });

        if (sorted.length === 0) {
            return [
                { icon: '📄', label: 'Resume Review' },
                { icon: '👨‍💻', label: 'Interview Preparation' },
                { icon: '💼', label: 'Career Guidance' },
                { icon: '✨', label: 'Personal Branding' },
                { icon: '🤝', label: '1:1 Mentorship' }
            ];
        }
        return sorted;
    }, [mentors]);

    const filtersRowRef = useRef(null);
    const [canScrollLeftFilters, setCanScrollLeftFilters] = useState(false);
    const [canScrollRightFilters, setCanScrollRightFilters] = useState(false);

    const checkFiltersScroll = () => {
        if (filtersRowRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = filtersRowRef.current;
            setCanScrollLeftFilters(scrollLeft > 1);
            setCanScrollRightFilters(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        // Initial check and set up listeners
        setTimeout(checkFiltersScroll, 100);
        window.addEventListener('resize', checkFiltersScroll);
        return () => window.removeEventListener('resize', checkFiltersScroll);
    }, [filteredAndSortedMentors]); // Also re-check if mentors list changes

    const scrollFilters = (direction) => {
        if (filtersRowRef.current) {
            const scrollAmount = direction === 'left' ? -150 : 150;
            filtersRowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const categoriesRowRef = useRef(null);
    const [canScrollLeftCats, setCanScrollLeftCats] = useState(false);
    const [canScrollRightCats, setCanScrollRightCats] = useState(false);

    const checkCategoriesScroll = () => {
        if (categoriesRowRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = categoriesRowRef.current;
            setCanScrollLeftCats(scrollLeft > 1);
            setCanScrollRightCats(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        setTimeout(checkCategoriesScroll, 100);
        window.addEventListener('resize', checkCategoriesScroll);
        return () => window.removeEventListener('resize', checkCategoriesScroll);
    }, []);

    const scrollCategories = (direction) => {
        if (categoriesRowRef.current) {
            const scrollAmount = direction === 'left' ? -180 : 180;
            categoriesRowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const activeFiltersCount = (filterExperience !== 'all' ? 1 : 0);

    return (
        <div className="aml-container">
            <div className="aml-header" style={{ marginBottom: '1.5rem', marginTop: '-1rem' }}>
                <button className="aml-back-btn" onClick={onBack}>
                    ←
                </button>
                <div className="aml-title" style={{ fontSize: '2.2rem' }}>Explore <span style={{ color: '#0ea5e9' }}>Mentors</span></div>
            </div>

            {/* Categories Row */}
            <div className="aml-categories-wrapper">
                {canScrollLeftCats && (
                    <button className="aml-filters-scroll-btn left" style={{ zIndex: 10 }} onClick={() => scrollCategories('left')}>❮</button>
                )}
                <div className="aml-categories-row" ref={categoriesRowRef} onScroll={checkCategoriesScroll}>
                    {topServices.map((cat, i) => (
                        <div 
                            className={`aml-category-card ${selectedCategory === cat.label ? 'active' : ''}`} 
                            key={i}
                            onClick={() => setSelectedCategory(selectedCategory === cat.label ? null : cat.label)}
                        >
                            <div className="aml-cat-icon">{cat.icon}</div>
                            <div className="aml-cat-label">{cat.label}</div>
                        </div>
                    ))}
                </div>
                {canScrollRightCats && (
                    <button className="aml-filters-scroll-btn right" style={{ zIndex: 10 }} onClick={() => scrollCategories('right')}>❯</button>
                )}
            </div>

            {/* Filters Row */}
            <div className="aml-filters-wrapper">
                {canScrollLeftFilters && (
                    <button className="aml-filters-scroll-btn left" onClick={() => scrollFilters('left')}>❮</button>
                )}
                <div className="aml-filters-row" ref={filtersRowRef} onScroll={checkFiltersScroll}>
                    {/* Search First */}
                    <div className="aml-search-box aml-search-box-mobile-first">
                        <span className="aml-search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search Mentors" 
                            className="aml-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="aml-filters-left">
                        <button 
                            className={`aml-filter-btn ${showFiltersPanel || activeFiltersCount > 0 ? 'aml-filter-active' : ''}`}
                            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                        >
                            <span style={{ fontSize: '1.1rem' }}>▤</span> Filters
                            {activeFiltersCount > 0 && <span className="aml-filter-badge">{activeFiltersCount}</span>}
                        </button>

                        <div className="aml-dropdown-container" ref={sortMenuRef}>
                            <button 
                                className={`aml-filter-btn ${showSortMenu ? 'aml-filter-active' : ''}`} 
                                onClick={() => setShowSortMenu(!showSortMenu)}
                            >
                                <span style={{ fontSize: '1.1rem' }}>⇕</span> Sort By
                            </button>
                            {showSortMenu && (
                                <>
                                    <div className="aml-dropdown-backdrop" onClick={() => setShowSortMenu(false)}></div>
                                    <div className="aml-dropdown-menu">
                                        <div 
                                            className={`aml-dropdown-item ${sortBy === 'bookings' ? 'active' : ''}`} 
                                            onClick={() => { setSortBy('bookings'); setShowSortMenu(false); }}
                                        >
                                            Most Booked
                                        </div>
                                        <div 
                                            className={`aml-dropdown-item ${sortBy === 'newest' ? 'active' : ''}`} 
                                            onClick={() => { setSortBy('newest'); setShowSortMenu(false); }}
                                        >
                                            Newest First
                                        </div>
                                        <div 
                                            className={`aml-dropdown-item ${sortBy === 'oldest' ? 'active' : ''}`} 
                                            onClick={() => { setSortBy('oldest'); setShowSortMenu(false); }}
                                        >
                                            Oldest First
                                        </div>
                                        <div 
                                            className={`aml-dropdown-item ${sortBy === 'name-asc' ? 'active' : ''}`} 
                                            onClick={() => { setSortBy('name-asc'); setShowSortMenu(false); }}
                                        >
                                            Alphabetical (A-Z)
                                        </div>
                                        <div 
                                            className={`aml-dropdown-item ${sortBy === 'name-desc' ? 'active' : ''}`} 
                                            onClick={() => { setSortBy('name-desc'); setShowSortMenu(false); }}
                                        >
                                            Alphabetical (Z-A)
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button 
                            className={`aml-filter-btn ${showTopMentorsOnly ? 'aml-filter-active' : ''}`}
                            onClick={() => setShowTopMentorsOnly(!showTopMentorsOnly)}
                        >
                            👑 Top Mentors
                        </button>
                    </div>
                </div>
                {canScrollRightFilters && (
                    <button className="aml-filters-scroll-btn right" onClick={() => scrollFilters('right')}>❯</button>
                )}
            </div>

            {/* Collapsible Filters Panel */}
            {showFiltersPanel && (
                <div className="aml-filters-panel">
                    <div className="aml-filter-group">
                        <label className="aml-filter-label">Experience Level</label>
                        <div className="aml-filter-options">
                            {['all', '1', '3', '5', '8'].map(exp => (
                                <button 
                                    key={exp}
                                    className={`aml-filter-pill ${filterExperience === exp ? 'active' : ''}`}
                                    onClick={() => setFilterExperience(exp)}
                                >
                                    {exp === 'all' ? 'Any Exp' : `${exp}+ Years`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="aml-list">
                {filteredAndSortedMentors.map((pro, idx) => (
                    <div className="aml-card" key={pro.id || idx} style={{ cursor: 'pointer' }} onClick={(e) => {
                        if (!e.target.closest('.aml-services-row') && !e.target.closest('.tm-social-icon')) {
                            onSelectPro(pro);
                        }
                    }}>
                        {/* Banner for mobile view */}
                        <div className="aml-card-banner" style={{ 
                            background: pro.headerBg?.includes('gradient') ? pro.headerBg : 
                                       (pro.headerBg?.startsWith('http') || pro.headerBg?.startsWith('data:image')) ? `url(${pro.headerBg}) center/cover no-repeat` : 
                                       pro.headerBg || '#fbcfe8'
                        }}></div>

                        <div className="aml-card-top">
                            {/* Avatar Left */}
                            <div className="aml-avatar-col">
                                {pro.image ? (
                                    <img src={pro.image} alt={pro.name} className="aml-avatar" />
                                ) : (
                                    <div className="aml-avatar-fallback" style={{ backgroundColor: pro.avatarBg || '#1e293b' }}>
                                        {pro.initials}
                                    </div>
                                )}
                            </div>

                            {/* Info Right */}
                            <div className="aml-info-col">
                                <div className="aml-name-row">
                                    <div className="aml-name">{pro.name}</div>
                                </div>

                                <div className="aml-rating">
                                    ⭐ {pro.rating}
                                </div>

                                <div className="aml-socials-mobile">
                                    <div className="aml-rating-bubble">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#eab308' }}>
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        {pro.rating}
                                    </div>
                                    <div className="aml-social-icons-row">
                                        {pro.email && (
                                            <a href={`mailto:${pro.email}`} className="aml-social-icon" title="Email" onClick={(e) => e.stopPropagation()}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                            </a>
                                        )}
                                        {pro.linkedin && (
                                            <a href={pro.linkedin} target="_blank" rel="noopener noreferrer" className="aml-social-icon" title="LinkedIn" onClick={(e) => e.stopPropagation()}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                                            </a>
                                        )}
                                        <div className="aml-social-icon" onClick={(e) => {
                                            e.stopPropagation();
                                            if (navigator.share) {
                                                navigator.share({ title: pro.name, text: pro.role, url: window.location.href }).catch(() => {});
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert('Link copied!');
                                            }
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="aml-role-desc">
                                    {pro.role} @ {pro.company} | {(() => {
                                        let expValue = pro.exp || '1';
                                        // If it's already a full descriptive string, just fix the 1 years case
                                        if (expValue.toString().toLowerCase().includes('experience') || expValue.toString().toLowerCase().includes('exp')) {
                                            return expValue.toString().replace(/1 Years/g, '1 Year');
                                        }
                                        // Otherwise, treat as a number (e.g. "2" or "2 Year") and format it
                                        const num = parseInt(expValue);
                                        if (isNaN(num)) return expValue;
                                        return `${num} ${num === 1 ? 'Year' : 'Years'} of experience`;
                                    })()} | {pro.topics ? pro.topics.substring(0, 150) : (pro.skills ? pro.skills.substring(0, 150) : 'No expertise added yet')}
                                </div>

                                <div className="aml-stats-row">
                                    <div className="aml-stat-item">
                                        💼 <span>{pro.exp || "1 Year"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Services List Bottom */}
                        <div className="aml-services-row">
                            {pro.services && pro.services.slice(0, 2).map((srv, i) => (
                                <div 
                                    className="aml-service-card" 
                                    key={i}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => onSelectPro({ ...pro, initialHighlightService: srv.title })}
                                >
                                    <div>
                                        <div className="aml-service-tag">
                                            {srv.tag === 'Best Seller' ? '🌟' : '🎁'} {srv.tag || 'Resource'}
                                        </div>
                                        <div className="aml-service-title">{srv.title}</div>
                                    </div>
                                    <div className="aml-service-pricing">
                                        {srv.price === 'Free' ? (
                                            <span className="aml-old-price">₹499</span>
                                        ) : (
                                            <span className="aml-old-price">₹{parseInt(srv.price?.toString().replace('₹', '') || 499) + 200}</span>
                                        )}
                                        <span className={`aml-new-price ${srv.price === 'Free' ? 'free-badge' : ''}`}>{srv.price}</span>
                                    </div>
                                </div>
                            ))}
                            {pro.services && pro.services.length > 2 && (
                                <button className="aml-view-all-services" onClick={() => onSelectPro(pro)}>
                                    View All
                                </button>
                            )}
                            <button className="aml-view-all-services" style={{ borderColor: '#0ea5e9', color: '#0ea5e9' }} onClick={() => onSelectPro(pro)}>
                                View Details
                            </button>
                        </div>
                        <button className="aml-mobile-view-btn" onClick={() => onSelectPro(pro)}>View Profile</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AllMentorsList;
