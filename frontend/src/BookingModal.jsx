import React, { useState, useEffect } from 'react';
import './BookingModal.css';
import { API_BASE_URL } from './config';

const BookingModal = ({ pro, service, onClose }) => {
    const [step, setStep] = useState(1); // 1: Date/Time, 2: Details
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [formData, setFormData] = useState({
        guestName: '',
        guestEmail: '',
        guestWhatsapp: '',
        customRequest: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Generate next 14 days
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push({
            full: d.toISOString().split('T')[0],
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            date: d.getDate(),
            month: d.toLocaleDateString('en-US', { month: 'short' })
        });
    }

    // Generate time slots (9 AM to 9 PM, 30 min intervals)
    const timeSlots = [];
    let start = 9 * 60; // 9:00 AM in minutes
    const end = 21 * 60; // 9:00 PM in minutes
    while (start < end) {
        const hours = Math.floor(start / 60);
        const mins = start % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours;
        const timeStr = `${displayHours}:${mins === 0 ? '00' : '30'} ${period}`;
        timeSlots.push(timeStr);
        start += 30;
    }

    useEffect(() => {
        if (!selectedDate) setSelectedDate(dates[0].full);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const payload = {
            mentorId: pro.id,
            mentorName: pro.name,
            serviceType: service.title,
            ...formData,
            bookingDate: selectedDate,
            bookingTime: selectedTime
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
                    <div className="success-icon">✅</div>
                    <h2>Booking Confirmed!</h2>
                    <p>We've received your request for <strong>{service.title}</strong> with <strong>{pro.name}</strong> on <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong>.</p>
                    <p>We'll reach out to you on WhatsApp ({formData.guestWhatsapp}) or Email shortly.</p>
                    <button onClick={onClose} className="booking-close-btn">Close</button>
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
                    <p>with {pro.name}</p>
                </div>

                <div className="booking-steps-indicator">
                    <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                </div>

                {step === 1 ? (
                    <div className="booking-step">
                        <h4>Select Date</h4>
                        <div className="date-selector">
                            {dates.map((d, index) => (
                                <div 
                                    key={index} 
                                    className={`date-card ${selectedDate === d.full ? 'selected' : ''}`}
                                    onClick={() => setSelectedDate(d.full)}
                                >
                                    <span className="date-month">{d.month}</span>
                                    <span className="date-num">{d.date}</span>
                                    <span className="date-day">{d.day}</span>
                                </div>
                            ))}
                        </div>

                        <h4>Select Time Slot</h4>
                        <div className="time-selector">
                            {timeSlots.map((time, index) => (
                                <button 
                                    key={index} 
                                    className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                                    onClick={() => setSelectedTime(time)}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>

                        <div className="booking-footer">
                            <button 
                                className="booking-next-btn" 
                                disabled={!selectedDate || !selectedTime}
                                onClick={() => setStep(2)}
                            >
                                Next: Your Details
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="booking-step">
                        <h4>Your Details</h4>
                        <form onSubmit={handleSubmit} className="booking-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input 
                                    type="text" 
                                    name="guestName" 
                                    required 
                                    value={formData.guestName} 
                                    onChange={handleInputChange}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input 
                                    type="email" 
                                    name="guestEmail" 
                                    required 
                                    value={formData.guestEmail} 
                                    onChange={handleInputChange}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>WhatsApp Number</label>
                                <input 
                                    type="tel" 
                                    name="guestWhatsapp" 
                                    required 
                                    value={formData.guestWhatsapp} 
                                    onChange={handleInputChange}
                                    placeholder="+91 12345 67890"
                                />
                            </div>
                            <div className="form-group">
                                <label>What do you want to discuss? (Custom Request)</label>
                                <textarea 
                                    name="customRequest" 
                                    rows="3"
                                    value={formData.customRequest} 
                                    onChange={handleInputChange}
                                    placeholder="Briefly describe your requirements..."
                                ></textarea>
                            </div>

                            <div className="booking-summary-mini">
                                📅 {selectedDate} at {selectedTime}
                            </div>

                            <div className="booking-footer">
                                <button type="button" className="booking-back-btn" onClick={() => setStep(1)}>Back</button>
                                <button type="submit" className="booking-submit-btn" disabled={loading}>
                                    {loading ? 'Processing...' : 'Confirm Booking'}
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
