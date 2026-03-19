import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import './AdminBookings.css';

function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING', 'APPROVED', 'SCHEDULED', 'REJECTED' or 'ALL'
    const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, SCHEDULED: 0, REJECTED: 0, ALL: 0 });

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        calculateCounts(bookings);
    }, [bookings]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/api/bookings/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateCounts = (list) => {
        const c = { PENDING: 0, APPROVED: 0, SCHEDULED: 0, REJECTED: 0, ALL: list.length };
        list.forEach(b => {
            if (c[b.status] !== undefined) c[b.status]++;
        });
        setCounts(c);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this booking request permanently?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setBookings(prev => prev.filter(b => b.id !== id));
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (activeTab === 'ALL') return true;
        return b.status === activeTab;
    });

    if (loading) return <div className="admin-bookings-container">Loading session requests...</div>;

    return (
        <div className="admin-bookings-container">
            <div className="admin-bookings-header">
                <h2>Session Bookings</h2>
                <div className="bookings-tabs">
                    <button className={`booking-tab ${activeTab === 'PENDING' ? 'active' : ''}`} onClick={() => setActiveTab('PENDING')}>
                        Requests ({counts.PENDING})
                    </button>
                    <button className={`booking-tab ${activeTab === 'APPROVED' ? 'active' : ''}`} onClick={() => setActiveTab('APPROVED')}>
                        Approved ({counts.APPROVED})
                    </button>
                    <button className={`booking-tab ${activeTab === 'SCHEDULED' ? 'active' : ''}`} onClick={() => setActiveTab('SCHEDULED')}>
                        Scheduled ({counts.SCHEDULED})
                    </button>
                    <button className={`booking-tab ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>
                        All ({counts.ALL})
                    </button>
                </div>
            </div>

            <div className="bookings-stats">
                <div className="stat-card-mini">
                    <label>Upcoming Sessions</label>
                    <span>{counts.APPROVED + counts.SCHEDULED}</span>
                </div>
                <div className="stat-card-mini">
                    <label>Pending Response</label>
                    <span>{counts.PENDING}</span>
                </div>
                <div className="stat-card-mini">
                    <label>Total Value (Est.)</label>
                    <span>₹{bookings.length * 499}</span>
                </div>
            </div>

            <div className="bookings-table-wrapper">
                <table className="bookings-table">
                    <thead>
                        <tr>
                            <th>Guest Details</th>
                            <th>Mentor & Service</th>
                            <th>Schedule</th>
                            <th>Notes</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.map(booking => (
                            <tr key={booking.id}>
                                <td>
                                    <div className="guest-cell">
                                        <div className="guest-name">{booking.guestName}</div>
                                        <div className="guest-sub">📧 {booking.guestEmail}</div>
                                        <div className="guest-sub">📱 {booking.guestWhatsapp}</div>
                                    </div>
                                </td>
                                <td>
                                    <div className="mentor-cell">{booking.mentorName}</div>
                                    <div className="service-type">{booking.serviceType}</div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: '700' }}>📅 {booking.bookingDate}</div>
                                    <div style={{ color: '#64748b' }}>⏰ {booking.bookingTime}</div>
                                </td>
                                <td>
                                    <div className="booking-notes" title={booking.customRequest}>
                                        {booking.customRequest || "No notes provided."}
                                    </div>
                                </td>
                                <td>
                                    <span className={`booking-status-pill status-${booking.status.toLowerCase()}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-booking-actions">
                                        <button className="btn-delete-small" onClick={() => handleDelete(booking.id)} title="Delete permanently">
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredBookings.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                    No booking requests found for this tab.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminBookings;
