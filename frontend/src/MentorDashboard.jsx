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
                    // Parse JSON fields or default them
                    topics: data.topics ? JSON.parse(data.topics) : '',
                    education: data.education ? JSON.parse(data.education) : '',
                    workExperience: data.workExperience ? JSON.parse(data.workExperience) : '',
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

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const payload = {
                ...profile,
                topics: JSON.stringify(profile.topics || ''),
                education: JSON.stringify(profile.education || ''),
                workExperience: JSON.stringify(profile.workExperience || ''),
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
                setMessage('Error saving profile.');
            }
        } catch (e) {
            setMessage('Network error saving profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="mentor-dashboard-container">Loading your dashboard...</div>;
    if (!profile) return <div className="mentor-dashboard-container error-message">{message}</div>;

    const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
    
    // Fallbacks for preview UI
    const headerBgColor = profile.headerBg || '#fbcfe8';
    const avatarBgColor = profile.avatarBg || '#0ea5e9';

    return (
        <div className="mentor-dashboard-container">
            <div className="mentor-header">
                <h1>Welcome back, {profile.name} 👋</h1>
                <button className="mentor-logout-btn" onClick={onLogout}>Log Out</button>
            </div>

            {message && <div style={{background: '#dcfce3', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>{message}</div>}

            <div className="mentor-layout">
                {/* Form Section */}
                <form className="mentor-edit-form" onSubmit={handleSave}>
                    <h2>Edit Your Public Profile</h2>

                    <div className="mentor-form-group">
                        <label>Display Name</label>
                        <input type="text" name="name" value={profile.name || ''} onChange={handleChange} />
                    </div>

                    <div className="mentor-form-group">
                        <label>Header Banner Color (Hex)</label>
                        <input type="text" name="headerBg" value={profile.headerBg || ''} onChange={handleChange} placeholder="#fbcfe8" />
                    </div>

                    <div className="mentor-form-group">
                        <label>Avatar Background Color (Hex)</label>
                        <input type="text" name="avatarBg" value={profile.avatarBg || ''} onChange={handleChange} placeholder="#0ea5e9" />
                    </div>

                    <div className="mentor-form-group">
                        <label>Job Role</label>
                        <input type="text" name="role" value={profile.role || ''} onChange={handleChange} placeholder="e.g. Strategy" />
                    </div>

                    <div className="mentor-form-group">
                        <label>Company</label>
                        <input type="text" name="company" value={profile.company || ''} onChange={handleChange} placeholder="e.g. Meesho" />
                    </div>

                    <div className="mentor-form-group">
                        <label>Years of Experience Text</label>
                        <input type="text" name="experience" value={profile.experience || ''} onChange={handleChange} placeholder="e.g. 4 years of Experience" />
                    </div>

                    <div className="mentor-form-group">
                        <label>Top Mentor Tag line</label>
                        <input type="text" name="topics" value={profile.topics || ''} onChange={handleChange} placeholder="e.g. Top 15 Unstoppable Mentor" />
                    </div>

                    <div className="mentor-form-group">
                        <label>About You</label>
                        <textarea name="bio" value={profile.bio || ''} onChange={handleChange} rows="4" placeholder="Winner & Finalist in 23+ Int'l & Nat'l..." />
                    </div>

                    <div className="mentor-form-group">
                        <label>Instagram URL</label>
                        <input type="text" name="instagram" value={profile.instagram || ''} onChange={handleChange} />
                    </div>

                    <div className="mentor-form-group">
                        <label>LinkedIn URL</label>
                        <input type="text" name="linkedin" value={profile.linkedin || ''} onChange={handleChange} />
                    </div>

                    <button type="submit" className="mentor-save-btn" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

                {/* Live Preview Section */}
                <div className="mentor-preview">
                    <div className="preview-header" style={{background: headerBgColor}}></div>
                    <div className="preview-body">
                        <div className="preview-avatar-wrapper">
                            <div className="preview-avatar" style={{background: profile.image ? `url(${profile.image})` : avatarBgColor}}>
                                {!profile.image && initials}
                            </div>
                            <div className="availability-badge">⚡ Available</div>
                        </div>

                        <div className="preview-title-row">
                            <h3>{profile.name} <span className="preview-rating">⭐ {profile.rating || 'New'}</span></h3>
                            <div className="preview-socials">
                                {profile.instagram && <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="preview-social-icon">📸</a>}
                                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="preview-social-icon">in</a>}
                            </div>
                        </div>

                        <div className="preview-subtitle">
                            {profile.role} @ {profile.company} {profile.topics ? `| ${profile.topics}` : ''}
                        </div>

                        <div className="preview-badges">
                            <div className="preview-badge">💼 {profile.experience || 'Experience'}</div>
                            <div className="preview-badge">💬 {profile.reviews || 0} Reviews</div>
                        </div>

                        <div className="preview-content-grid">
                            <div className="preview-section-left">
                                <h4 style={{color: '#1e1b4b'}}>👤 About Mentor</h4>
                                
                                <div className="preview-accordion">
                                    <div className="preview-accordion-header">About <span>^</span></div>
                                    <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5'}}>
                                        {profile.bio || "No about added yet."}
                                    </div>
                                </div>
                                <div className="preview-accordion"><div className="preview-accordion-header">Topics <span>v</span></div></div>
                                <div className="preview-accordion"><div className="preview-accordion-header">Education <span>v</span></div></div>
                                <div className="preview-accordion"><div className="preview-accordion-header">Work Experience <span>v</span></div></div>
                            </div>

                            <div className="preview-section-right">
                                <h4 style={{color: '#1e1b4b'}}>📅 Available Services</h4>
                                <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                    
                                    <div style={{display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '0.25rem', marginBottom: '1rem'}}>
                                        <div style={{flex: 1, background: 'white', textAlign: 'center', padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold'}}>All</div>
                                        <div style={{flex: 1, textAlign: 'center', padding: '0.4rem', fontSize: '0.85rem', color: '#64748b'}}>1:1 Call</div>
                                        <div style={{flex: 1, textAlign: 'center', padding: '0.4rem', fontSize: '0.85rem', color: '#64748b'}}>Query</div>
                                    </div>

                                    {/* Mock Service 1 */}
                                    <div className="preview-service-card" style={{borderColor: '#bfdbfe'}}>
                                        <div className="preview-service-tag">⭐ BEST SELLER</div>
                                        <div className="preview-service-title">Case Interview Strategy</div>
                                        <div className="preview-service-footer">
                                            <div className="preview-service-price">₹499</div>
                                            <button className="preview-book-btn">Book Now</button>
                                        </div>
                                    </div>

                                    {/* Mock Service 2 */}
                                    <div className="preview-service-card">
                                        <div className="preview-service-tag" style={{background: '#e0e7ff', color: '#4338ca'}}>🎁 RESOURCE</div>
                                        <div className="preview-service-title">Marketing Prep Material</div>
                                        <div className="preview-service-footer">
                                            <div className="preview-service-price">₹199</div>
                                            <button className="preview-book-btn" style={{background: '#0f172a'}}>Book Now</button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default MentorDashboard;
