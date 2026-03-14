import React, { useState, useEffect } from 'react';
import './MentorDashboard.css';
import { API_BASE_URL } from './config';

function MentorDashboard({ mentorAuth, onLogout }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentors/me`, {
                headers: { 'Authorization': `Bearer ${mentorAuth.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile({
                    ...data,
                    // topics, education, workExperience are now stored as plain strings
                    topics: data.topics || '',
                    education: data.education || '',
                    workExperience: data.workExperience || '',
                    isAvailable: data.isAvailable === true,
                    services: data.services ? JSON.parse(data.services) : []
                });
            } else {
                setMessage('Error loading profile. Session might have expired.');
            }
        } catch (e) {
            setMessage('Network error loading profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setMessage('Image size must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const payload = {
                ...profile,
                topics: profile.topics || '',
                education: profile.education || '',
                workExperience: profile.workExperience || '',
                services: JSON.stringify(profile.services || [])
            };

            const res = await fetch(`${API_BASE_URL}/api/mentors/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mentorAuth.token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMessage('Profile saved successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                let errStr = 'Error saving profile.';
                try {
                    const errObj = await res.json();
                    if (errObj.error) errStr = `Error: ${errObj.error}`;
                } catch(e) {}
                setMessage(errStr);
                setTimeout(() => setMessage(''), 5000);
            }
        } catch (e) {
            setMessage('Network error saving profile.');
        } finally {
            setSaving(false);
        }
    };

    const [editModal, setEditModal] = useState({ isOpen: false, field: '', label: '', value: '', value2: '', type: 'text' });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [activeServiceTab, setActiveServiceTab] = useState('All');

    const openEdit = (field, label, type = 'text') => {
        setEditModal({ 
            isOpen: true, 
            field, 
            label, 
            value: field === 'socials' ? (profile.email || '') : (profile[field] || ''), 
            value2: field === 'socials' ? (profile.linkedin || '') : '',
            type 
        });
    };

    const closeEdit = () => {
        setEditModal({ isOpen: false, field: '', label: '', value: '', value2: '', type: 'text' });
    };

    const confirmEdit = () => {
        if (editModal.field === 'socials') {
            setProfile(prev => ({ ...prev, email: editModal.value, linkedin: editModal.value2 }));
        } else {
            let val = editModal.value;
            if (editModal.type === 'checkbox') val = editModal.value === 'true' || editModal.value === true;
            setProfile(prev => ({ ...prev, [editModal.field]: val }));
        }
        closeEdit();
    };

    if (loading) return <div className="mentor-dashboard-container">Loading your dashboard...</div>;
    if (!profile) return <div className="mentor-dashboard-container error-message">{message}</div>;

    const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
    
    // Fallbacks for preview UI
    const headerBgColor = profile.headerBg || '#fbcfe8';
    const avatarBgColor = profile.avatarBg || '#0ea5e9';

    return (
        <div className={`mentor-dashboard-container`}>
            <div className="mentor-header">
                <h1>Welcome back, {profile.name} 👋</h1>
                <div className="header-actions">
                    <button className="mentor-save-btn" onClick={() => setShowPreviewModal(true)}>
                        👀 View Profile Preview
                    </button>
                    {isEditingProfile ? (
                        <button className="mentor-save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : '💾 Save Profile'}
                        </button>
                    ) : null}
                    <button
                        className={isEditingProfile ? 'mentor-logout-btn' : 'mentor-save-btn'}
                        style={isEditingProfile ? {} : {background: '#7c3aed'}}
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                    >
                        {isEditingProfile ? '✅ Done Editing' : '✏️ Edit Profile'}
                    </button>
                    <button className="mentor-logout-btn" onClick={onLogout}>Log Out</button>
                </div>
            </div>

            {isEditingProfile && message && <div style={{background: '#dcfce3', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>{message}</div>}

            {/* Hidden File Inputs for quick image setting */}
            <input type="file" id="bannerUpload" style={{display: 'none'}} accept="image/*" onChange={(e) => handleImageUpload(e, 'headerBg')} />
            <input type="file" id="avatarUpload" style={{display: 'none'}} accept="image/*" onChange={(e) => handleImageUpload(e, 'image')} />

            {editModal.isOpen && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal">
                        <h3>Edit {editModal.label}</h3>
                        {editModal.field === 'socials' ? (
                            <div className="social-edit-fields">
                                <div className="rm-form-group" style={{marginBottom: '1rem'}}>
                                    <label style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', color:'#64748b'}}>Email Address</label>
                                    <input type="email" value={editModal.value} onChange={(e) => setEditModal({...editModal, value: e.target.value})} placeholder="email@example.com" />
                                </div>
                                <div className="rm-form-group">
                                    <label style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', color:'#64748b'}}>LinkedIn URL</label>
                                    <input type="url" value={editModal.value2} onChange={(e) => setEditModal({...editModal, value2: e.target.value})} placeholder="https://linkedin.com/in/..." />
                                </div>
                            </div>
                        ) : editModal.type === 'textarea' ? (
                            <textarea rows="5" value={editModal.value} onChange={(e) => setEditModal({...editModal, value: e.target.value})} />
                        ) : editModal.type === 'checkbox' ? (
                            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'1.5rem'}}>
                                <input 
                                    type="checkbox" 
                                    checked={editModal.value === 'true' || editModal.value === true} 
                                    style={{width:'auto', margin:'0'}}
                                    onChange={(e) => setEditModal({...editModal, value: e.target.checked})} 
                                />
                                <label style={{margin:'0'}}>I am available for mentorship</label>
                            </div>
                        ) : (
                            <input type={editModal.type} value={editModal.value} onChange={(e) => setEditModal({...editModal, value: e.target.value})} />
                        )}
                        <div className="edit-modal-actions">
                            <button className="mentor-logout-btn" onClick={closeEdit}>Cancel</button>
                            <button className="mentor-save-btn" onClick={confirmEdit}>Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Editing Dashboard Mode */}
            <div className="mentor-layout">
                <div className="mentor-preview" style={{ margin: '0 auto', maxWidth: '1200px', width: '100%' }}>
                    <div className="preview-header" style={{ 
                        background: profile.headerBg?.includes('gradient') ? profile.headerBg : 
                                   (profile.headerBg?.startsWith('http') || profile.headerBg?.startsWith('data:image')) ? `url(${profile.headerBg}) center/cover no-repeat` : 
                                   profile.headerBg || '#fbcfe8'
                    }}>
                        {isEditingProfile && (
                            <button className="inline-edit-btn" style={{top:'20px', right:'20px', background:'white', color:'#0f172a', border:'none', boxShadow:'0 2px 10px rgba(0,0,0,0.1)'}} onClick={() => document.getElementById('bannerUpload').click()}>
                                📷 Change Banner
                            </button>
                        )}
                    </div>
                    <div className="preview-body">
                        <div className="preview-avatar-wrapper">
                            <div className="preview-avatar" style={{background: profile.image ? `url(${profile.image}) center/cover` : avatarBgColor}}>
                                {!profile.image && initials}
                                {isEditingProfile && (
                                    <button 
                                        className="inline-edit-btn inline-edit-avatar" 
                                        style={{top: '5px', right: '-5px', bottom:'auto'}} 
                                        onClick={() => document.getElementById('avatarUpload').click()}
                                    >
                                        ✏️
                                    </button>
                                )}
                            </div>
                            {isEditingProfile ? (
                                <button 
                                    className="availability-badge" 
                                    style={{
                                        cursor: 'pointer',
                                        background: profile.isAvailable ? '#10b981' : '#ef4444',
                                        transition: '0.2s',
                                        zIndex: 20
                                    }}
                                    onClick={() => setProfile(prev => ({...prev, isAvailable: !prev.isAvailable}))}
                                    title={profile.isAvailable ? "Click to mark as Unavailable" : "Click to mark as Available"}
                                >
                                    {profile.isAvailable ? '⚡ Available' : '🚫 Unavailable'}
                                </button>
                            ) : (
                                profile.isAvailable && <div className="availability-badge">⚡ Available</div>
                            )}
                        </div>



                        <div className="preview-title-row">
                            <h3>
                                {profile.name} <span className="preview-rating">⭐ {profile.rating || 'New'}</span>
                                {isEditingProfile && <button className="inline-edit-btn" style={{position:'static', marginLeft:'10px'}} onClick={() => openEdit('name', 'Display Name', 'text')}>✏️</button>}
                            </h3>
                            <div className="preview-socials">
                                {profile.email && <a href={`mailto:${profile.email}`} className="preview-social-icon">✉️</a>}
                                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="preview-social-icon">in</a>}
                                <div className="preview-social-icon cursor-pointer" title="Share">
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                </div>
                                {isEditingProfile && <button className="inline-edit-btn" style={{position:'static', marginLeft:'10px'}} onClick={() => openEdit('socials', 'Social Links')}>✏️ Edit Socials</button>}
                            </div>
                        </div>

                        <div className="preview-subtitle">
                            {profile.role} @ {profile.company} {profile.topics ? `| ${profile.topics}` : ''}
                            {isEditingProfile && (
                                <div style={{ display: 'inline-flex', gap: '5px' }}>
                                    <button className="inline-edit-btn" style={{position:'static', marginLeft:'10px'}} onClick={() => openEdit('role', 'Job Role', 'text')}>✏️ Role</button>
                                    <button className="inline-edit-btn" style={{position:'static'}} onClick={() => openEdit('company', 'Company Name', 'text')}>✏️ Company</button>
                                </div>
                            )}
                        </div>

                        <div className="preview-badges">
                            <div className="preview-badge" style={{background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b'}}>💼 {profile.experience ? (profile.experience.toLowerCase().includes('year') ? profile.experience : `${profile.experience} Years of experience`) : 'Experience'}</div>
                            {isEditingProfile && <button className="inline-edit-btn" style={{position:'static', marginLeft:'10px'}} onClick={() => openEdit('experience', 'Experience', 'text')}>✏️</button>}
                        </div>

                        <div className="preview-content-grid">
                            <div className="preview-section-left">
                                <h4 style={{color: '#1e1b4b'}}>👤 About Mentor</h4>
                                
                                <div className="preview-accordion">
                                    {isEditingProfile && <button className="inline-edit-btn" onClick={() => openEdit('bio', 'About', 'textarea')}>✏️</button>}
                                    <div className="preview-accordion-header">About <span>^</span></div>
                                    <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>
                                        {profile.bio || "No about added yet."}
                                    </div>
                                </div>
                                <div className="preview-accordion">
                                    {isEditingProfile && <button className="inline-edit-btn" onClick={() => openEdit('topics', 'Topics of Expertise', 'text')}>✏️</button>}
                                    <div className="preview-accordion-header">Topics of Expertise <span>^</span></div>
                                    <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>
                                        {profile.topics || "No topics added yet."}
                                    </div>
                                </div>
                                <div className="preview-accordion">
                                    {isEditingProfile && <button className="inline-edit-btn" onClick={() => openEdit('education', 'Education', 'textarea')}>✏️</button>}
                                    <div className="preview-accordion-header">Education <span>^</span></div>
                                    <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>
                                        {profile.education || "No education added yet."}
                                    </div>
                                </div>
                                <div className="preview-accordion">
                                    {isEditingProfile && <button className="inline-edit-btn" onClick={() => openEdit('workExperience', 'Work Experience', 'textarea')}>✏️</button>}
                                    <div className="preview-accordion-header">Work Experience <span>^</span></div>
                                    <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>
                                        {profile.workExperience || "No work experience added yet."}
                                    </div>
                                </div>
                            </div>

                            <div className="preview-section-right">
                                <h4 style={{color: '#1e1b4b'}}>📅 Available Services</h4>
                                <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                    
                                    <div style={{display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '0.25rem', marginBottom: '1rem'}}>
                                        {['All', '1:1 Call', 'Resume Review'].map(tab => (
                                            <button 
                                                key={tab}
                                                onClick={() => setActiveServiceTab(tab)}
                                                style={{
                                                    flex: 1, 
                                                    background: activeServiceTab === tab ? 'white' : 'transparent', 
                                                    border: 'none', 
                                                    cursor: 'pointer', 
                                                    textAlign: 'center', 
                                                    padding: '0.4rem', 
                                                    borderRadius: '6px', 
                                                    fontSize: '0.85rem', 
                                                    fontWeight: activeServiceTab === tab ? 'bold' : '500', 
                                                    color: activeServiceTab === tab ? '#1e293b' : '#64748b', 
                                                    boxShadow: activeServiceTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                                }}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Filtered Services */}
                                    {(activeServiceTab === 'All' || activeServiceTab === '1:1 Call') && (
                                        <div className="preview-service-card" style={{borderColor: '#bfdbfe'}}>
                                            <div className="preview-service-tag">⭐ BEST SELLER</div>
                                            <div className="preview-service-title">1:1 Call Mentorship</div>
                                            <div className="preview-service-footer">
                                                <div className="preview-service-price">₹499</div>
                                                <button className="preview-book-btn">Book Now</button>
                                            </div>
                                        </div>
                                    )}

                                    {(activeServiceTab === 'All' || activeServiceTab === 'Resume Review') && (
                                        <div className="preview-service-card">
                                            <div className="preview-service-tag" style={{background: '#e0e7ff', color: '#4338ca'}}>📝 FEEDBACK</div>
                                            <div className="preview-service-title">Resume Review</div>
                                            <div className="preview-service-footer">
                                                <div className="preview-service-price">₹199</div>
                                                <button className="preview-book-btn" style={{background: '#0f172a'}}>Book Now</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Preview Modal */}
            {showPreviewModal && (
                <div className="preview-modal-overlay" onClick={() => setShowPreviewModal(false)}>
                    <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="preview-modal-close" onClick={() => setShowPreviewModal(false)}>✕</button>
                        <div className="preview-modal-scroll">
                        <div className="mentor-preview" style={{ width: '100%', margin: '0', boxShadow: 'none', borderRadius: '0' }}>
                        <div className="preview-header" style={{ 
                            background: profile.headerBg?.includes('gradient') ? profile.headerBg : 
                                       (profile.headerBg?.startsWith('http') || profile.headerBg?.startsWith('data:image')) ? `url(${profile.headerBg}) center/cover no-repeat` : 
                                       profile.headerBg || '#fbcfe8'
                        }}>
                        </div>
                            <div className="preview-body">
                                <div className="preview-avatar-wrapper">
                                    <div className="preview-avatar" style={{background: profile.image ? `url(${profile.image}) center/cover` : avatarBgColor}}>
                                        {!profile.image && initials}
                                    </div>
                                    {profile.isAvailable && <div className="availability-badge">⚡ Available</div>}
                                </div>

                                <div className="preview-title-row" style={{marginBottom: '0.2rem'}}>
                                    <h3 style={{fontSize: '2rem'}}>{profile.name} <span className="preview-rating">⭐ {profile.rating || '4.8'}</span></h3>
                                    <div className="preview-socials">
                                        {profile.email && <a href={`mailto:${profile.email}`} className="preview-social-icon">✉️</a>}
                                        {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="preview-social-icon">in</a>}
                                        <div className="preview-social-icon cursor-pointer" title="Share">
                                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="preview-subtitle" style={{color: '#64748b', marginBottom: '1.5rem', fontSize: '1.05rem'}}>
                                    {profile.role} @ {profile.company} {profile.topics ? `| ${profile.topics}` : ''}
                                </div>

                                <div className="preview-badges">
                                <div className="preview-badge" style={{background: 'white', border: '1px solid #e2e8f0', color: '#64748b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>💼 {profile.experience ? (profile.experience.toLowerCase().includes('year') ? profile.experience : `${profile.experience} Years of experience`) : '4 Years of experience'}</div>
                                </div>

                                <div className="preview-content-grid">
                                    <div className="preview-section-left">
                                        <h4 style={{color: '#1e1b4b'}}>👤 About Mentor</h4>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header">About <span>^</span></div>
                                            <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>
                                                {profile.bio || "No about added yet."}
                                            </div>
                                        </div>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header">Topics of Expertise <span>^</span></div>
                                            <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>
                                                {profile.topics || "No topics added yet."}
                                            </div>
                                        </div>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header">Education <span>^</span></div>
                                            <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>
                                                {profile.education || "No education added yet."}
                                            </div>
                                        </div>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header">Work Experience <span>^</span></div>
                                            <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>
                                                {profile.workExperience || "No work experience added yet."}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="preview-section-right">
                                        <h4 style={{color: '#1e1b4b'}}>📅 Available Services</h4>
                                        <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                            <div style={{display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '0.25rem', marginBottom: '1rem'}}>
                                                {['All', '1:1 Call', 'Resume Review'].map(tab => (
                                                    <button 
                                                        key={tab}
                                                        onClick={() => setActiveServiceTab(tab)}
                                                        style={{
                                                            flex: 1, 
                                                            background: activeServiceTab === tab ? 'white' : 'transparent', 
                                                            border: 'none', 
                                                            cursor: 'pointer', 
                                                            textAlign: 'center', 
                                                            padding: '0.4rem', 
                                                            borderRadius: '6px', 
                                                            fontSize: '0.85rem', 
                                                            fontWeight: activeServiceTab === tab ? 'bold' : '500', 
                                                            color: activeServiceTab === tab ? '#1e293b' : '#64748b', 
                                                            boxShadow: activeServiceTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                                        }}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>

                                            {(activeServiceTab === 'All' || activeServiceTab === '1:1 Call') && (
                                                <div className="preview-service-card" style={{borderColor: '#bfdbfe'}}>
                                                    <div className="preview-service-tag">⭐ BEST SELLER</div>
                                                    <div className="preview-service-title">1:1 Call Mentorship</div>
                                                    <div className="preview-service-footer">
                                                        <div className="preview-service-price">₹499</div>
                                                        <button className="preview-book-btn">Book Now</button>
                                                    </div>
                                                </div>
                                            )}

                                            {(activeServiceTab === 'All' || activeServiceTab === 'Resume Review') && (
                                                <div className="preview-service-card">
                                                    <div className="preview-service-tag" style={{background: '#e0e7ff', color: '#4338ca'}}>📝 FEEDBACK</div>
                                                    <div className="preview-service-title">Resume Review</div>
                                                    <div className="preview-service-footer">
                                                        <div className="preview-service-price">₹199</div>
                                                        <button className="preview-book-btn" style={{background: '#0f172a'}}>Book Now</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>{/* end preview-modal-scroll */}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MentorDashboard;
