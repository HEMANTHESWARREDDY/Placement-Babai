import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import './AdminMentors.css';

function AdminMentors() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState(() => localStorage.getItem('adminMentorsTab') || 'PENDING');
    const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 });

    useEffect(() => {
        fetchCounts();
        fetchMentors();
    }, [activeSubTab]);

    const fetchCounts = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/api/admin/mentors/counts`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) {
                const data = await res.json();
                setCounts(data);
            }
        } catch (error) {
            console.error('Error fetching counts:', error);
        }
    };

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            
            // If tab is APPROVED, fetch from Mentors table
            // If tab is PENDING or REJECTED, fetch from MentorApplicant table (applications endpoint needs to return all, or we fetch applications)
            // But wait, our backend `/api/admin/mentors/applications` only returns PENDING.
            // Let's change the endpoint logic slightly, or we can just fetch both if REJECTED.
            // Let's modify the frontend to always filter client-side:
            
            let data = [];
            if (activeSubTab === 'APPROVED') {
                const res = await fetch(`${API_BASE_URL}/api/admin/mentors`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) data = await res.json();
                setMentors(data.filter(m => m.status === 'APPROVED'));
            } else if (activeSubTab === 'PENDING') {
                const res = await fetch(`${API_BASE_URL}/api/admin/mentors/applications`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) data = await res.json();
                setMentors(data.filter(m => m.status === 'PENDING'));
            } else if (activeSubTab === 'REJECTED') {
                // Rejected can be in both tables
                const res1 = await fetch(`${API_BASE_URL}/api/admin/mentors`, { headers: { 'Authorization': `Bearer ${token}` } });
                const res2 = await fetch(`${API_BASE_URL}/api/admin/mentors/applications/all`, { headers: { 'Authorization': `Bearer ${token}` } });
                let data1 = [], data2 = [];
                if (res1.ok) data1 = await res1.json();
                if (res2.ok) data2 = await res2.json();
                
                const allData = [...data1, ...data2];
                setMentors(allData.filter(m => m.status === 'REJECTED'));
            }
        } catch (error) {
            console.error('Error fetching mentors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this application as ${newStatus}?`)) return;

        setIsUpdating(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/api/admin/mentors/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Remove from current view
                setMentors(prev => prev.filter(m => m.id !== id));
                fetchCounts(); // Refresh counts
            } else {
                alert('Failed to update status.');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('An error occurred.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to fully delete this mentor? This cannot be undone.`)) return;

        setIsUpdating(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/api/admin/mentors/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setMentors(prev => prev.filter(m => m.id !== id));
                fetchCounts(); // Refresh counts
            } else {
                alert('Failed to delete mentor.');
            }
        } catch (error) {
            console.error('Error deleting mentor:', error);
            alert('An error occurred.');
        } finally {
            setIsUpdating(false);
        }
    };

    const [selectedMentor, setSelectedMentor] = useState(null);

    const MentorDetailModal = ({ mentor, onClose }) => {
        if (!mentor) return null;
        return (
            <div className="mentor-modal-overlay" onClick={onClose}>
                <div className="mentor-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="mentor-modal-header">
                        <h3>Mentor Details</h3>
                        <button className="close-modal" onClick={onClose}>×</button>
                    </div>
                    <div className="mentor-modal-body">
                        <div className="modal-section">
                            <label>Name</label>
                            <p className="modal-name">{mentor.name}</p>
                        </div>
                        <div className="modal-section">
                            <label>Role & Company</label>
                            <p>{mentor.role} @ {mentor.company}</p>
                        </div>
                        <div className="modal-section">
                            <label>Experience</label>
                            <p>{mentor.experience} Years</p>
                        </div>
                        <div className="modal-section">
                            <label>Contact Info</label>
                            <p>{mentor.email}</p>
                            {mentor.phone && <p>{mentor.phone}</p>}
                            <a href={mentor.linkedin} target="_blank" rel="noreferrer" className="mentor-link">LinkedIn Profile ↗</a>
                        </div>
                        <div className="modal-section">
                            <label>Bio</label>
                            <p className="modal-bio">{mentor.bio}</p>
                        </div>
                        <div className="modal-section">
                            <label>Skills</label>
                            <div className="mentor-skills-tags">
                                {mentor.skills.split(',').map((s, i) => (
                                    <span key={i} className="mentor-skill-tag">{s.trim()}</span>
                                ))}
                            </div>
                        </div>
                        <div className="modal-section">
                            <label>Submitted On</label>
                            <p>{new Date(mentor.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="mentor-modal-footer">
                        <div className="mentor-actions">
                            {activeSubTab === 'PENDING' && (
                                <>
                                    <button className="btn-approve" onClick={() => { handleUpdateStatus(mentor.id, 'APPROVED'); onClose(); }} disabled={isUpdating}>Approve</button>
                                    <button className="btn-reject" onClick={() => { handleUpdateStatus(mentor.id, 'REJECTED'); onClose(); }} disabled={isUpdating}>Reject</button>
                                </>
                            )}
                            {activeSubTab === 'APPROVED' && (
                                <button className="btn-reject" onClick={() => { handleUpdateStatus(mentor.id, 'REJECTED'); onClose(); }} disabled={isUpdating}>Revoke</button>
                            )}
                            {activeSubTab === 'REJECTED' && (
                                <button className="btn-approve" onClick={() => { handleUpdateStatus(mentor.id, 'APPROVED'); onClose(); }} disabled={isUpdating}>Re-Approve</button>
                            )}
                            <button className="btn-delete-hard" onClick={() => { handleDelete(mentor.id); onClose(); }} disabled={isUpdating}>Delete Permanently</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="admin-mentors-container">
            <div className="admin-mentors-header">
                <h2>Mentor Management</h2>
                <div className="mentor-subtabs">
                    <button
                        className={`mentor-subtab ${activeSubTab === 'PENDING' ? 'active' : ''}`}
                        onClick={() => { setActiveSubTab('PENDING'); localStorage.setItem('adminMentorsTab', 'PENDING'); }}
                    >
                        Pending Applications ({counts.PENDING})
                    </button>
                    <button
                        className={`mentor-subtab ${activeSubTab === 'APPROVED' ? 'active' : ''}`}
                        onClick={() => { setActiveSubTab('APPROVED'); localStorage.setItem('adminMentorsTab', 'APPROVED'); }}
                    >
                        Approved Mentors ({counts.APPROVED})
                    </button>
                    <button
                        className={`mentor-subtab ${activeSubTab === 'REJECTED' ? 'active' : ''}`}
                        onClick={() => { setActiveSubTab('REJECTED'); localStorage.setItem('adminMentorsTab', 'REJECTED'); }}
                    >
                        Rejected ({counts.REJECTED})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading mentors...</div>
            ) : mentors.length === 0 ? (
                <div className="no-mentors">
                    No mentors found in {activeSubTab} state.
                </div>
            ) : (
                <div className="mentors-table-container">
                    <table className="mentors-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role & Company</th>
                                <th>Experience</th>
                                <th>Contact / Links</th>
                                <th>Bio & Skills</th>
                                <th>Submitted On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mentors.map(mentor => (
                                <tr key={mentor.id} onClick={() => window.innerWidth <= 768 && setSelectedMentor(mentor)} className="mentor-row-clickable">
                                    <td data-label="Name">
                                        <strong>{mentor.name}</strong>
                                        <div className="mobile-only-hint">Click to view details</div>
                                    </td>
                                    <td data-label="Role & Company">
                                        <div style={{ fontWeight: '600' }}>{mentor.role}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>@ {mentor.company}</div>
                                    </td>
                                    <td data-label="Experience">{mentor.experience} Years</td>
                                    <td data-label="Contact / Links">
                                        <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>{mentor.email}</div>
                                        {mentor.phone && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{mentor.phone}</div>}
                                        <a href={mentor.linkedin} target="_blank" rel="noreferrer" className="mentor-link">
                                            LinkedIn ↗
                                        </a>
                                    </td>
                                    <td data-label="Bio & Skills">
                                        <div className="mentor-bio-text" title={mentor.bio}>{mentor.bio}</div>
                                        <div className="mentor-skills-tags">
                                            {mentor.skills.split(',').slice(0, 3).map((s, i) => (
                                                <span key={i} className="mentor-skill-tag">{s.trim()}</span>
                                            ))}
                                            {mentor.skills.split(',').length > 3 && <span className="mentor-skill-tag">+{mentor.skills.split(',').length - 3}</span>}
                                        </div>
                                    </td>
                                    <td data-label="Submitted On">
                                        {new Date(mentor.createdAt).toLocaleDateString()}
                                    </td>
                                    <td data-label="Actions" className="mentor-actions">
                                        {activeSubTab === 'PENDING' && (
                                            <>
                                                <button
                                                    className="btn-approve"
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(mentor.id, 'APPROVED'); }}
                                                    disabled={isUpdating}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn-reject"
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(mentor.id, 'REJECTED'); }}
                                                    disabled={isUpdating}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {activeSubTab === 'APPROVED' && (
                                            <button
                                                className="btn-reject"
                                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(mentor.id, 'REJECTED'); }}
                                                disabled={isUpdating}
                                            >
                                                Revoke
                                            </button>
                                        )}
                                        {activeSubTab === 'REJECTED' && (
                                            <button
                                                className="btn-approve"
                                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(mentor.id, 'APPROVED'); }}
                                                disabled={isUpdating}
                                            >
                                                Re-Approve
                                            </button>
                                        )}
                                        <button
                                            className="btn-delete-hard"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(mentor.id); }}
                                            disabled={isUpdating}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedMentor && <MentorDetailModal mentor={selectedMentor} onClose={() => setSelectedMentor(null)} />}
        </div>
    );
}


export default AdminMentors;
