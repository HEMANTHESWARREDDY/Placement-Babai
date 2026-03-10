import React, { useState, useEffect } from 'react';
import './ProDetail.css';

function ProDetail({ pro, onClose }) {
    const [activeTab, setActiveTab] = useState('All');
    const [expandedSections, setExpandedSections] = useState({
        About: true,
        Topics: false,
        Skills: false,
        FluentIn: false,
        Education: false,
        WorkExperience: false
    });

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const tabs = ['All', '1:1 Call', 'Query'];

    const renderServices = () => {
        const filteredServices = pro.services.filter(s => activeTab === 'All' || s.type === activeTab);
        return filteredServices.map((service, idx) => (
            <div className="pd-service-card" key={idx}>
                <div className="pd-service-tags">
                    {service.tag && <span className={`pd-service-tag pd-tag-${service.tag.replace(/\s+/g, '').toLowerCase()}`}>{service.tag === 'Best Seller' ? '✨' : '🎁'} {service.tag}</span>}
                </div>
                <h4 className="pd-service-title">{service.title}</h4>
                <div className="pd-service-footer">
                    <span className="pd-service-price">{service.price}</span>
                    <button className="pd-service-btn">Book Now</button>
                </div>
            </div>
        ));
    };

    return (
        <div className="pd-overlay" onClick={onClose}>
            <div className="pd-modal-container" onClick={e => e.stopPropagation()}>
                <button className="pd-close-btn" onClick={onClose}>✕</button>

                <div className="pd-content">
                    {/* Left Column: Profile Info */}
                    <div className="pd-left-col">
                        <div className="pd-profile-card">
                            <div className="pd-profile-header-bg" style={{ background: pro.headerBg || pro.color }}></div>
                            <div className="pd-profile-avatar-wrapper">
                                <div className="pd-profile-avatar" style={{ backgroundColor: pro.avatarBg || '#1e293b' }}>
                                    {pro.image ? <img src={pro.image} alt={pro.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : pro.initials}
                                </div>
                                <span className="pd-available-badge">⚡ Available</span>
                            </div>

                            <div className="pd-profile-info">
                                <h2 className="pd-profile-name">{pro.name} <span className="pd-profile-rating">⭐ {pro.rating}</span></h2>
                                <p className="pd-profile-headline">{pro.role}</p>

                                <div className="pd-profile-exp">
                                    <span className="pd-icon">💼</span> {pro.exp} of Experience
                                </div>

                                <div className="pd-social-links">
                                    <button className="pd-social-btn pd-insta">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                    </button>
                                    <button className="pd-social-btn pd-linkedin">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                                    </button>
                                    <button className="pd-social-btn pd-share">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="pd-accordion-container">
                                {Object.keys(expandedSections).map(sectionKey => {
                                    const sectionTitle = sectionKey.replace(/([A-Z])/g, ' $1').trim();
                                    const dataKey = sectionKey.charAt(0).toLowerCase() + sectionKey.slice(1);
                                    const content = pro[dataKey];

                                    if (!content || (Array.isArray(content) && content.length === 0)) return null;

                                    return (
                                        <div className="pd-accordion-item" key={sectionKey}>
                                            <button className="pd-accordion-header" onClick={() => toggleSection(sectionKey)}>
                                                <span>{sectionTitle}</span>
                                                <svg className={`pd-chevron ${expandedSections[sectionKey] ? 'pd-chevron-up' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </button>

                                            {expandedSections[sectionKey] && (
                                                <div className="pd-accordion-content">
                                                    {typeof content === 'string' ? (
                                                        <p>{content}</p>
                                                    ) : (
                                                        <ul>
                                                            {content.map((item, idx) => (
                                                                <li key={idx}>• {item}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Services */}
                    <div className="pd-right-col">
                        <div className="pd-services-container">
                            <h3 className="pd-services-header">Available Services</h3>
                            <p className="pd-services-sub">Discover our mentorship offerings curated for you.</p>

                            <div className="pd-service-tabs">
                                {tabs.map(tab => (
                                    <button
                                        key={tab}
                                        className={`pd-tab-btn ${activeTab === tab ? 'pd-tab-active' : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="pd-services-list">
                                {renderServices().length > 0 ? renderServices() : (
                                    <div className="pd-no-services">No services available in this category.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProDetail;
