import React, { useState, useMemo, useEffect, useRef } from 'react';
import './AllMentorsList.css';

function AllMentorsList({ mentors, onBack, onSelectPro }) {
    const [sortBy, setSortBy] = useState('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);
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

    const sortedMentors = useMemo(() => {
        let result = [...mentors];
        if (sortBy === 'name-asc') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'name-desc') {
            result.sort((a, b) => b.name.localeCompare(a.name));
        } else if (sortBy === 'newest') {
            // Prefer id if available, otherwise createdAt
            result.sort((a, b) => (b.id || 0) - (a.id || 0));
        } else if (sortBy === 'oldest') {
            result.sort((a, b) => (a.id || 0) - (b.id || 0));
        }
        return result;
    }, [mentors, sortBy]);
    return (
        <div className="aml-container">
            <div className="aml-header" style={{ marginBottom: '1.5rem', marginTop: '-1rem' }}>
                <button className="aml-back-btn" onClick={onBack}>
                    ←
                </button>
                <div className="aml-title" style={{ fontSize: '2.2rem' }}>Explore <span style={{ color: '#0ea5e9' }}>Mentors</span></div>
            </div>

            {/* Categories Row */}
            <div className="aml-categories-row">
                {[
                    { icon: '📄', label: 'CV Review' },
                    { icon: '👨‍💻', label: 'Interview Preparation' },
                    { icon: '💼', label: 'Career Guidance' },
                    { icon: '✨', label: 'Personal Branding' }
                ].map((cat, i) => (
                    <div className="aml-category-card" key={i}>
                        <div className="aml-cat-icon">{cat.icon}</div>
                        <div className="aml-cat-label">{cat.label}</div>
                    </div>
                ))}
                <button className="aml-cat-next">❯</button>
            </div>

            {/* Filters Row */}
            <div className="aml-filters-row">
                <div className="aml-filters-left">
                    <button className="aml-filter-btn">
                        <span style={{ fontSize: '1.1rem' }}>▤</span> Filters <span className="aml-filter-badge">1</span>
                    </button>
                    <button className="aml-filter-btn aml-filter-active">
                        Top Mentor
                    </button>
                    <div className="aml-dropdown-container" ref={sortMenuRef}>
                        <button 
                            className={`aml-filter-btn ${showSortMenu ? 'aml-filter-active' : ''}`} 
                            onClick={() => setShowSortMenu(!showSortMenu)}
                        >
                            <span style={{ fontSize: '1.1rem' }}>⇕</span> Sort By
                        </button>
                        {showSortMenu && (
                            <div className="aml-dropdown-menu">
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
                        )}
                    </div>
                </div>
                <div className="aml-filters-right">
                    <div className="aml-featured-pill">
                        Featured
                    </div>
                </div>
            </div>

            <div className="aml-list">
                {sortedMentors.map((pro, idx) => (
                    <div className="aml-card" key={pro.id || idx} style={{ cursor: 'pointer' }} onClick={(e) => {
                        if (!e.target.closest('.aml-services-row')) {
                            onSelectPro(pro);
                        }
                    }}>
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
                                    {/* Company logo mock, fallback to initial block */}
                                    <div className="aml-company-logo-fallback">
                                        {pro.name.charAt(0)}
                                    </div>
                                </div>

                                <div className="aml-rating">
                                    ⭐ {pro.rating}
                                </div>

                                <div className="aml-role-desc">
                                    {pro.role} @ {pro.company} | {pro.topics ? pro.topics.substring(0, 150) : 'No expertise added yet'}
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
                                <div className="aml-service-card" key={i}>
                                    <div>
                                        <div className="aml-service-tag">
                                            {srv.tag === 'Best Seller' ? '🌟' : '🎁'} {srv.tag || 'Resource'}
                                        </div>
                                        <div className="aml-service-title">{srv.title}</div>
                                    </div>
                                    <div className="aml-service-pricing">
                                        <span className="aml-old-price">₹{parseInt(srv.price?.replace('₹', '') || 499) + 200}</span>
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
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AllMentorsList;
