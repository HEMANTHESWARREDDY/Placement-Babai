import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import './AdminSessions.css';

const EMPTY_SESSION = {
    title: '',
    description: '',
    link: '',
    schedule: '',
    skills: '',
    active: true,
    sessionDate: new Date().toISOString().split('T')[0]
};

function AdminSessions() {
    const formatDateTime = (dateVal) => {
        if (!dateVal) return '—';
        let str = dateVal;
        if (typeof str === 'string' && !str.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(str)) {
            str = str + 'Z';
        }
        try {
            return new Date(str).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return dateVal;
        }
    };

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [formData, setFormData] = useState(EMPTY_SESSION);
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('adminSessionsViewMode') || 'active'); // 'active', 'expired', 'deleted'
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [formErrors, setFormErrors] = useState({});
    const [selectedSession, setSelectedSession] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null, confirmText: 'Delete' });
    const [searchQuery, setSearchQuery] = useState('');
    const [restoreExpiredSession, setRestoreExpiredSession] = useState(null);
    const [newSessionDate, setNewSessionDate] = useState('');
    const [restoreHour, setRestoreHour] = useState('');
    const [restoreMinute, setRestoreMinute] = useState('00');
    const [restoreAmPm, setRestoreAmPm] = useState('AM');
    const [scheduleHour, setScheduleHour] = useState('');
    const [scheduleMinute, setScheduleMinute] = useState('00');
    const [scheduleAmPm, setScheduleAmPm] = useState('AM');

    useEffect(() => {
        fetchSessions();
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('adminSessionsViewMode', viewMode);
    }, [viewMode]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const isSessionExpired = (session) => {
        const now = new Date();
        // Compare full datetime: sessionDate is YYYY-MM-DD, so sessions on today
        // are expired only if today's date has already passed (date strictly less than today)
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        return session.sessionDate < todayStr;
    };

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const now = new Date();
            const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

            if (viewMode === 'deleted') {
                const res = await fetch(`${API_BASE_URL}/api/sessions/deleted`);
                if (res.ok) setSessions(await res.json());
            } else {
                const res = await fetch(`${API_BASE_URL}/api/sessions`);
                if (res.ok) {
                    const data = await res.json();
                    if (viewMode === 'active') {
                        // Active: sessionDate >= today AND active flag is true
                        const activeOnly = data.filter(s => s.sessionDate >= todayStr && s.active);
                        setSessions(activeOnly);
                    } else {
                        // Expired: sessionDate is strictly in the past
                        const pastSessions = data.filter(s => s.sessionDate < todayStr);
                        setSessions(pastSessions);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            showToast('Failed to fetch sessions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.title.trim()) errors.title = "Session title is required";
        if (!formData.sessionDate) errors.sessionDate = "Date is required";
        if (!scheduleHour) errors.schedule = "Please select a session time (HH : MM : AM/PM)";
        if (!formData.description.trim()) errors.description = "Description is required";
        if (!formData.link.trim()) {
            errors.link = "Meeting link is required";
        } else if (!formData.link.startsWith('http')) {
            errors.link = "Link must start with http:// or https://";
        }

        // When editing an expired session (coming from expired/deleted view),
        // force admin to pick a future date — the form cleared sessionDate to ''
        if (editingSession && isSessionExpired(editingSession)) {
            const now = new Date();
            const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            if (!formData.sessionDate || formData.sessionDate < todayStr) {
                errors.sessionDate = "Session date must be today or a future date to reactivate this session";
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validateForm()) {
            showToast('Please fix the errors in the form', 'error');
            return;
        }

        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const isPast = formData.sessionDate < todayStr;

        const proceedWithSave = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const url = editingSession 
                    ? `${API_BASE_URL}/api/sessions/${editingSession.id}`
                    : `${API_BASE_URL}/api/sessions`;
                const method = editingSession ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    fetchSessions();
                    resetForm();
                    
                    if (isPast) {
                        showToast('Session successfully sent to expiry!', 'success');
                    } else {
                        showToast(editingSession ? 'Session updated successfully!' : 'Session created successfully!', 'success');
                    }
                } else {
                    showToast('Failed to save session', 'error');
                }
            } catch (error) {
                showToast(`Connection Error`, 'error');
            }
        };

        const isEditingActiveSession = editingSession && editingSession.sessionDate >= todayStr && editingSession.active;
        if (isPast && (isEditingActiveSession || !editingSession)) {
            setConfirmDialog({
                show: true,
                title: 'Caution: Session Date in Past',
                message: `Caution: Setting the session date to ${formData.sessionDate} (which is in the past) will move this session to the Expired tab. Do you want to proceed?`,
                confirmText: 'Save Anyway',
                onConfirm: () => {
                    proceedWithSave();
                    setConfirmDialog(prev => ({ ...prev, show: false }));
                }
            });
        } else {
            proceedWithSave();
        }
    };

    const handleEdit = (session) => {
        // If editing from expired/deleted view, warn admin that date must be updated
        const expired = isSessionExpired(session);
        if (expired) {
            showToast(
                `⚠️ Warning: "${session.title}" has an expired session date (${session.sessionDate}). Please update the Session Date and Schedule/Time to a future date to make it active again.`,
                'error'
            );
        }
        setEditingSession(session);
        // If expired, clear the date so admin is forced to pick a new one
        setFormData({ ...session, sessionDate: expired ? '' : session.sessionDate });

        // Try to parse existing schedule like "7 PM IST" or "4:30 AM IST" into dropdowns
        const sched = session.schedule || '';
        const timeMatch = sched.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
        if (timeMatch) {
            setScheduleHour(String(parseInt(timeMatch[1], 10)));
            setScheduleMinute(timeMatch[2] || '00');
            setScheduleAmPm(timeMatch[3].toUpperCase());
        } else {
            setScheduleHour('');
            setScheduleMinute('00');
            setScheduleAmPm('AM');
        }

        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        const isPerm = viewMode === 'deleted';
        setConfirmDialog({
            show: true,
            title: isPerm ? 'Permanent Deletion' : 'Delete Session',
            message: isPerm 
                ? 'Are you sure you want to delete this forever?' 
                : 'Are you sure you want to delete this session?',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    const token = localStorage.getItem('adminToken');
                    const endpoint = isPerm ? `/api/sessions/permanent/${id}` : `/api/sessions/${id}`;
                    const res = await fetch(`${API_BASE_URL}${endpoint}`, { 
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        showToast(isPerm ? 'Permanently deleted' : 'Moved to deleted');
                        fetchSessions();
                    } else {
                        showToast(`Action failed`, 'error');
                    }
                } catch (error) {
                    showToast('Action failed', 'error');
                }
                setConfirmDialog(prev => ({ ...prev, show: false }));
            }
        });
    };

    const handleRestore = (session) => {
        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        
        if (session.sessionDate < todayStr) {
            showToast('Error: Cannot restore expired session. Session date must be set to today or a future date.', 'error');
            setRestoreExpiredSession(session);
            setNewSessionDate('');
            // Pre-parse existing schedule into dropdowns
            const sched = session.schedule || '';
            const timeMatch = sched.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
            if (timeMatch) {
                setRestoreHour(String(parseInt(timeMatch[1], 10)));
                setRestoreMinute(timeMatch[2] ? timeMatch[2].padStart(2, '0') : '00');
                setRestoreAmPm(timeMatch[3].toUpperCase());
            } else {
                setRestoreHour('');
                setRestoreMinute('00');
                setRestoreAmPm('AM');
            }
            return;
        }

        setConfirmDialog({
            show: true,
            title: 'Restore Session',
            message: 'Are you sure you want to restore this session?',
            confirmText: 'Confirm',
            onConfirm: async () => {
                try {
                    const token = localStorage.getItem('adminToken');
                    const res = await fetch(`${API_BASE_URL}/api/sessions/restore/${session.id}`, { 
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        showToast('Session restored successfully', 'success');
                        fetchSessions();
                    } else {
                        showToast('Restore failed', 'error');
                    }
                } catch (error) {
                    showToast('Restore failed', 'error');
                }
                setConfirmDialog(prev => ({ ...prev, show: false }));
            }
        });
    };

    const resetForm = () => {
        setFormData(EMPTY_SESSION);
        setEditingSession(null);
        setShowForm(false);
        setFormErrors({});
        setScheduleHour('');
        setScheduleMinute('00');
        setScheduleAmPm('AM');
    };

    const ConfirmModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Delete' }) => {
        if (!show) return null;
        return (
            <div className="mentor-modal-overlay" style={{ zIndex: 2000 }}>
                <div className="mentor-modal-content confirm-modal-box" style={{ maxWidth: '450px' }}>
                    <div className="mentor-modal-header">
                        <h3>{title}</h3>
                        <button className="close-modal" onClick={onCancel}>×</button>
                    </div>
                    <div className="mentor-modal-body">
                        <p style={{ fontSize: '1rem', color: '#475569', lineHeight: '1.5' }}>{message}</p>
                    </div>
                    <div className="mentor-modal-footer" style={{ gap: '1rem', display: 'flex', justifyContent: 'flex-end', padding: '1.5rem' }}>
                        <button className="btn-secondary-sm" onClick={onCancel}>Cancel</button>
                        <button 
                            className="btn-confirm-danger"
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const SessionDetailModal = ({ session, onClose }) => {
        if (!session) return null;
        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const isCompleted = session.sessionDate < todayStr;

        return (
            <div className="mentor-modal-overlay" onClick={onClose}>
                <div className="mentor-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="mentor-modal-header">
                        <h3>Session Details</h3>
                        <button className="close-modal" onClick={onClose}>×</button>
                    </div>
                    <div className="mentor-modal-body">
                        <div className="modal-section">
                            <label>Status</label>
                            {isCompleted ? (
                                <span className="status-pill inactive" style={{ background: '#475569', color: 'white' }}>Completed</span>
                            ) : (
                                <span className={`status-pill ${session.active ? 'active' : 'inactive'}`}>
                                    {session.active ? 'Live' : 'Hidden'}
                                </span>
                            )}
                        </div>
                        <div className="modal-section">
                            <label>Title</label>
                            <p className="modal-name">{session.title}</p>
                        </div>
                        <div className="modal-section">
                            <label>Description</label>
                            <p className="modal-bio">{session.description}</p>
                        </div>
                        <div className="modal-section">
                            <label>Date & Schedule</label>
                            <p>📅 {session.sessionDate} | ⏰ {session.schedule}</p>
                        </div>
                        <div className="modal-section">
                            <label>Meeting Link</label>
                            <a href={session.link} target="_blank" rel="noreferrer" className="mentor-link">Open Session Link ↗</a>
                        </div>
                        {session.skills && (
                            <div className="modal-section">
                                <label>Skills to be Gained</label>
                                <p>{session.skills}</p>
                            </div>
                        )}
                    </div>
                    <div className="mentor-modal-footer">
                        <div className="action-btns-vertical">
                            {viewMode === 'active' && (
                                <>
                                    <button className="btn-edit-text" onClick={() => { handleEdit(session); onClose(); }}>✏️ Edit Session</button>
                                    <button className="btn-delete-text" onClick={() => { handleDelete(session.id); onClose(); }}>🗑️ Delete Session</button>
                                </>
                            )}
                            {viewMode === 'expired' && (
                                <>
                                <button className="btn-edit-text" onClick={(e) => { e.stopPropagation(); handleEdit(session); }}>✏️ Edit</button>
                                    <button className="btn-edit-text" style={{ color: '#10b981', borderColor: '#10b981' }} onClick={() => { handleRestore(session); onClose(); }}>🔄 Restore Session</button>
                                    <button className="btn-delete-text" onClick={() => { handleDelete(session.id); onClose(); }}>🗑️ Delete Session</button>
                                </>
                            )}
                            {viewMode === 'deleted' && (
                                <>
                                <button className="btn-edit-text" onClick={(e) => { e.stopPropagation(); handleEdit(session); }}>✏️ Edit</button>
                                    <button className="btn-edit-text" style={{ color: '#10b981', borderColor: '#10b981' }} onClick={() => { handleRestore(session); onClose(); }}>🔄 Restore Session</button>
                                    <button className="btn-delete-text" onClick={() => { handleDelete(session.id); onClose(); }}>🔥 Permanent Delete</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const filteredSessions = sessions.filter(session => {
        if (!searchQuery) return true;
        const sq = searchQuery.toLowerCase();
        return (
            (session.id && String(session.id).includes(sq)) ||
            (session.title && session.title.toLowerCase().includes(sq)) ||
            (session.description && session.description.toLowerCase().includes(sq)) ||
            (session.skills && session.skills.toLowerCase().includes(sq)) ||
            (session.schedule && session.schedule.toLowerCase().includes(sq))
        );
    });

    const selectStyle = {
        padding: '0.5rem 0.6rem',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '0.9rem',
        outline: 'none',
        background: 'white',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        appearance: 'auto'
    };

    return (
        <div className="admin-sessions">
            {toast.show && (
                <div className={`admin-toast admin-toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}

            <div className="sessions-header-admin">
                <div className="header-title-area">
                    <h2>Manage Free Sessions ({filteredSessions.length})</h2>
                    <p>Add, edit, or remove mentorship sessions visible to users.</p>
                </div>
                <div className="header-actions-area">
                    <div className="view-mode-tabs">
                        <button className={`mode-btn ${viewMode === 'active' ? 'active' : ''}`} onClick={() => setViewMode('active')}>📋 Active</button>
                        <button className={`mode-btn ${viewMode === 'expired' ? 'active' : ''}`} onClick={() => setViewMode('expired')}>⌛ Expired</button>
                        <button className={`mode-btn ${viewMode === 'deleted' ? 'active' : ''}`} onClick={() => setViewMode('deleted')}>🗑️ Deleted</button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by ID, title, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="admin-search-input"
                    />
                    <button className="btn-add-primary" onClick={() => { setShowForm(true); setEditingSession(null); setFormData(EMPTY_SESSION); }}>
                        + Add New
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="session-form-container">
                    <form className="admin-session-form" onSubmit={handleSubmit}>
                        <h3>{editingSession ? '✏️ Edit Session' : '➕ Create New Session'}</h3>
                        {editingSession && isSessionExpired(editingSession) && (
                            <div style={{
                                background: '#fef2f2',
                                border: '1.5px solid #ef4444',
                                borderRadius: '10px',
                                padding: '0.9rem 1.2rem',
                                marginBottom: '1.25rem',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                color: '#b91c1c',
                                fontSize: '0.9rem',
                                lineHeight: '1.5'
                            }}>
                                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>⚠️</span>
                                <div>
                                    <strong>Session Expired</strong> — The previous session date <strong>({editingSession.sessionDate})</strong> is in the past.
                                    <br/>Please set a <strong>new future date</strong> and update the <strong>Schedule / Time</strong> accordingly to make this session active again.
                                </div>
                            </div>
                        )}
                        <div className="form-grid-sessions">
                            <div className="form-row-3">
                                <div className="form-group">
                                    <label>Session Title <span className="required-star">*</span></label>
                                    <input name="title" className={formErrors.title ? 'error' : ''} value={formData.title} onChange={handleInputChange} required placeholder="e.g. Daily Mock Interview Call" />
                                    {formErrors.title && <span className="field-error">{formErrors.title}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Session Date <span className="required-star">*</span></label>
                                    <input 
                                        type="date" 
                                        className={formErrors.sessionDate ? 'error' : ''} 
                                        name="sessionDate" 
                                        value={formData.sessionDate} 
                                        onChange={handleInputChange} 
                                        required 
                                        {...(editingSession && isSessionExpired(editingSession) ? { min: new Date().toISOString().split('T')[0] } : {})}
                                        style={editingSession && isSessionExpired(editingSession) ? { borderColor: '#ef4444', boxShadow: '0 0 0 2px rgba(239,68,68,0.2)' } : {}}
                                    />
                                    {formErrors.sessionDate && <span className="field-error">{formErrors.sessionDate}</span>}
                                    {editingSession && isSessionExpired(editingSession) && !formData.sessionDate && (
                                        <span className="field-error">Please set a new future session date</span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Schedule / Time <span className="required-star">*</span></label>
                                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={2}
                                            placeholder="HH"
                                            value={scheduleHour}
                                            className={formErrors.schedule ? 'error' : ''}
                                            onChange={(e) => {
                                                // Strip non-digits, max 2 chars, clamp 1-12
                                                let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                                if (val !== '' && parseInt(val, 10) > 12) val = '12';
                                                if (val !== '' && parseInt(val, 10) < 1 && val.length === 2) val = '01';
                                                setScheduleHour(val);
                                                if (val) setFormData(prev => ({ ...prev, schedule: `${val}:${scheduleMinute} ${scheduleAmPm} IST` }));
                                            }}
                                            style={{ padding: '0.5rem 0.3rem', border: `1px solid ${formErrors.schedule ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', width: '52px', textAlign: 'center', outline: 'none' }}
                                        />
                                        <span style={{ fontWeight: '700', color: '#475569', fontSize: '1.1rem', flexShrink: 0 }}>:</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={2}
                                            placeholder="MM"
                                            value={scheduleMinute}
                                            onChange={(e) => {
                                                // Strip non-digits, max 2 chars, clamp 0-59
                                                let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                                if (val !== '' && parseInt(val, 10) > 59) val = '59';
                                                setScheduleMinute(val);
                                                if (scheduleHour) setFormData(prev => ({ ...prev, schedule: `${scheduleHour}:${val} ${scheduleAmPm} IST` }));
                                            }}
                                            style={{ padding: '0.5rem 0.3rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', width: '52px', textAlign: 'center', outline: 'none' }}
                                        />
                                        <select
                                            value={scheduleAmPm}
                                            onChange={(e) => {
                                                const ap = e.target.value;
                                                setScheduleAmPm(ap);
                                                if (scheduleHour) setFormData(prev => ({ ...prev, schedule: `${scheduleHour}:${scheduleMinute} ${ap} IST` }));
                                            }}
                                            style={{ padding: '0.5rem 0.25rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '700', color: '#1e40af', background: '#eff6ff', cursor: 'pointer', width: '60px' }}
                                        >
                                            <option value="AM">AM</option>
                                            <option value="PM">PM</option>
                                        </select>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', flexShrink: 0 }}>IST</span>
                                    </div>
                                    {formErrors.schedule && <span className="field-error">{formErrors.schedule}</span>}
                                </div>
                            </div>
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label>Description <span className="required-star">*</span></label>
                                    <textarea name="description" className={formErrors.description ? 'error' : ''} value={formData.description} onChange={handleInputChange} required placeholder="Briefly explain what users will learn..." rows="4" />
                                    {formErrors.description && <span className="field-error">{formErrors.description}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Skills to be Gained (Comma separated)</label>
                                    <input name="skills" value={formData.skills} onChange={handleInputChange} placeholder="e.g. Python, Data Analysis, Problem Solving" />
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Separate multiple skills with commas.</p>
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label>Meeting Link (Google Meet / Zoom) <span className="required-star">*</span></label>
                                <input name="link" className={formErrors.link ? 'error' : ''} value={formData.link} onChange={handleInputChange} required placeholder="https://meet.google.com/..." />
                                {formErrors.link && <span className="field-error">{formErrors.link}</span>}
                            </div>
                            <div className="form-footer-row">
                                <div className="footer-actions">
                                    <button type="button" className="btn-secondary-sm" onClick={resetForm}>Cancel</button>
                                    <button type="submit" className="btn-submit-primary-sm">
                                        {editingSession ? 'Update Session' : 'Create Session'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="admin-loading">Loading sessions...</div>
            ) : (
                <div className="admin-table-wrapper">
                    <table className="admin-sessions-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Session Details</th>
                                <th>Created At</th>
                                <th>Date</th>
                                <th>Schedule</th>
                                <th>Meeting Link</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSessions.length > 0 ? (
                                filteredSessions.map(session => (
                                    <tr key={session.id} onClick={() => window.innerWidth <= 768 && setSelectedSession(session)} className="mentor-row-clickable">
                                        <td data-label="ID">
                                            <strong>{session.id}</strong>
                                        </td>
                                        <td data-label="Session">
                                            <div className="cell-details">
                                                <strong>{session.title}</strong>
                                                <p className="pc-only-desc">{session.description}</p>
                                                <div className="mobile-only-hint">📅 {session.sessionDate} | ⏰ {session.schedule}</div>
                                                <div className="mobile-only-hint" style={{ color: '#0ea5e9', fontWeight: '600', marginTop: '0.2rem' }}>Click for details</div>
                                                {session.skills && (
                                                    <span className="admin-skills-preview">
                                                        <strong>Skills:</strong> {session.skills}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td data-label="Created At">
                                            <span className="date-tag" style={{ background: '#f1f5f9', color: '#475569' }}>
                                                {formatDateTime(session.createdAt)}
                                            </span>
                                        </td>
                                        <td data-label="Date"><span className="date-tag">{session.sessionDate || 'Not Set'}</span></td>
                                        <td data-label="Schedule"><span className="schedule-tag">{session.schedule || 'Flexible'}</span></td>
                                        <td data-label="Meeting Link">
                                            <a href={session.link} target="_blank" rel="noreferrer" className="link-preview">
                                                🔗 Open Link
                                            </a>
                                        </td>
                                        <td data-label="Actions">
                                            <div className="action-btns-vertical">
                                                {viewMode === 'active' && (
                                                    <>
                                                        <button className="btn-edit-text" onClick={(e) => { e.stopPropagation(); handleEdit(session); }}>✏️ Edit</button>
                                                        <button className="btn-delete-text" onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}>🗑️ Delete</button>
                                                    </>
                                                )}
                                                {viewMode === 'expired' && (
                                                    <>
                                                    <button className="btn-edit-text" onClick={(e) => { e.stopPropagation(); handleEdit(session); }}>✏️ Edit</button>
                                                        <button className="btn-edit-text" style={{ color: '#10b981', borderColor: '#10b981' }} onClick={(e) => { e.stopPropagation(); handleRestore(session); }}>🔄 Restore</button>
                                                        <button className="btn-delete-text" onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}>🗑️ Delete</button>
                                                    </>
                                                )}
                                                {viewMode === 'deleted' && (
                                                    <>
                                                    <button className="btn-edit-text" onClick={(e) => { e.stopPropagation(); handleEdit(session); }}>✏️ Edit</button>
                                                        <button className="btn-edit-text" style={{ color: '#10b981', borderColor: '#10b981' }} onClick={(e) => { e.stopPropagation(); handleRestore(session); }}>🔄 Restore</button>
                                                        <button className="btn-delete-text" onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}>🔥 Delete</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="empty-row">
                                        {loading ? 'Loading...' : searchQuery ? 'No matching sessions found.' : `No ${viewMode === 'active' ? 'active' : viewMode === 'expired' ? 'expired' : 'deleted'} sessions found.`}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedSession && <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />}
            {confirmDialog.show && (
                <ConfirmModal 
                    show={confirmDialog.show}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmText={confirmDialog.confirmText}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
                />
            )}
            {restoreExpiredSession && (
                <div className="mentor-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="mentor-modal-content confirm-modal-box" style={{ maxWidth: '450px', padding: '2rem', borderRadius: '16px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>⚠️</div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem', textAlign: 'center' }}>Session Has Expired</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem', textAlign: 'center' }}>
                            The session <strong>"{restoreExpiredSession.title}"</strong> has expired (Session Date: <strong>{restoreExpiredSession.sessionDate}</strong>). 
                            To restore this session, please set a new future session date.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>New Session Date *</label>
                                <input 
                                    type="date" 
                                    value={newSessionDate} 
                                    onChange={(e) => setNewSessionDate(e.target.value)}
                                    style={{ 
                                        padding: '0.625rem 0.75rem', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '8px',
                                        width: '100%',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        boxSizing: 'border-box'
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>Schedule / Time *</label>
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={2}
                                        placeholder="HH"
                                        value={restoreHour}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                            if (val !== '' && parseInt(val, 10) > 12) val = '12';
                                            if (val !== '' && parseInt(val, 10) < 1 && val.length === 2) val = '01';
                                            setRestoreHour(val);
                                        }}
                                        style={{ padding: '0.5rem 0.3rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', width: '52px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                    <span style={{ fontWeight: '700', color: '#475569', fontSize: '1.1rem' }}>:</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={2}
                                        placeholder="MM"
                                        value={restoreMinute}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                            if (val !== '' && parseInt(val, 10) > 59) val = '59';
                                            setRestoreMinute(val);
                                        }}
                                        style={{ padding: '0.5rem 0.3rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', width: '52px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                    <select
                                        value={restoreAmPm}
                                        onChange={(e) => setRestoreAmPm(e.target.value)}
                                        style={{ padding: '0.5rem 0.25rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '700', color: '#1e40af', background: '#eff6ff', cursor: 'pointer', width: '60px' }}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>IST</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mentor-modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '0', border: 'none' }}>
                            <button className="btn-secondary-sm" style={{ flex: 1 }} onClick={() => { setRestoreExpiredSession(null); setNewSessionDate(''); setRestoreHour(''); setRestoreMinute('00'); setRestoreAmPm('AM'); }}>Cancel</button>
                            <button 
                                className="btn-delete-text" 
                                disabled={!newSessionDate || !restoreHour}
                                style={{ 
                                    flex: 1, 
                                    backgroundColor: '#3b82f6', 
                                    color: 'white', 
                                    opacity: (!newSessionDate || !restoreHour) ? 0.6 : 1, 
                                    cursor: (!newSessionDate || !restoreHour) ? 'not-allowed' : 'pointer',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '6px'
                                }}
                                onClick={async () => {
                                    try {
                                        const token = localStorage.getItem('adminToken');
                                        const formattedSchedule = `${restoreHour}:${restoreMinute || '00'} ${restoreAmPm} IST`;
                                        const updatedSession = { 
                                            ...restoreExpiredSession, 
                                            sessionDate: newSessionDate,
                                            schedule: formattedSchedule
                                        };
                                        
                                        const updateRes = await fetch(`${API_BASE_URL}/api/sessions/${restoreExpiredSession.id}`, {
                                            method: 'PUT',
                                            headers: { 
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify(updatedSession),
                                        });
                                        
                                        if (updateRes.ok) {
                                            const restoreRes = await fetch(`${API_BASE_URL}/api/sessions/restore/${restoreExpiredSession.id}`, { 
                                                method: 'PUT', 
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (restoreRes.ok) {
                                                fetchSessions();
                                                showToast('Session updated and restored successfully!', 'success');
                                            } else {
                                                showToast('Failed to restore session after updating date', 'error');
                                            }
                                        } else {
                                            showToast('Failed to update session date', 'error');
                                        }
                                    } catch (error) {
                                        console.error('Error restoring expired session:', error);
                                        showToast('Error occurred during restore', 'error');
                                    } finally {
                                        setRestoreExpiredSession(null);
                                        setNewSessionDate('');
                                        setRestoreHour('');
                                        setRestoreMinute('00');
                                        setRestoreAmPm('AM');
                                    }
                                }}
                            >
                                Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminSessions;
