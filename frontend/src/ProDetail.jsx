import React, { useState, useEffect } from 'react';
import './ProDetail.css';

function ProDetail({ pro, onClose }) {
    const [activeTab, setActiveTab] = useState('All');
    const [expandedSections, setExpandedSections] = useState({
        About: true,
        Topics: false,
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

    const tabs = ['All', '1:1 Call', 'Resume Review'];

    const renderServices = () => {
        const filteredServices = pro.services.filter(s => activeTab === 'All' || s.type === activeTab);
        return filteredServices.map((service, idx) => (
            <div className="pd-service-card" key={idx}>
                <div className={`pd-service-tag ${service.tag === 'Best Seller' ? 'pd-tag-bestseller' : 'pd-tag-resource'}`}>
                    {service.tag === 'Best Seller' ? '🌟' : '🎁'} {service.tag}
                </div>
                <div className="pd-service-title">{service.title}</div>
                <div className="pd-service-footer">
                    <span className="pd-service-price">{service.price}</span>
                    <button className="pd-book-btn">Book Now</button>
                </div>
            </div>
        ));
    };

    return (
        <div className="pd-overlay" onClick={onClose}>
            <div className="pd-modal-unified" onClick={e => e.stopPropagation()}>

                {/* Banner Section */}
                <div className="pd-banner" style={{ 
                    background: pro.headerBg?.includes('gradient') ? pro.headerBg : (pro.headerBg ? `url(${pro.headerBg}) center/cover no-repeat` : '#cbd5e1'),
                    backgroundColor: (!pro.headerBg || (!pro.headerBg.includes('gradient') && !pro.headerBg.startsWith('http') && !pro.headerBg.startsWith('data:'))) ? pro.headerBg : 'transparent'
                }}>
                    <button className="pd-close-btn-unified" onClick={onClose}>✕</button>
                </div>

                {/* Profile Header Info */}
                <div className="pd-profile-section">
                    <div className="pd-avatar-container">
                        <div className="pd-avatar" style={{ backgroundColor: pro.avatarBg || '#1e293b' }}>
                            {pro.image ? <img src={pro.image} alt={pro.name} /> : pro.initials}
                        </div>
                        <div className="pd-available-badge">⚡ Available</div>
                    </div>

                    <div className="pd-info-row">
                        <div className="pd-info-main">
                            <h2>{pro.name} <span className="pd-rating">⭐ {pro.rating}</span></h2>
                            <p className="pd-headline">{pro.role} {pro.company ? `@ ${pro.company}` : ''}</p>
                            <div className="pd-exp-row">
                                <span>💼 {pro.exp || '1 Year'}</span>
                            </div>
                        </div>
                        <div className="pd-social-links">
                            {pro.email && (
                                <a href={`mailto:${pro.email}`} className="pd-social-btn" title="Email">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </a>
                            )}
                            {pro.linkedin && (
                                <a href={pro.linkedin} target="_blank" rel="noopener noreferrer" className="pd-social-btn" title="LinkedIn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                                </a>
                            )}
                            <div className="pd-social-btn" title="Share" style={{ cursor: 'pointer' }} onClick={() => {
                                if (navigator.share) {
                                    navigator.share({ title: pro.name, text: pro.role, url: window.location.href }).catch(() => {});
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Link copied to clipboard!');
                                }
                            }}>
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pd-divider"></div>

                {/* Main Split Layout */}
                <div className="pd-content-split">

                    {/* Left: Accordions */}
                    <div className="pd-details-col">
                        <h3 className="pd-section-title">👤 About Mentor</h3>

                        {/* About */}
                        <div className="pd-accordion-item">
                            <button className="pd-accordion-header" onClick={() => toggleSection('About')}>
                                <span>About</span>
                                <svg className={`pd-chevron ${expandedSections.About ? 'pd-chevron-up' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            {expandedSections.About && (
                                <div className="pd-accordion-content" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                    {pro.about || "No about added yet."}
                                </div>
                            )}
                        </div>

                        {/* Topics of Expertise */}
                        <div className="pd-accordion-item">
                            <button className="pd-accordion-header" onClick={() => toggleSection('Topics')}>
                                <span>Topics of Expertise</span>
                                <svg className={`pd-chevron ${expandedSections.Topics ? 'pd-chevron-up' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            {expandedSections.Topics && (
                                <div className="pd-accordion-content" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                    {pro.topics || "No topics added yet."}
                                </div>
                            )}
                        </div>

                        {/* Education */}
                        <div className="pd-accordion-item">
                            <button className="pd-accordion-header" onClick={() => toggleSection('Education')}>
                                <span>Education</span>
                                <svg className={`pd-chevron ${expandedSections.Education ? 'pd-chevron-up' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            {expandedSections.Education && (
                                <div className="pd-accordion-content" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                    {pro.education || "No education added yet."}
                                </div>
                            )}
                        </div>

                        {/* Work Experience */}
                        <div className="pd-accordion-item">
                            <button className="pd-accordion-header" onClick={() => toggleSection('WorkExperience')}>
                                <span>Work Experience</span>
                                <svg className={`pd-chevron ${expandedSections.WorkExperience ? 'pd-chevron-up' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            {expandedSections.WorkExperience && (
                                <div className="pd-accordion-content" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                    {pro.workExperience || "No work experience added yet."}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Services */}
                    <div className="pd-services-col">
                        <h3 className="pd-section-title">📅 Available Services</h3>

                        <div className="pd-tabs">
                            {tabs.map(tab => (
                                <div
                                    key={tab}
                                    className={`pd-tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </div>
                            ))}
                        </div>

                        <div className="pd-services-list">
                            {renderServices().length > 0 ? renderServices() : (
                                <div className="pd-no-services">No services available.</div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default ProDetail;
