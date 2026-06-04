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
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [formData, setFormData] = useState(EMPTY_SESSION);
    const [viewMode, setViewMode] = useState('active'); // 'active', 'expired', 'deleted'
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [formErrors, setFormErrors] = useState({});
    const [selectedSession, setSelectedSession] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null, confirmText: 'Delete' });

    useEffect(() => {
        fetchSessions();
    }, [viewMode]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
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
                        const activeOnly = data.filter(s => (s.sessionDate >= todayStr && s.active));
                        setSessions(activeOnly);
                    } else {
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
        if (!formData.schedule.trim()) errors.schedule = "Time/Schedule is required";
        if (!formData.description.trim()) errors.description = "Description is required";
        if (!formData.link.trim()) {
            errors.link = "Meeting link is required";
        } else if (!formData.link.startsWith('http')) {
            errors.link = "Link must start with http:// or https://";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            showToast('Please fix the errors in the form', 'error');
            return;
        }

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
                showToast(editingSession ? 'Session updated!' : 'Session created!', 'success');
            } else {
                showToast('Failed to save session', 'error');
            }
        } catch (error) {
            showToast(`Connection Error`, 'error');
        }
    };

    const handleEdit = (session) => {
        setEditingSession(session);
        setFormData({ ...session });
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

    const handleRestore = async (session) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/api/sessions/restore/${session.id}`, { 
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const now = new Date();
                const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
                
                if (session.sessionDate < todayStr) {
                    setConfirmDialog({
                        show: true,
                        title: 'Unable to Activate',
                        message: 'This session date is in the past. Please update the date to make it live again.',
                        confirmText: 'Update Now',
                        onConfirm: () => {
                            handleEdit(session);
                            setConfirmDialog(prev => ({ ...prev, show: false }));
                        }
                    });
                } else {
                    showToast('Session restored successfully');
                }
                fetchSessions();
            } else {
                showToast(`Restore failed`, 'error');
            }
        } catch (error) {
            showToast('Restore failed', 'error');
        }
    };

    const resetForm = () => {
        setFormData(EMPTY_SESSION);
        setEditingSession(null);
        setShowForm(false);
        setFormErrors({});
    };

    const ConfirmModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Delete' }) => {
        if (!show) return null;
        const isUpdate = confirmText === 'Update Now';
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
                            className="btn-delete-text" 
                            style={{ 
                                padding: '0.6rem 1.2rem', 
                                borderRadius: '6px', 
                                background: isUpdate ? '#3b82f6' : '#ef4444', 
                                color: 'white' 
                            }} 
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
                                    <button className="btn-edit-text" style={{ color: '#10b981', borderColor: '#10b981' }} onClick={() => { handleRestore(session); onClose(); }}>🔄 Restore Session</button>
                                    <button className="btn-delete-text" onClick={() => { handleDelete(session.id); onClose(); }}>🗑️ Delete Session</button>
                                </>
                            )}
                            {viewMode === 'deleted' && (
                                <>
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

    return (
        <div className="admin-sessions">
            {toast.show && (
                <div className={`admin-toast admin-toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}

            <div className="sessions-header-admin">
                <div className="header-title-area">
                    <h2>Manage Free Sessions</h2>
                    <p>Add, edit, or remove mentorship sessions visible to users.</p>
                </div>
                <div className="header-actions-area">
                    <div className="view-mode-tabs">
                        <button className={`mode-btn ${viewMode === 'active' ? 'active' : ''}`} onClick={() => setViewMode('active')}>📋 Active</button>
                        <button className={`mode-btn ${viewMode === 'expired' ? 'active' : ''}`} onClick={() => setViewMode('expired')}>⌛ Expired</button>
                        <button className={`mode-btn ${viewMode === 'deleted' ? 'active' : ''}`} onClick={() => setViewMode('deleted')}>🗑️ Deleted</button>
                    </div>
                    <button className="btn-add-primary" onClick={() => { setShowForm(true); setEditingSession(null); setFormData(EMPTY_SESSION); }}>
                        + Add New
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="session-form-container">
                    <form className="admin-session-form" onSubmit={handleSubmit}>
                        <h3>{editingSession ? '✏️ Edit Session' : '➕ Create New Session'}</h3>
                        <div className="form-grid-sessions">
                            <div className="form-row-3">
                                <div className="form-group">
                                    <label>Session Title <span className="required-star">*</span></label>
                                    <input name="title" className={formErrors.title ? 'error' : ''} value={formData.title} onChange={handleInputChange} required placeholder="e.g. Daily Mock Interview Call" />
                                    {formErrors.title && <span className="field-error">{formErrors.title}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Session Date <span className="required-star">*</span></label>
                                    <input type="date" className={formErrors.sessionDate ? 'error' : ''} name="sessionDate" value={formData.sessionDate} onChange={handleInputChange} required />
                                    {formErrors.sessionDate && <span className="field-error">{formErrors.sessionDate}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Schedule / Time <span className="required-star">*</span></label>
                                    <input name="schedule" className={formErrors.schedule ? 'error' : ''} value={formData.schedule} onChange={handleInputChange} required placeholder="e.g. 7 PM IST" />
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
                                <div className="form-group checkbox-group-minimal">
                                    <label className="checkbox-label">
                                        <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} />
                                        <span>Set as Active (Visible to Users)</span>
                                    </label>
                                </div>
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
                                <th>Status</th>
                                <th>Session Details</th>
                                <th>ID</th>
                                <th>Created At</th>
                                <th>Date</th>
                                <th>Schedule</th>
                                <th>Meeting Link</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.length > 0 ? (
                                sessions.map(session => (
                                    <tr key={session.id} onClick={() => window.innerWidth <= 768 && setSelectedSession(session)} className="mentor-row-clickable">
                                        <td data-label="Status">
                                            {(() => {
                                                const now = new Date();
                                                const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
                                                if (session.sessionDate < todayStr) {
                                                    return <span className="status-pill inactive" style={{ background: '#475569', color: 'white' }}>Completed</span>;
                                                }
                                                return (
                                                    <span className={`status-pill ${session.active ? 'active' : 'inactive'}`}>
                                                        {session.active ? 'Live' : 'Hidden'}
                                                    </span>
                                                );
                                            })()}
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
                                        <td data-label="ID">
                                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>
                                                {session.id}
                                            </span>
                                        </td>
                                        <td data-label="Created At">
                                            <span className="date-tag" style={{ background: '#f1f5f9', color: '#475569' }}>
                                                {session.createdAt ? new Date(session.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
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
                                                        <button className="btn-edit-text" style={{ color: '#10b981', borderColor: '#10b981' }} onClick={(e) => { e.stopPropagation(); handleRestore(session); }}>🔄 Restore</button>
                                                        <button className="btn-delete-text" onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}>🗑️ Delete</button>
                                                    </>
                                                )}
                                                {viewMode === 'deleted' && (
                                                    <>
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
                                    <td colSpan="8" className="empty-row">
                                        {loading ? 'Loading...' : `No ${viewMode === 'active' ? 'active' : 'expired'} sessions found.`}
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
        </div>
    );
}

export default AdminSessions;
