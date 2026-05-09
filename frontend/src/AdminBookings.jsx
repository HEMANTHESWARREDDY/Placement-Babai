import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import './AdminBookings.css';

function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING', 'APPROVED', 'SCHEDULED', 'REJECTED' or 'ALL'
    const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, SCHEDULED: 0, REJECTED: 0, ALL: 0 });
    const [selectedBooking, setSelectedBooking] = useState(null);

    const BookingDetailModal = ({ booking, onClose }) => {
        if (!booking) return null;
        return (
            <div className="mentor-modal-overlay" onClick={onClose}>
                <div className="mentor-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="mentor-modal-header">
                        <h3>Booking Details</h3>
                        <button className="close-modal" onClick={onClose}>×</button>
                    </div>
                    <div className="mentor-modal-body">
                        <div className="modal-section">
                            <label>Guest Details</label>
                            <p className="modal-name">{booking.guestName}</p>
                            <p>📧 {booking.guestEmail}</p>
                            <p>📱 {booking.guestWhatsapp}</p>
                        </div>
                        <div className="modal-section">
                            <label>Mentor & Service</label>
                            <p>{booking.mentorName}</p>
                            <span className="service-type">{booking.serviceType}</span>
                        </div>
                        <div className="modal-section">
                            <label>Schedule</label>
                            <p>📅 {booking.bookingDate}</p>
                            <p>⏰ {booking.bookingTime}</p>
                        </div>
                        <div className="modal-section">
                            <label>Status</label>
                            <span className={`booking-status-pill status-${booking.status.toLowerCase()}`}>
                                {booking.status}
                            </span>
                        </div>
                        <div className="modal-section">
                            <label>Notes</label>
                            <p className="modal-bio">{booking.customRequest || "No notes provided."}</p>
                        </div>
                    </div>
                    <div className="mentor-modal-footer">
                        <div className="admin-booking-actions">
                            <button className="btn-delete-hard" onClick={() => { handleDelete(booking.id); onClose(); }}>
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                    <button className={`booking-tab ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>
                        All ({counts.ALL})
                    </button>
                    <button className={`booking-tab ${activeTab === 'PENDING' ? 'active' : ''}`} onClick={() => setActiveTab('PENDING')}>
                        Requests ({counts.PENDING})
                    </button>
                    <button className={`booking-tab ${activeTab === 'APPROVED' ? 'active' : ''}`} onClick={() => setActiveTab('APPROVED')}>
                        Approved ({counts.APPROVED})
                    </button>
                    <button className={`booking-tab ${activeTab === 'SCHEDULED' ? 'active' : ''}`} onClick={() => setActiveTab('SCHEDULED')}>
                        Scheduled ({counts.SCHEDULED})
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
                            <tr key={booking.id} onClick={() => window.innerWidth <= 768 && setSelectedBooking(booking)} className="mentor-row-clickable">
                                <td data-label="Guest">
                                    <div className="guest-cell">
                                        <div className="guest-name">{booking.guestName}</div>
                                        <div className="mobile-only-hint">📅 {booking.bookingDate} | ⏰ {booking.bookingTime}</div>
                                        <div className="mobile-only-hint" style={{ color: '#0ea5e9', fontWeight: '600' }}>Click for details</div>
                                    </div>
                                </td>
                                <td data-label="Mentor & Service">
                                    <div className="mentor-cell">{booking.mentorName}</div>
                                    <div className="service-type">{booking.serviceType}</div>
                                </td>
                                <td data-label="Schedule">
                                    <div style={{ fontWeight: '700' }}>📅 {booking.bookingDate}</div>
                                    <div style={{ color: '#64748b' }}>⏰ {booking.bookingTime}</div>
                                </td>
                                <td data-label="Notes">
                                    <div className="booking-notes" title={booking.customRequest}>
                                        {booking.customRequest || "No notes provided."}
                                    </div>
                                </td>
                                <td data-label="Status">
                                    <span className={`booking-status-pill status-${booking.status.toLowerCase()}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td data-label="Action">
                                    <div className="admin-booking-actions">
                                        <button className="btn-delete-small" onClick={(e) => { e.stopPropagation(); handleDelete(booking.id); }} title="Delete permanently">
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredBookings.length === 0 && (
                            <tr>
                                <td colSpan="6" className="empty-row-bookings">
                                    No booking requests found for this tab.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {selectedBooking && <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
        </div>
    );
}

export default AdminBookings;
