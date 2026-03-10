import React from 'react';
import './AllMentorsList.css';

function AllMentorsList({ mentors, onBack, onSelectPro }) {
    return (
        <div className="aml-container">
            <div className="aml-header">
                <button className="aml-back-btn" onClick={onBack}>
                    ←
                </button>
                <div className="aml-title">All Mentors</div>
            </div>

            <div className="aml-list">
                {mentors.map((pro, idx) => (
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
                                <div className="aml-trophy">🏆</div>
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
                                    ⭐ {pro.rating} <span>({pro.reviews} Reviews)</span>
                                </div>

                                <div className="aml-role-desc">
                                    {pro.role} | {pro.about ? pro.about.substring(0, 100) + '...' : ''}
                                </div>

                                <div className="aml-stats-row">
                                    <div className="aml-stat-item">
                                        💼 <span>{pro.exp || "1 Year"}</span>
                                    </div>
                                    <div className="aml-stat-divider"></div>
                                    <div className="aml-stat-item">
                                        💬 <span>{pro.sessions || "1,917"} Sessions</span>
                                    </div>
                                    <div className="aml-stat-divider"></div>
                                    <div className="aml-stat-item">
                                        📅 <span>{pro.attendance || "96%"} Avg. Attendance</span>
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
                                        <span className="aml-old-price">₹{parseInt(srv.price.replace('₹', '')) + 200 || 499}</span>
                                        <span className={`aml-new-price ${srv.price === 'Free' ? 'free-badge' : ''}`}>{srv.price}</span>
                                    </div>
                                </div>
                            ))}
                            <button className="aml-view-all-services">
                                View All
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AllMentorsList;
