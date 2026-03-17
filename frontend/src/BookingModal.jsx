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

    // Generate time slots
    const getSlots = (period) => {
        const slots = [];
        let start = period === 'AM' ? 9 * 60 : 12 * 60;
        const end = period === 'AM' ? 12 * 60 : 21 * 60;
        while (start < end) {
            const hours = Math.floor(start / 60);
            const mins = start % 60;
            const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
            const timeStr = `${displayHours}:${mins === 0 ? '00' : '30'}`;
            slots.push(timeStr);
            start += 30;
        }
        return slots;
    };

    const amSlots = getSlots('AM');
    const pmSlots = getSlots('PM');

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
                    <div className="success-icon">✅</div>
                    <h2>Booking Confirmed!</h2>
                    <p>We've received your request for <strong>{service.title}</strong> with <strong>{pro.name}</strong> on <strong>{selectedDate}</strong>.</p>
                    <p>Meeting Time: <strong>{useCustomTime ? customTime : `${selectedTime} ${timePeriod}`}</strong></p>
                    <p>We'll reach out to you on WhatsApp ({formData.guestWhatsapp}) or Email shortly.</p>
                    <button onClick={onClose} className="booking-close-btn">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-modal-overlay" onClick={onClose}>
            <div className="booking-modal-content large" onClick={e => e.stopPropagation()}>
                <button className="booking-modal-close" onClick={onClose}>✕</button>
                
                <div className="booking-modal-header">
                    <h3>Book {service.title}</h3>
                    <div className="mentor-mini-profile">
                        {pro.image ? (
                            <img src={pro.image} alt={pro.name} className="mentor-header-avatar" />
                        ) : (
                            <div className="mentor-header-initials">
                                {pro.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                        )}
                        <p>with {pro.name}</p>
                    </div>
                </div>

                <div className="booking-steps-indicator">
                    <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                </div>

                {step === 1 ? (
                    <div className="booking-step">
                        <section className="booking-section-wrapper">
                            <h4>1. Select Date</h4>
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
                        </section>

                        <section className="booking-section-wrapper">
                            <div className="time-header-flex">
                                <h4>2. Select Time Slot</h4>
                                <div className="period-toggle">
                                    <button 
                                        className={timePeriod === 'AM' && !useCustomTime ? 'active' : ''} 
                                        onClick={() => { setTimePeriod('AM'); setUseCustomTime(false); }}
                                    >AM</button>
                                    <button 
                                        className={timePeriod === 'PM' && !useCustomTime ? 'active' : ''} 
                                        onClick={() => { setTimePeriod('PM'); setUseCustomTime(false); }}
                                    >PM</button>
                                    <button 
                                        className={useCustomTime ? 'active custom-btn' : 'custom-btn'} 
                                        onClick={() => setUseCustomTime(true)}
                                    >Custom</button>
                                </div>
                            </div>

                            {useCustomTime ? (
                                <div className="custom-time-input-group">
                                    <p>Enter your preferred specific time (e.g., 10:45 AM or 4:15 PM)</p>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 10:45 AM" 
                                        value={customTime}
                                        onChange={(e) => setCustomTime(e.target.value)}
                                        className="custom-time-input"
                                    />
                                </div>
                            ) : (
                                <div className="time-selector grid-view">
                                    {(timePeriod === 'AM' ? amSlots : pmSlots).map((time, index) => (
                                        <button 
                                            key={index} 
                                            className={`time-slot-pill ${selectedTime === time ? 'selected' : ''}`}
                                            onClick={() => setSelectedTime(time)}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <div className="booking-footer">
                            <button 
                                className="booking-next-btn" 
                                disabled={!selectedDate || (!useCustomTime && !selectedTime) || (useCustomTime && !customTime)}
                                onClick={() => setStep(2)}
                            >
                                Continue to Details →
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="booking-step">
                        <h4 className="step-title">3. Your Contact Details</h4>
                        <form onSubmit={handleSubmit} className="booking-form-rich">
                            <div className="form-row">
                                <div className="form-group-rich">
                                    <label>Full Name</label>
                                    <input 
                                        type="text" 
                                        name="guestName" 
                                        required 
                                        value={formData.guestName} 
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="form-group-rich">
                                    <label>Email Address</label>
                                    <input 
                                        type="email" 
                                        name="guestEmail" 
                                        required 
                                        value={formData.guestEmail} 
                                        onChange={handleInputChange}
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group-rich">
                                <label>WhatsApp Number</label>
                                <input 
                                    type="tel" 
                                    name="guestWhatsapp" 
                                    required 
                                    value={formData.guestWhatsapp} 
                                    onChange={handleInputChange}
                                    placeholder="+91 98765 43210"
                                />
                                <small>We'll use this to send the meeting link.</small>
                            </div>

                            <div className="form-group-rich">
                                <label>Any specific help you need? (Optional)</label>
                                <textarea 
                                    name="customRequest" 
                                    rows="3"
                                    value={formData.customRequest} 
                                    onChange={handleInputChange}
                                    placeholder="I want to discuss about my career path in AI..."
                                ></textarea>
                            </div>

                            <div className="booking-summary-fancy">
                                <div className="summary-item">
                                    <span className="summary-icon">📅</span>
                                    <span>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-icon">⏰</span>
                                    <span>{useCustomTime ? customTime : `${selectedTime} ${timePeriod}`}</span>
                                </div>
                            </div>

                            <div className="booking-footer">
                                <button type="button" className="booking-back-btn" onClick={() => setStep(1)}>← Back</button>
                                <button type="submit" className="booking-submit-btn-rich" disabled={loading}>
                                    {loading ? 'Processing...' : 'Confirm My Session'}
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
