import React, { useState, useEffect } from 'react';
import './ProDetail.css';
import BookingModal from './BookingModal';


function ProDetail({ pro, onClose }) {
    const [mainTab, setMainTab] = useState('Services');
    const [lightbox, setLightbox] = useState(null);
    const [serviceSearch, setServiceSearch] = useState('');
    const [serviceSort, setServiceSort] = useState('A-Z');
    const [activeTab, setActiveTab] = useState('All');

    const [expandedSections, setExpandedSections] = useState({
        about: true,
        topics: false,
        education: false,
        work: false
    });

    const [bookingData, setBookingData] = useState(null); // {pro, service}

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const avatarBgColor = pro.avatarBg || '#1e293b';
    const initials = pro.name ? pro.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'M';

    return (
        <div className="preview-modal-overlay" onClick={onClose}>
            <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="preview-modal-close" onClick={onClose}>X</button>
                <div className="preview-modal-scroll">
                    <div className="mentor-preview" style={{ width: '100%', margin: '0', boxShadow: 'none', borderRadius: '0' }}>
                        <div className="preview-header" 
                            style={{ 
                                background: pro.headerBg?.includes('gradient') ? pro.headerBg : 
                                           (pro.headerBg?.startsWith('http') || pro.headerBg?.startsWith('data:image')) ? `url(${pro.headerBg}) center/cover no-repeat` : 
                                           pro.headerBg || '#fbcfe8'
                            }}
                        >
                        </div>
                        <div className="preview-body">
                            <div className="preview-top-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                                <div className="preview-avatar-wrapper" style={{ marginBottom: 0 }}>
                                    <div className="preview-avatar" 
                                        style={{
                                            background: pro.image ? `url(${pro.image}) center/cover` : avatarBgColor
                                        }}
                                    >
                                        {!pro.image && initials}
                                    </div>
                                    {pro.isAvailable !== false && <div className="availability-badge">⚡ Available</div>}
                                </div>
                                <div className="preview-header-meta" style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px',
                                    paddingBottom: '10px'
                                }}>
                                    <span className="preview-rating" style={{ 
                                        background: 'white', 
                                        padding: '0 12px', 
                                        borderRadius: '20px', 
                                        border: '1px solid #e2e8f0',
                                        height: '36px',
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        color: '#eab308',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        ⭐ {pro.rating || '4.8'}
                                    </span>
                                    <div className="preview-socials" style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
                                        {pro.email && <a href={`mailto:${pro.email}`} className="preview-social-icon-raw">✉️</a>}
                                        {pro.linkedin && <a href={pro.linkedin} target="_blank" rel="noopener noreferrer" className="preview-social-icon-raw">in</a>}
                                        <div className="preview-social-icon-raw pointer" title="Share" style={{ color: '#475569' }} onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({ title: pro.name, text: pro.role, url: window.location.href }).catch(() => {});
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert('Link copied to clipboard!');
                                            }
                                        }}>
                                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>





                            <div className="preview-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '2rem', flex: 1 }}>{pro.name}</h3>
                            </div>

                            <div className="preview-subtitle" style={{color: '#475569', marginBottom: '1rem', fontSize: '1rem'}}>
                                {pro.role} {pro.company ? `@ ${pro.company}` : ''} {pro.topics ? `| ${pro.topics}` : ''}
                            </div>

                            <div className="preview-badges">
                                <div className="preview-badge" style={{background: '#f1f5f9', color: '#334155', border: 'none'}}>💼 {pro.exp || '1 year of Experience'}</div>
                            </div>

                            {/* Main Tabs */}
                            <div className="main-tabs-container">
                                <button 
                                    className={`main-tab-btn ${mainTab === 'About' ? 'active' : ''}`}
                                    onClick={() => setMainTab('About')}
                                >
                                    👤 About Mentor
                                </button>
                                <button 
                                    className={`main-tab-btn ${mainTab === 'Services' ? 'active' : ''}`}
                                    onClick={() => setMainTab('Services')}
                                >
                                    📅 Available Services
                                </button>
                            </div>

                            <div className="preview-content-grid">
                                <div className={`preview-section-left ${mainTab === 'About' ? 'tab-visible' : 'tab-hidden'}`}>
                                    <h4>👤 About Mentor</h4>
                                    <div className="about-content-tab">
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header" onClick={() => toggleSection('about')} style={{cursor: 'pointer'}}>
                                                About <span>{expandedSections.about ? '^' : 'v'}</span>
                                            </div>
                                            {expandedSections.about && (
                                                <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                                    {pro.about || pro.bio || "No about added yet."}
                                                </div>
                                            )}
                                        </div>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header" onClick={() => toggleSection('topics')} style={{cursor: 'pointer'}}>
                                                Topics of Expertise <span>{expandedSections.topics ? '^' : 'v'}</span>
                                            </div>
                                            {expandedSections.topics && (
                                                <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                                    {pro.topics || "No topics added yet."}
                                                </div>
                                            )}
                                        </div>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header" onClick={() => toggleSection('education')} style={{cursor: 'pointer'}}>
                                                Education <span>{expandedSections.education ? '^' : 'v'}</span>
                                            </div>
                                            {expandedSections.education && (
                                                <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                                    {pro.education || "No education added yet."}
                                                </div>
                                            )}
                                        </div>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header" onClick={() => toggleSection('work')} style={{cursor: 'pointer'}}>
                                                Work Experience <span>{expandedSections.work ? '^' : 'v'}</span>
                                            </div>
                                            {expandedSections.work && (
                                                <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                                    {pro.workExperience || "No work experience added yet."}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={`preview-section-right ${mainTab === 'Services' ? 'tab-visible' : 'tab-hidden'}`}>
                                    <h4>📅 Available Services</h4>
                                    <div className="services-content-tab">
                                        <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                            <div style={{display: 'flex', background: '#e2e8f0', borderRadius: '12px', padding: '0.4rem', marginBottom: '1.5rem', flexWrap: 'nowrap', gap: '8px', alignItems: 'center'}}>
                                                {/* Left-aligned Tab(s) */}
                                                <div className="service-filter-tabs" style={{ display: 'flex', gap: '4px' }}>
                                                    {['All', 'Free', 'Paid'].map(tab => (
                                                        <button
                                                            key={tab}
                                                            onClick={() => setActiveTab(tab)}
                                                            style={{
                                                                padding: '0.4rem 1.1rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                fontSize: '0.82rem',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                background: activeTab === tab ? 'white' : 'transparent',
                                                                color: activeTab === tab ? '#1e293b' : '#64748b',
                                                                boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                                            }}
                                                        >
                                                            {tab}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{ flex: 1 }}></div>

                                                {/* Right-aligned Group */}
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                                    <div style={{ position: 'relative', width: '170px' }}>
                                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>🔍</span>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Search services..." 
                                                            value={serviceSearch}
                                                            onChange={(e) => setServiceSearch(e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                boxSizing: 'border-box',
                                                                padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                                                                borderRadius: '10px',
                                                                border: '1px solid #cbd5e1',
                                                                background: 'white',
                                                                fontSize: '0.85rem',
                                                                outline: 'none',
                                                                color: '#1e293b'
                                                            }}
                                                        />
                                                    </div>

                                                    <div style={{ position: 'relative' }}>
                                                        <select 
                                                            value={serviceSort}
                                                            onChange={(e) => setServiceSort(e.target.value)}
                                                            style={{
                                                                padding: '0.5rem 1.4rem 0.5rem 0.8rem',
                                                                borderRadius: '10px',
                                                                border: '1px solid #cbd5e1',
                                                                background: 'white',
                                                                fontSize: '0.85rem',
                                                                color: '#475569',
                                                                outline: 'none',
                                                                appearance: 'none',
                                                                fontWeight: '600',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <option value="A-Z">A-Z</option>
                                                            <option value="Z-A">Z-A</option>
                                                            <option value="Newest">Newest</option>
                                                        </select>
                                                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: '#94a3b8' }}>▼</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dynamic Services Mapping */}
                                            <div className="pd-services-scroll" style={{ maxHeight: '310px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px' }}>
                                                {(() => {
                                                    let servicesToRender = [...(pro.services || [])];
                                                    
                                                    // Emergency Fallback inside component
                                                    if (servicesToRender.length === 0) {
                                                        servicesToRender = [
                                                            { keywords: '1:1 Mentorship, Career Guidance, Mock Interview', title: '1:1 Mentorship', price: 'Free', tag: '✨ Popular' },
                                                            { keywords: 'Resume Review, ATS Optimization, Profile Evaluation', title: 'Resume Review', price: 'Free', tag: '⭐ Best Seller' }
                                                        ];
                                                    }

                                                    const filtered = servicesToRender.filter(s => {
                                                        const matchesSearch = !serviceSearch.trim() || 
                                                            (s.title || '').toLowerCase().includes(serviceSearch.toLowerCase()) || 
                                                            (s.keywords || '').toLowerCase().includes(serviceSearch.toLowerCase());
                                                        
                                                        const isFree = (s.price === 'Free' || s.price === 0 || s.price === '0' || !s.price);
                                                        const matchesTab = activeTab === 'All' || (activeTab === 'Free' && isFree) || (activeTab === 'Paid' && !isFree);
                                                        
                                                        return matchesSearch && matchesTab;
                                                    }).sort((a, b) => {
                                                        if (serviceSort === 'A-Z') return (a.title || '').localeCompare(b.title || '');
                                                        if (serviceSort === 'Z-A') return (b.title || '').localeCompare(a.title || b.title || '');
                                                        return 0;
                                                    });

                                                    if (filtered.length === 0) {
                                                        return (
                                                            <div style={{textAlign: 'center', padding: '2rem', color: '#64748b', fontStyle: 'italic'}}>
                                                                No matching services found.
                                                            </div>
                                                        );
                                                    }

                                                    return filtered.map((service, index) => (
                                                        <div className="preview-service-card" key={index} style={{ marginBottom: '1rem' }}>
                                                            {service.tag && (
                                                                <div className="preview-service-tag" style={service.tag.toLowerCase().includes('feedback') ? {background: '#e0e7ff', color: '#4338ca'} : {}}>
                                                                    {service.tag}
                                                                </div>
                                                            )}
                                                            <div className="preview-service-title">{service.title || 'Untitled Service'}</div>
                                                            {service.keywords && (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                                                    {service.keywords.split(',').map((k, i) => (
                                                                        <span key={i} style={{ fontSize: '0.65rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                                                                            #{k.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="preview-service-footer">
                                                                <div className="preview-service-price">{service.price === 'Free' ? 'Free' : (service.price && !service.price.toString().startsWith('₹') ? `₹${service.price}` : service.price || '₹0')}</div>
                                                                <button 
                                                                    className="preview-book-btn"
                                                                    onClick={() => setBookingData({ pro, service })}
                                                                    style={{}}
                                                                >
                                                                    Book Now
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {lightbox && (
                <div className="pd-lightbox-overlay" onClick={(e) => {
                    e.stopPropagation(); 
                    setLightbox(null);
                }}>
                    <button className="pd-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
                    <div className="pd-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        {lightbox.type === 'image' && (
                            <img src={lightbox.src} alt="Enlarged view" className="pd-lightbox-img" />
                        )}
                        {lightbox.type === 'gradient' && (
                            <div className="pd-lightbox-bg" style={{ background: lightbox.src }}></div>
                        )}
                        {lightbox.type === 'color' && (
                            <div className="pd-lightbox-bg" style={{ background: lightbox.src }}></div>
                        )}
                        {lightbox.type === 'initials' && (
                            <div className="pd-lightbox-initials" style={{ background: lightbox.src }}>
                                {lightbox.initials}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {bookingData && (
                <BookingModal 
                    pro={bookingData.pro} 
                    service={bookingData.service} 
                    onClose={() => setBookingData(null)} 
                />
            )}
        </div>
    );
}

export default ProDetail;
