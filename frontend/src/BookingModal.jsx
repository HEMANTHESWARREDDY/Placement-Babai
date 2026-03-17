import React, { useState, useEffect } from 'react';
import './BookingModal.css';
import { API_BASE_URL } from './config';

const BookingModal = ({ pro, service, onClose }) => {
    const [step, setStep] = useState(1); // 1: Date/Time, 2: Details
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [timePeriod, setTimePeriod] = useState('AM'); // 'AM' or 'PM'
    const [customTime, setCustomTime] = useState('');
    const [useCustomTime, setUseCustomTime] = useState(false);
    
    const [formData, setFormData] = useState({
        guestName: '',
        guestEmail: '',
        guestWhatsapp: '',
        customRequest: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    const fourteenDaysMax = maxDate.toISOString().split('T')[0];

    const timeSlots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
        "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
        "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM"
    ];

    useEffect(() => {
        if (!selectedDate) setSelectedDate(today);
        if (!selectedTime) setSelectedTime(timeSlots[0]);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const finalTime = useCustomTime ? `${customTime || 'Custom Time'}` : `${selectedTime} ${timePeriod}`;
        
        const payload = {
            mentorId: pro.id,
            mentorName: pro.name,
            serviceType: service.title,
            ...formData,
            bookingDate: selectedDate,
            bookingTime: finalTime
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                alert('Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="booking-modal-overlay">
                <div className="booking-modal-content success-view">
                    <div className="success-icon-wrap">✓</div>
                    <h2 style={{ color: '#0f172a', fontWeight: '800' }}>Booking Received</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>We've received your request for <strong>{service.title}</strong> with <strong>{pro.name}</strong>.</p>
                    <div className="booking-summary-fancy">
                        <div className="summary-item">Scheduled Date: {selectedDate}</div>
                        <div className="summary-item">Scheduled Time: {useCustomTime ? customTime : selectedTime}</div>
                    </div>
                    <hr />
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>We will contact you via WhatsApp ({formData.guestWhatsapp}) or Email shortly with the meeting details.</p>
                    <button onClick={onClose} className="booking-next-btn-simple" style={{ marginTop: '20px' }}>CLOSE</button>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-modal-overlay" onClick={onClose}>
            <div className="booking-modal-content" onClick={e => e.stopPropagation()}>
                <button className="booking-modal-close" onClick={onClose}>✕</button>
                
                <div className="booking-modal-header">
                    <h3>Book {service.title}</h3>
                    <div className="mentor-mini-profile">
                        <p>with</p>
                        {pro.image ? (
                            <img src={pro.image} alt={pro.name} className="mentor-header-avatar" />
                        ) : (
                            <div className="mentor-header-initials">
                                {pro.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                        )}
                        <p>{pro.name}</p>
                    </div>
                </div>

                <div className="booking-steps-indicator">
                    <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                </div>

                {step === 1 ? (
                    <div className="booking-step">
                        <section className="booking-form-simple">
                            <div className="form-group-simple">
                                <label>1. Date of Meeting</label>
                                <input 
                                    type="date" 
                                    value={selectedDate} 
                                    min={today}
                                    max={fourteenDaysMax}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="simple-input"
                                />
                            </div>

                            <div className="form-group-simple">
                                <label>2. Preferred Time</label>
                                <select 
                                    className="simple-select"
                                    value={useCustomTime ? 'CUSTOM' : selectedTime}
                                    onChange={(e) => {
                                        if (e.target.value === 'CUSTOM') {
                                            setUseCustomTime(true);
                                        } else {
                                            setUseCustomTime(false);
                                            setSelectedTime(e.target.value);
                                        }
                                    }}
                                >
                                    {timeSlots.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                    <option value="CUSTOM">-- Specify Other Time --</option>
                                </select>
                            </div>

                            {useCustomTime && (
                                <div className="form-group-simple">
                                    <label>Enter Specific Time</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 10:45 AM" 
                                        value={customTime}
                                        onChange={(e) => setCustomTime(e.target.value)}
                                        className="simple-input"
                                    />
                                </div>
                            )}
                        </section>

                        <div className="booking-footer">
                            <button 
                                className="booking-next-btn-simple" 
                                disabled={!selectedDate || (!useCustomTime && !selectedTime) || (useCustomTime && !customTime)}
                                onClick={() => setStep(2)}
                            >
                                Continue to Details →
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="booking-step">
                        <form onSubmit={handleSubmit} className="booking-form-simple">
                            <div className="form-group-simple">
                                <label>Full Name</label>
                                <input 
                                    type="text" 
                                    name="guestName" 
                                    required 
                                    value={formData.guestName} 
                                    onChange={handleInputChange}
                                    placeholder="Enter your name"
                                    className="simple-input"
                                />
                            </div>
                            <div className="form-group-simple">
                                <label>Email Address</label>
                                <input 
                                    type="email" 
                                    name="guestEmail" 
                                    required 
                                    value={formData.guestEmail} 
                                    onChange={handleInputChange}
                                    placeholder="yourname@example.com"
                                    className="simple-input"
                                />
                            </div>
                            <div className="form-group-simple">
                                <label>WhatsApp Number</label>
                                <input 
                                    type="tel" 
                                    name="guestWhatsapp" 
                                    required 
                                    value={formData.guestWhatsapp} 
                                    onChange={handleInputChange}
                                    placeholder="+91 ...."
                                    className="simple-input"
                                />
                            </div>

                            <div className="form-group-simple">
                                <label>Specific Request / Notes</label>
                                <textarea 
                                    name="customRequest" 
                                    rows="3"
                                    value={formData.customRequest} 
                                    onChange={handleInputChange}
                                    placeholder="Additional details..."
                                    className="simple-input"
                                ></textarea>
                            </div>

                            <div className="booking-summary-fancy">
                                <div className="summary-item">Date: {selectedDate}</div>
                                <div className="summary-item">Time: {useCustomTime ? customTime : selectedTime}</div>
                            </div>

                            <div className="booking-footer">
                                <button type="button" className="booking-back-btn" onClick={() => setStep(1)}>Back</button>
                                <button type="submit" className="booking-next-btn-simple" disabled={loading}>
                                    {loading ? 'Please wait...' : 'Confirm My Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;
