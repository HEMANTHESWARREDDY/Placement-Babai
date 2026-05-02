import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import './AdminSessions.css';

const EMPTY_SESSION = {
    title: '',
    description: '',
    link: '',
    schedule: '',
    active: true,
    sessionDate: new Date().toISOString().split('T')[0]
};

function AdminSessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [formData, setFormData] = useState(EMPTY_SESSION);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchSessions();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchSessions = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/sessions`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingSession 
                ? `${API_BASE_URL}/api/sessions/${editingSession.id}`
                : `${API_BASE_URL}/api/sessions`;
            const method = editingSession ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchSessions();
                resetForm();
                showToast(editingSession ? 'Session updated!' : 'Session created!', 'success');
            } else {
                let errorMsg = 'Failed to save session';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || (errorData.errors ? Object.values(errorData.errors).join(', ') : 'Failed to save session');
                } catch (e) {
                    errorMsg = `Error ${response.status}: ${response.statusText}`;
                }
                showToast(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Error saving session:', error);
            showToast(`Connection Error: ${error.message}`, 'error');
        }
    };

    const handleEdit = (session) => {
        setEditingSession(session);
        setFormData({ ...session });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this session?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchSessions();
                showToast('Session deleted successfully', 'success');
            } else {
                showToast('Failed to delete session', 'error');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            showToast('Error deleting session', 'error');
        }
    };

    const resetForm = () => {
        setFormData(EMPTY_SESSION);
        setEditingSession(null);
        setShowForm(false);
    };

    return (
        <div className="admin-sessions">
            {toast.show && (
                <div className={`admin-toast admin-toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}

            <div className="sessions-header-admin">
                <div>
                    <h2>📅 Manage Free Sessions</h2>
                    <p>Add, edit, or remove mentorship sessions visible to users.</p>
                </div>
                <button className="btn-primary" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
                    {showForm ? '✕ Cancel' : '+ Add New Session'}
                </button>
            </div>

            {showForm && (
                <div className="session-form-container">
                    <form className="admin-session-form" onSubmit={handleSubmit}>
                        <h3>{editingSession ? '✏️ Edit Session' : '➕ Create New Session'}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Session Title</label>
                                <input name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Daily Mock Interview Call" />
                            </div>
                            <div className="form-group">
                                <label>Schedule / Time</label>
                                <input name="schedule" value={formData.schedule} onChange={handleInputChange} placeholder="e.g. 7 PM IST" />
                            </div>
                             <div className="form-group">
                                <label>Session Date</label>
                                <input type="date" name="sessionDate" value={formData.sessionDate} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} required placeholder="Briefly explain what users will learn..." rows="3" />
                            </div>
                            <div className="form-group full-width">
                                <label>Meeting Link (Google Meet / Zoom)</label>
                                <input name="link" value={formData.link} onChange={handleInputChange} required placeholder="https://meet.google.com/..." />
                            </div>
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} />
                                    <span>Set as Active (Visible on Interview Prep page)</span>
                                </label>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn-submit-primary">
                                {editingSession ? 'Update Session' : 'Create Session'}
                            </button>
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
                                <th>Schedule</th>
                                <th>Meeting Link</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.length > 0 ? (
                                sessions.map(session => (
                                    <tr key={session.id}>
                                        <td>
                                            <span className={`status-pill ${session.active ? 'active' : 'inactive'}`}>
                                                {session.active ? 'Live' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="cell-details">
                                                <strong>{session.title}</strong>
                                                <p>{session.description}</p>
                                            </div>
                                        </td>
                                        <td><span className="schedule-tag">{session.schedule || 'Flexible'}</span></td>
                                        <td>
                                            <a href={session.link} target="_blank" rel="noreferrer" className="link-preview">
                                                🔗 Open Link
                                            </a>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-edit-sm" onClick={() => handleEdit(session)} title="Edit">✏️</button>
                                                <button className="btn-delete-sm" onClick={() => handleDelete(session.id)} title="Delete">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="empty-row">No sessions found. Create one to get started!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminSessions;
