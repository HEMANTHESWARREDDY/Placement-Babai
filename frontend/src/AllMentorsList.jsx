import React, { useState, useMemo } from 'react';
import './AllMentorsList.css';

function AllMentorsList({ mentors, onBack, onSelectPro }) {
    const [sortBy, setSortBy] = useState('newest');

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
                    <select 
                        className="aml-filter-btn" 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '2.5rem', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8rem center' }}
                    >
                        <option value="newest">New to Old</option>
                        <option value="oldest">Old to New</option>
                        <option value="name-asc">Alphabetical (A-Z)</option>
                        <option value="name-desc">Alphabetical (Z-A)</option>
                    </select>
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
