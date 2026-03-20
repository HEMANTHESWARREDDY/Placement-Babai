import React, { useState, useEffect } from 'react';
import './MentorDashboard.css';
import './ProDetail.css';
import BookingModal from './BookingModal';
import { API_BASE_URL } from './config';

function MentorDashboard({ mentorAuth, onLogout }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [initialProfile, setInitialProfile] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [showBookings, setShowBookings] = useState(false);
    const [bookingTab, setBookingTab] = useState('Pending'); // 'Pending', 'Approved', 'Scheduled', 'History'
    const [sortBy, setSortBy] = useState('Newest'); // 'Newest', 'Oldest', 'A-Z'
    const [meetLinks, setMeetLinks] = useState({}); // { bookingId: 'url' }
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [dailyViews, setDailyViews] = useState({});
    const [viewFilter, setViewFilter] = useState('7days'); 
    const [selectedDate, setSelectedDate] = useState('');
    
    
    // Custom UI States
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ 
        isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, onClose: null, confirmText: '', cancelText: '', type: 'danger' 
    });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const closeDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile?.id) {
            fetchBookings();
        }
    }, [profile?.id]);

    useEffect(() => {
        if (profile?.id && showAnalytics) {
            fetch(`${API_BASE_URL}/api/mentors/${profile.id}/analytics/views`)
                .then(res => res.json())
                .then(data => setDailyViews(data))
                .catch(err => console.error("Error fetching views:", err));
        }
    }, [profile?.id, showAnalytics]);
    

    useEffect(() => {
        if (profile && initialProfile) {
            // Compare relevant fields for changes
            const profileStr = JSON.stringify({ ...profile, services: JSON.stringify(profile.services) });
            const initialStr = JSON.stringify({ ...initialProfile, services: JSON.stringify(initialProfile.services) });
            setHasChanges(profileStr !== initialStr);
        }
    }, [profile, initialProfile]);

    const fetchBookings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/mentor/${profile.id}`);
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (e) {
            console.error("Error fetching bookings:", e);
        }
    };

    const getFilteredViews = () => {
        const sortedDates = Object.keys(dailyViews).sort((a,b) => new Date(b) - new Date(a));
        const now = new Date();
        
        return sortedDates.filter(date => {
            if (selectedDate) {
                const target = new Date(selectedDate);
                const current = new Date(date);
                return target.getFullYear() === current.getFullYear() && 
                       target.getMonth() === current.getMonth() && 
                       target.getDate() === current.getDate();
            }

            const d = new Date(date);
            const diffMs = now - d.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffHours / 24;
            
            if (viewFilter === 'hourly') return diffHours <= 1;
            if (viewFilter === '6hours') return diffHours <= 6;
            if (viewFilter === '12hours') return diffHours <= 12;
            if (viewFilter === 'today') return d.toDateString() === now.toDateString();
            if (viewFilter === '7days') return diffDays <= 7;
            if (viewFilter === '30days') return diffDays <= 30;
            return true;
        });
    };

    const getTotalViews = () => {
        const filteredDates = getFilteredViews();
        return filteredDates.reduce((acc, date) => acc + dailyViews[date], 0);
    };

    const updateBookingStatus = async (id, status) => {
        try {
            const link = meetLinks[id] || '';
            const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/status?status=${status}&meetLink=${encodeURIComponent(link)}`, {
                method: 'PUT'
            });
            if (res.ok) {
                fetchBookings(); // Refresh list
            }
        } catch (e) {
            console.error("Error updating status:", e);
        }
    };

    const deleteBooking = async (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Request',
            message: 'Are you sure you want to reject and delete this request? This action cannot be undone.',
            confirmText: 'Yes, Delete',
            cancelText: 'Keep Request',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/bookings/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        fetchBookings();
                        showToast('Request deleted successfully');
                    }
                } catch (e) {
                    showToast('Error deleting request', 'error');
                }
                closeDialog();
            },
            onCancel: closeDialog,
            onClose: closeDialog
        });
    };

    const isSessionReadyToComplete = (bookingDate, bookingTime) => {
        try {
            if (!bookingDate || !bookingTime || bookingTime === 'Custom Time') return true; // allow manual if unparseable
            
            const [time, ampm] = bookingTime.split(' ');
            let [hrs, mins] = time.split(':').map(Number);
            if (ampm === 'PM' && hrs !== 12) hrs += 12;
            if (ampm === 'AM' && hrs === 12) hrs = 0;

            const sessionDate = new Date(`${bookingDate}T${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`);
            const now = new Date();
            
            // Enabled 25 mins after session start
            const enableTime = new Date(sessionDate.getTime() + 25 * 60 * 1000);
            return now >= enableTime;
        } catch (e) {
            return true; 
        }
    };

    const canRevoke = (bookingDate, bookingTime) => {
        try {
            if (!bookingDate || !bookingTime || bookingTime === 'Custom Time') return false;
            
            const [time, ampm] = bookingTime.split(' ');
            let [hrs, mins] = time.split(':').map(Number);
            if (ampm === 'PM' && hrs !== 12) hrs += 12;
            if (ampm === 'AM' && hrs === 12) hrs = 0;

            const sessionDate = new Date(`${bookingDate}T${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`);
            const now = new Date();
            
            // Can revoke if current time is at least 20 mins before session start
            const revokeDeadline = new Date(sessionDate.getTime() - 20 * 60 * 1000);
            return now < revokeDeadline;
        } catch (e) {
            return false;
        }
    };

    const sortBookings = (list) => {
        return [...list].sort((a, b) => {
            if (sortBy === 'A-Z') return a.guestName.localeCompare(b.guestName);
            if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'Oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            return 0;
        });
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage('');
        try {
            const payload = {
                ...profile,
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
                showToast('Profile updated successfully! ✨');
                setInitialProfile(JSON.parse(JSON.stringify(profile)));
                setHasChanges(false);
                setIsEditingProfile(false);
            } else {
                showToast('Error updating profile. Please try again.', 'error');
            }
        } catch (e) {
            showToast('Network error updating profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentors/me`, {
                headers: { 'Authorization': `Bearer ${mentorAuth.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const profileData = {
                    ...data,
                    topics: data.topics || '',
                    education: data.education || '',
                    workExperience: data.workExperience || '',
                    isAvailable: data.isAvailable === true,
                    services: data.services ? (typeof data.services === 'string' ? JSON.parse(data.services) : data.services) : []
                };
                setProfile(profileData);
                setInitialProfile(JSON.parse(JSON.stringify(profileData)));
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


    const [editModal, setEditModal] = useState({ isOpen: false, field: '', label: '', value: '', value2: '', type: 'text' });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [activeServiceTab, setActiveServiceTab] = useState('All');
    const [mainTab, setMainTab] = useState('About');
    const [expandedSections, setExpandedSections] = useState({
        about: true,
        topics: false,
        education: false,
        work: false
    });

    const [bookingData, setBookingData] = useState(null); // {pro, service}

    const toggleAccordion = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

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

    const todayPending = bookings.filter(b => {
        if (b.status !== 'PENDING') return false;
        const createdDate = new Date(b.createdAt).toDateString();
        const todayDate = new Date().toDateString();
        return createdDate === todayDate;
    }).length;

    return (
        <div className={`mentor-dashboard-container`} style={{padding: 0}}>
            <header className="header">
                <div className="header-content">
                    <div className="logo" style={{cursor: 'default'}}>
                        <img src="/logos/logo.png" alt="PlacementBabai" className="logo-img" />
                        <span className="header-tagline">Connect. Learn. Grow. <span style={{fontSize: '10px', opacity: 0.5}}>(v1.0.1)</span></span>
                    </div>

                    <div className="header-badge" style={{cursor: 'default', left: '50%'}}>
                        🔥 {todayPending} New Requests Today
                    </div>

                    <nav>
                        <ul className="nav-links">
                            <li>
                                <a href="#" 
                                   className={(!showBookings && !isEditingProfile && !showAnalytics) ? 'active-nav' : ''} 
                                   onClick={(e) => { 
                                       e.preventDefault(); 
                                       setShowBookings(false); 
                                       setIsEditingProfile(false); 
                                       setShowAnalytics(false);
                                   }}>
                                    Profile
                                </a>
                            </li>
                            <li>
                                <a href="#" className={showBookings ? 'active-nav' : ''} onClick={(e) => { 
                                    e.preventDefault(); 
                                    setShowBookings(true); 
                                    setIsEditingProfile(false); 
                                    setShowAnalytics(false);
                                }}>
                                    View Requests ({bookings.filter(b => b.status === 'PENDING').length})
                                </a>
                            </li>
                            <li>
                                <a href="#" className={showAnalytics ? 'active-nav' : ''} onClick={(e) => { 
                                    e.preventDefault(); 
                                    setShowAnalytics(true); 
                                    setShowBookings(false); 
                                    setIsEditingProfile(false); 
                                }}>
                                    Analytics
                                </a>
                            </li>
                            <li>
                                <button className="admin-nav-btn" onClick={onLogout} style={{marginLeft: '1rem', background: '#ef4444'}}>
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>

            <div style={{padding: '2.5rem 2rem'}}>
                {(!showBookings && !isEditingProfile && !showAnalytics) && (

                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto 2rem auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 10px'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                            Welcome back, {profile.name}! 👋
                        </div>
                        <button 
                            onClick={(e) => { e.preventDefault(); setIsEditingProfile(true); }}
                            style={{
                                background: 'white',
                                color: '#4f46e5',
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                transition: '0.2s'
                            }}
                        >
                            ✏️ Edit Profile
                        </button>
                    </div>
                )}
                {isEditingProfile && (
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto 1.5rem auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 10px'
                    }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button 
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    if (hasChanges) {
                                        setConfirmDialog({
                                            isOpen: true,
                                            title: 'Unsaved Changes',
                                            message: "You have unsaved changes. Would you like to save them now?",
                                            confirmText: 'Save & Exit',
                                            cancelText: 'Discard Changes',
                                            type: 'success',
                                            onConfirm: () => { handleSaveProfile(); closeDialog(); },
                                            onCancel: () => { setProfile(JSON.parse(JSON.stringify(initialProfile))); setIsEditingProfile(false); closeDialog(); },
                                            onClose: closeDialog
                                        });
                                        return;
                                    }
                                    setIsEditingProfile(false);
                                }}
                                style={{
                                    background: 'white',
                                    color: '#64748b',
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                ← Back
                            </button>
                            <div style={{
                                fontSize: '0.75rem', 
                                fontWeight: '800', 
                                textTransform: 'uppercase', 
                                color: '#ef4444', 
                                background: '#fee2e2', 
                                padding: '6px 12px', 
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                ✏️ Edit Mode
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <button 
                                onClick={(e) => { e.preventDefault(); setShowPreviewModal(true); }}
                                style={{
                                    background: 'white',
                                    color: '#475569',
                                    padding: '8px 18px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    transition: '0.2s'
                                }}
                            >
                                👁️ View Preview
                            </button>
                            
                            <button 
                                className="mentor-save-btn" 
                                style={{
                                    background: hasChanges ? '#16a34a' : '#94a3b8',
                                    color: 'white',
                                    padding: '8px 22px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '700',
                                    cursor: hasChanges ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: hasChanges ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none',
                                    transition: '0.3s',
                                    opacity: saving ? 0.7 : 1
                                }}
                                onClick={() => {
                                    if (hasChanges) handleSaveProfile();
                                }}
                                disabled={!hasChanges || saving}
                            >
                                {saving ? '⏳ Saving...' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Custom Dialogue Modal */}
                {confirmDialog.isOpen && (
                    <div className="mentor-dialog-overlay" onClick={confirmDialog.onClose}>
                        <div className="mentor-dialog" onClick={e => e.stopPropagation()}>
                            <div className="mentor-dialog-content">
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1.5rem'}}>
                                    <h3 style={{margin: 0, fontSize: '1.5rem'}}>{confirmDialog.title}</h3>
                                    <button onClick={confirmDialog.onClose} style={{background:'transparent', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8', padding: '5px'}}>&times;</button>
                                </div>
                                <div style={{display:'flex', gap: '1rem', alignItems: 'flex-start'}}>
                                    <div style={{
                                        background: confirmDialog.type === 'danger' ? '#fee2e2' : '#dcfce3',
                                        color: confirmDialog.type === 'danger' ? '#ef4444' : '#10b981',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        fontSize: '1.25rem'
                                    }}>
                                        {confirmDialog.type === 'danger' ? '⚠️' : '✨'}
                                    </div>
                                    <p style={{margin: 0, fontSize: '1.05rem', color: '#475569', fontWeight: '500'}}>{confirmDialog.message}</p>
                                </div>
                            </div>
                            <div className="mentor-dialog-actions">
                                <button className="dialog-cancel" onClick={confirmDialog.onCancel}>{confirmDialog.cancelText || 'Cancel'}</button>
                                <button className={`dialog-confirm ${confirmDialog.type}`} onClick={confirmDialog.onConfirm}>{confirmDialog.confirmText || 'Confirm'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Notification */}
                {toast.show && (
                    <div className={`mentor-toast ${toast.type}`}>
                        {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                    </div>
                )}

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

            {showBookings && (
                <div className="bookings-section">
                    <div className="bookings-header">
                        <div className="bookings-tabs">
                            <button className={`b-tab ${bookingTab === 'Pending' ? 'active' : ''}`} onClick={() => setBookingTab('Pending')}>
                                Requests ({bookings.filter(b => b.status === 'PENDING').length})
                            </button>
                            <button className={`b-tab ${bookingTab === 'Approved' ? 'active' : ''}`} onClick={() => setBookingTab('Approved')}>
                                Approved ({bookings.filter(b => b.status === 'APPROVED').length})
                            </button>
                            <button className={`b-tab ${bookingTab === 'Scheduled' ? 'active' : ''}`} onClick={() => setBookingTab('Scheduled')}>
                                Scheduled ({bookings.filter(b => b.status === 'SCHEDULED').length})
                            </button>
                            <button className={`b-tab ${bookingTab === 'History' ? 'active' : ''}`} onClick={() => setBookingTab('History')}>
                                History ({bookings.filter(b => ['COMPLETED', 'REJECTED'].includes(b.status)).length})
                            </button>
                        </div>
                        <div className="bookings-sort">
                            <span>Sort by:</span>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="Newest">Newest First</option>
                                <option value="Oldest">Oldest First</option>
                                <option value="A-Z">Guest Name (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bookings-list">
                        {sortBookings(
                            bookings.filter(b => {
                                if (bookingTab === 'Pending') return b.status === 'PENDING';
                                if (bookingTab === 'Approved') return b.status === 'APPROVED';
                                if (bookingTab === 'Scheduled') return b.status === 'SCHEDULED';
                                if (bookingTab === 'History') return ['COMPLETED', 'REJECTED'].includes(b.status);
                                return false;
                            })
                        )
                            .map(booking => (
                                <div key={booking.id} className={`booking-card status-${booking.status.toLowerCase()}`}>
                                    <div className="booking-card-top">
                                        <div className="guest-info">
                                            <h4>{booking.guestName}</h4>
                                            <div className="guest-meta">
                                                <span>📧 {booking.guestEmail}</span>
                                                <span>📱 {booking.guestWhatsapp}</span>
                                            </div>
                                        </div>
                                        <div className="booking-status-badge">
                                            {booking.status}
                                        </div>
                                    </div>
                                    
                                    <div className="booking-details-grid">
                                        <div className="b-detail">
                                            <label>Service</label>
                                            <p>{booking.serviceType}</p>
                                        </div>
                                        <div className="b-detail">
                                            <label>Preferred Date</label>
                                            <p>📅 {booking.bookingDate}</p>
                                        </div>
                                        <div className="b-detail">
                                            <label>Preferred Time</label>
                                            <p>⏰ {booking.bookingTime}</p>
                                        </div>
                                        <div className="b-detail">
                                            <label>Requested At</label>
                                            <p>⏲️ {new Date(booking.createdAt).toLocaleString()}</p>
                                        </div>
                                        {booking.meetLink && (
                                            <div className="b-detail" style={{gridColumn: 'span 2'}}>
                                                <label>Meeting Link</label>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                    <p style={{margin: 0, color: '#7c3aed', fontWeight: '600', textDecoration: 'underline'}}>{booking.meetLink}</p>
                                                    <a href={booking.meetLink} target="_blank" rel="noreferrer" className="btn-approve" style={{padding: '4px 10px', fontSize: '0.75rem', textDecoration: 'none'}}>Join</a>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {booking.customRequest && (
                                        <div className="booking-request-msg">
                                            <label>Additional Message</label>
                                            <p>{booking.customRequest}</p>
                                        </div>
                                    )}

                                    <div className="booking-card-actions">
                                        {booking.status === 'PENDING' && (
                                            <>
                                                <button className="btn-approve" onClick={() => updateBookingStatus(booking.id, 'APPROVED')}>
                                                    ✅ Approve Request
                                                </button>
                                                <button className="btn-reject" onClick={() => updateBookingStatus(booking.id, 'REJECTED')}>
                                                    ❌ Reject
                                                </button>
                                            </>
                                        )}

                                        {booking.status === 'APPROVED' && (
                                            <>
                                                <div className="meet-link-input-wrap" style={{marginBottom: '1rem', width: '100%'}}>
                                                    <label style={{fontSize: '0.8rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '4px'}}>Paste Google Meet / Zoom Link:</label>
                                                    <input 
                                                        type="text" 
                                                        className="simple-input" 
                                                        placeholder="https://meet.google.com/..." 
                                                        value={meetLinks[booking.id] || ''}
                                                        onChange={(e) => setMeetLinks({...meetLinks, [booking.id]: e.target.value})}
                                                        style={{padding: '10px 14px'}}
                                                    />
                                                </div>
                                                <button 
                                                    className="btn-schedule" 
                                                    disabled={!meetLinks[booking.id]}
                                                    onClick={() => updateBookingStatus(booking.id, 'SCHEDULED')}
                                                    style={{ opacity: !meetLinks[booking.id] ? 0.5 : 1 }}
                                                >
                                                    📅 Mark Scheduled
                                                </button>
                                                <button className="btn-reject" onClick={() => updateBookingStatus(booking.id, 'REJECTED')}>
                                                    ❌ Cancel Request
                                                </button>
                                            </>
                                        )}

                                        {booking.status === 'SCHEDULED' && (
                                            <button 
                                                className="btn-approve" 
                                                disabled={!isSessionReadyToComplete(booking.bookingDate, booking.bookingTime)}
                                                onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                                                style={{ opacity: !isSessionReadyToComplete(booking.bookingDate, booking.bookingTime) ? 0.5 : 1 }}
                                                title={!isSessionReadyToComplete(booking.bookingDate, booking.bookingTime) ? "Session can be marked completed 25 mins after start time" : ""}
                                            >
                                                🏆 Session Completed
                                            </button>
                                        )}

                                        {(booking.status === 'COMPLETED' || booking.status === 'REJECTED') && (
                                            <div style={{display: 'flex', gap: '10px'}}>
                                                {booking.status === 'REJECTED' && canRevoke(booking.bookingDate, booking.bookingTime) && (
                                                    <button className="btn-approve" onClick={() => updateBookingStatus(booking.id, 'PENDING')}>
                                                        🔄 Revoke Rejection
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        
                        {bookings.filter(b => {
                            if (bookingTab === 'Pending') return b.status === 'PENDING';
                            if (bookingTab === 'Approved') return b.status === 'APPROVED';
                            if (bookingTab === 'Scheduled') return b.status === 'SCHEDULED';
                            if (bookingTab === 'History') return ['COMPLETED', 'REJECTED'].includes(b.status);
                            return false;
                        }).length === 0 && (
                            <div className="empty-bookings">
                                <p>No {bookingTab.toLowerCase()} items found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Editing Dashboard Mode */}
            {!showBookings && !showAnalytics && (
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
                        <div className="preview-top-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                            <div className="preview-avatar-wrapper" style={{ marginBottom: 0 }}>
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
                                    fontSize: '0.85rem',
                                    fontWeight: '700',
                                    color: '#eab308',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    ⭐ {profile.rating || 'New'}
                                </span>
                                {isEditingProfile && <button className="inline-edit-btn" style={{position:'static'}} onClick={() => openEdit('socials', 'Social Links')}>✏️</button>}
                                <div className="preview-socials" style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
                                    {profile.email && <a href={`mailto:${profile.email}`} className="preview-social-icon-raw">✉️</a>}
                                    {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="preview-social-icon-raw">in</a>}
                                    <div className="preview-social-icon-raw cursor-pointer" title="Share" style={{ color: '#475569' }}>
                                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                    </div>
                                </div>
                            </div>
                        </div>





                        <div className="preview-title-row">
                            <h3>
                                {profile.name}
                                {isEditingProfile && <button className="inline-edit-btn" style={{position:'static', marginLeft:'10px'}} onClick={() => openEdit('name', 'Display Name', 'text')}>✏️</button>}
                            </h3>
                        </div>

                        <div className="preview-subtitle">
                            {profile.role} @ {profile.company} {profile.topics ? `| ${profile.topics}` : ''}
                            {isEditingProfile && (
                                <div className="edit-buttons-stack">
                                    <button className="inline-edit-btn" style={{position:'static'}} onClick={() => openEdit('role', 'Job Role', 'text')}>✏️ Role</button>
                                    <button className="inline-edit-btn" style={{position:'static'}} onClick={() => openEdit('company', 'Company Name', 'text')}>✏️ Company</button>
                                </div>
                            )}
                        </div>

                        <div className="preview-badges">
                            <div className="preview-badge" style={{background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b'}}>💼 {profile.experience ? (profile.experience.toLowerCase().includes('year') ? profile.experience : `${profile.experience} Years of experience`) : 'Experience'}</div>
                            {isEditingProfile && <button className="inline-edit-btn-mini" style={{position:'static', marginLeft:'12px'}} onClick={() => openEdit('experience', 'Experience', 'text')}>✏️</button>}
                        </div>

                        {/* Main Tabs (Visible on Mobile) */}
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
                                <h4 style={{color: '#1e1b4b'}}>👤 About Mentor</h4>
                                
                                <div className="preview-accordion">
                                    <div className="preview-accordion-header" onClick={() => toggleAccordion('about')} style={{cursor: 'pointer'}}>
                                        About 
                                        <span className="accordion-action-wrapper">
                                            {isEditingProfile && <button className="inline-edit-btn-mini" onClick={(e) => { e.stopPropagation(); openEdit('bio', 'About', 'textarea'); }}>✏️</button>}
                                            {expandedSections.about ? '^' : 'v'}
                                        </span>
                                    </div>
                                    {expandedSections.about && (
                                        <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                            {profile.bio || "No about added yet."}
                                        </div>
                                    )}
                                </div>
                                <div className="preview-accordion">
                                    <div className="preview-accordion-header" onClick={() => toggleAccordion('topics')} style={{cursor: 'pointer'}}>
                                        Topics of Expertise 
                                        <span className="accordion-action-wrapper">
                                            {isEditingProfile && <button className="inline-edit-btn-mini" onClick={(e) => { e.stopPropagation(); openEdit('topics', 'Topics of Expertise', 'text'); }}>✏️</button>}
                                            {expandedSections.topics ? '^' : 'v'}
                                        </span>
                                    </div>
                                    {expandedSections.topics && (
                                        <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                            {profile.topics || "No topics added yet."}
                                        </div>
                                    )}
                                </div>
                                <div className="preview-accordion">
                                    <div className="preview-accordion-header" onClick={() => toggleAccordion('education')} style={{cursor: 'pointer'}}>
                                        Education 
                                        <span className="accordion-action-wrapper">
                                            {isEditingProfile && <button className="inline-edit-btn-mini" onClick={(e) => { e.stopPropagation(); openEdit('education', 'Education', 'textarea'); }}>✏️</button>}
                                            {expandedSections.education ? '^' : 'v'}
                                        </span>
                                    </div>
                                    {expandedSections.education && (
                                        <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                            {profile.education || "No education added yet."}
                                        </div>
                                    )}
                                </div>
                                <div className="preview-accordion">
                                    <div className="preview-accordion-header" onClick={() => toggleAccordion('work')} style={{cursor: 'pointer'}}>
                                        Work Experience 
                                        <span className="accordion-action-wrapper">
                                            {isEditingProfile && <button className="inline-edit-btn-mini" onClick={(e) => { e.stopPropagation(); openEdit('workExperience', 'Work Experience', 'textarea'); }}>✏️</button>}
                                            {expandedSections.work ? '^' : 'v'}
                                        </span>
                                    </div>
                                    {expandedSections.work && (
                                        <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                            {profile.workExperience || "No work experience added yet."}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`preview-section-right ${mainTab === 'Services' ? 'tab-visible' : 'tab-hidden'}`}>
                                <h4>📅 Available Services</h4>
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
                                                <button 
                                                    className="preview-book-btn"
                                                    onClick={() => setBookingData({ pro: profile, service: { title: '1:1 Call Mentorship', price: 499 } })}
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {(activeServiceTab === 'All' || activeServiceTab === 'Resume Review') && (
                                        <div className="preview-service-card">
                                            <div className="preview-service-tag" style={{background: '#e0e7ff', color: '#4338ca'}}>📝 FEEDBACK</div>
                                            <div className="preview-service-title">Resume Review</div>
                                            <div className="preview-service-footer">
                                                <div className="preview-service-price">₹199</div>
                                                <button 
                                                    className="preview-book-btn" 
                                                    style={{background: '#0f172a'}}
                                                    onClick={() => setBookingData({ pro: profile, service: { title: 'Resume Review', price: 199 } })}
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}
            {showAnalytics && (
                <div className="analytics-section">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                        <h2 style={{fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a'}}>Dashboard Analytics</h2>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <span style={{fontSize: '14px', color: '#64748b', fontWeight: 600}}>Time Period:</span>
                            <select 
                                value={viewFilter} 
                                onChange={(e) => {
                                    setViewFilter(e.target.value);
                                    setSelectedDate('');
                                }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="hourly">Hourly</option>
                                <option value="6hours">Last 6 Hours</option>
                                <option value="12hours">Last 12 Hours</option>
                                <option value="today">Today</option>
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="all">All Time</option>
                            </select>
                            <span style={{fontSize: '14px', color: '#64748b', fontWeight: 600, marginLeft: '10px'}}>By Date:</span>
                            {selectedDate && (
                                <span 
                                    onClick={() => setSelectedDate('')}
                                    style={{fontSize: '12px', color: '#3b82f6', cursor: 'pointer', marginLeft: '5px', fontWeight: '700'}}
                                >
                                    (Clear)
                                </span>
                            )}
                            <input 
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card-custom">
                            <h3 style={{fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem'}}>{viewFilter === 'all' && !selectedDate ? (profile.profileViews || 0) : getTotalViews()}</h3>
                            <p style={{color: '#64748b', fontWeight: '600'}}>Profile Views</p>
                        </div>
                        <div className="stat-card-custom">
                            <h3 style={{fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem'}}>{bookings.length}</h3>
                            <p style={{color: '#64748b', fontWeight: '600'}}>Total Bookings</p>
                        </div>
                        <div className="stat-card-custom">
                            <h3 style={{fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem'}}>{bookings.filter(b => b.status === 'COMPLETED').length}</h3>
                            <p style={{color: '#64748b', fontWeight: '600'}}>Sessions Completed</p>
                        </div>
                        <div className="stat-card-custom">
                            <h3 style={{fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem'}}>₹{(bookings.filter(b => b.status === 'COMPLETED').length * 499).toLocaleString()}</h3>
                            <p style={{color: '#64748b', fontWeight: '600'}}>Total Earnings</p>
                        </div>
                    </div>


                    <div style={{marginTop: '2rem', background: '#0f172a', padding: '2rem', borderRadius: '24px', color: 'white', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem'}}>
                            <div style={{minWidth: '240px'}}>
                                <h3 style={{margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#818cf8'}}>Lifetime Mentor Record</h3>
                                <p style={{margin: '8px 0 0 0', opacity: 0.7, fontSize: '0.9rem', lineHeight: '1.5'}}>Your overall professional impact and performance since joining the platform.</p>
                            </div>
                            <div style={{display: 'flex', gap: '2rem', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap', minWidth: '280px'}}>
                                <div style={{textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.25rem 2rem', borderRadius: '16px', minWidth: '120px', flex: 1}}>
                                    <div style={{fontSize: '1.75rem', fontWeight: '800', color: 'white'}}>{profile.profileViews || 0}</div>
                                    <div style={{fontSize: '0.75rem', opacity: 0.6, fontWeight: '700', textTransform: 'uppercase', marginTop: '4px'}}>Total Views</div>
                                </div>
                                <div style={{textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.25rem 2rem', borderRadius: '16px', minWidth: '120px', flex: 1}}>
                                    <div style={(bookings.length > 0) ? {fontSize: '1.75rem', fontWeight: '800', color: 'white'} : {fontSize: '1.75rem', fontWeight: '800', color: 'rgba(255,255,255,0.2)'}}>{bookings.length}</div>
                                    <div style={{fontSize: '0.75rem', opacity: 0.6, fontWeight: '700', textTransform: 'uppercase', marginTop: '4px'}}>Total Bookings</div>
                                </div>
                                <div style={{textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.25rem 2rem', borderRadius: '16px', minWidth: '120px', flex: 1}}>
                                    <div style={{fontSize: '1.75rem', fontWeight: '800', color: 'white'}}>{bookings.filter(b => b.status === 'COMPLETED').length}</div>
                                    <div style={{fontSize: '0.75rem', opacity: 0.6, fontWeight: '700', textTransform: 'uppercase', marginTop: '4px'}}>Sessions Completed</div>
                                </div>
                                <div style={{textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.25rem 2rem', borderRadius: '16px', minWidth: '120px', flex: 1}}>
                                    <div style={{fontSize: '1.75rem', fontWeight: '800', color: '#fbbf24'}}>₹{(bookings.filter(b => b.status === 'COMPLETED').length * 499).toLocaleString()}</div>
                                    <div style={{fontSize: '0.75rem', opacity: 0.6, fontWeight: '700', textTransform: 'uppercase', marginTop: '4px'}}>Lifetime Earnings</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="preview-top-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                                <div className="preview-avatar-wrapper" style={{ marginBottom: 0 }}>
                                    <div className="preview-avatar" style={{background: profile.image ? `url(${profile.image}) center/cover` : avatarBgColor}}>
                                        {!profile.image && initials}
                                    </div>
                                    {profile.isAvailable && <div className="availability-badge">⚡ Available</div>}
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
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        color: '#eab308',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        ⭐ {profile.rating || '4.8'}
                                    </span>
                                    <div className="preview-socials" style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
                                        {profile.email && <a href={`mailto:${profile.email}`} className="preview-social-icon-raw">✉️</a>}
                                        {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="preview-social-icon-raw">in</a>}
                                        <div className="preview-social-icon-raw pointer" title="Share" style={{ color: '#475569' }} onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({ title: profile.name, text: profile.role, url: window.location.href }).catch(() => {});
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

                            <div className="preview-title-row" style={{marginBottom: '0.2rem'}}>
                                <h3 style={{fontSize: '2rem'}}>{profile.name}</h3>
                            </div>

                                <div className="preview-subtitle" style={{color: '#64748b', marginBottom: '1.5rem', fontSize: '1.05rem'}}>
                                    {profile.role} @ {profile.company} {profile.topics ? `| ${profile.topics}` : ''}
                                </div>

                                <div className="preview-badges">
                                <div className="preview-badge" style={{background: 'white', border: '1px solid #e2e8f0', color: '#64748b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>💼 {profile.experience ? (profile.experience.toLowerCase().includes('year') ? profile.experience : `${profile.experience} Years of experience`) : '4 Years of experience'}</div>
                                </div>

                                {/* Main Tabs (Visible on Mobile) */}
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
                                        <h4 style={{color: '#1e1b4b'}}>👤 About Mentor</h4>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header" onClick={() => toggleAccordion('about')} style={{cursor: 'pointer'}}>About <span>{expandedSections.about ? '^' : 'v'}</span></div>
                                            {expandedSections.about && (
                                                <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                                    {profile.bio || "No about added yet."}
                                                </div>
                                            )}
                                        </div>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header" onClick={() => toggleAccordion('topics')} style={{cursor: 'pointer'}}>Topics of Expertise <span>{expandedSections.topics ? '^' : 'v'}</span></div>
                                            {expandedSections.topics && (
                                                <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                                    {profile.topics || "No topics added yet."}
                                                </div>
                                            )}
                                        </div>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header" onClick={() => toggleAccordion('education')} style={{cursor: 'pointer'}}>Education <span>{expandedSections.education ? '^' : 'v'}</span></div>
                                            {expandedSections.education && (
                                                <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                                    {profile.education || "No education added yet."}
                                                </div>
                                            )}
                                        </div>
                                        <div className="preview-accordion">
                                            <div className="preview-accordion-header" onClick={() => toggleAccordion('work')} style={{cursor: 'pointer'}}>Work Experience <span>{expandedSections.work ? '^' : 'v'}</span></div>
                                            {expandedSections.work && (
                                                <div style={{fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word'}}>
                                                    {profile.workExperience || "No work experience added yet."}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`preview-section-right ${mainTab === 'Services' ? 'tab-visible' : 'tab-hidden'}`}>
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
                                                        <button 
                                                            className="preview-book-btn"
                                                            onClick={() => setBookingData({ pro: profile, service: { title: '1:1 Call Mentorship' } })}
                                                        >
                                                            Book Now
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {(activeServiceTab === 'All' || activeServiceTab === 'Resume Review') && (
                                                <div className="preview-service-card">
                                                    <div className="preview-service-tag" style={{background: '#e0e7ff', color: '#4338ca'}}>📝 FEEDBACK</div>
                                                    <div className="preview-service-title">Resume Review</div>
                                                    <div className="preview-service-footer">
                                                        <div className="preview-service-price">₹199</div>
                                                        <button 
                                                            className="preview-book-btn" 
                                                            style={{background: '#0f172a'}}
                                                            onClick={() => setBookingData({ pro: profile, service: { title: 'Resume Review' } })}
                                                        >
                                                            Book Now
                                                        </button>
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
            
            {bookingData && (
                <BookingModal 
                    pro={bookingData.pro} 
                    service={bookingData.service} 
                    onClose={() => setBookingData(null)} 
                />
            )}
            </div>
        </div>
    );
}

export default MentorDashboard;
