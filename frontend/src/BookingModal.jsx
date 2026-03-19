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
    const getSlots = (period) => {
        const slots = [];
        let start = period === 'AM' ? 9 * 60 : 12 * 60;
        const end = period === 'AM' ? 12 * 60 : 21 * 60;
        while (start < end) {
            const hours = Math.floor(start / 60);
            const mins = start % 60;
            const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const timeStr = `${displayHours}:${mins === 0 ? '00' : '30'} ${ampm}`;
            slots.push(timeStr);
            start += 30;
        }
        return slots;
    };

    const amSlots = getSlots('AM');
    const pmSlots = getSlots('PM');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const maxDay = new Date();
    maxDay.setDate(maxDay.getDate() + 15);
    const fifteenDaysMax = maxDay.toISOString().split('T')[0];

    const validateStep1 = () => {
        setError('');
        
        // Date Validation
        if (!selectedDate) {
            setError('Please select a date.');
            return false;
        }
        if (selectedDate < todayStr) {
            setError('You cannot book a date in the past.');
            return false;
        }
        if (selectedDate > fifteenDaysMax) {
            setError(`Booking is only allowed within the next 15 days (until ${fifteenDaysMax}).`);
            return false;
        }

        // Time Validation
        if (useCustomTime) {
            if (!customTime) {
                setError('Please provide a specific custom time.');
                return false;
            }
            // Regular expression for HH:MM AM/PM
            const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i;
            if (!timeRegex.test(customTime)) {
                setError('Invalid time format. Please use HH:MM AM/PM (e.g. 10:30 AM).');
                return false;
            }

            // check 9:00 AM limit
            const [time, ampm] = customTime.toUpperCase().split(' ');
            const [hrs, mins] = time.split(':').map(Number);
            if (ampm === 'AM') {
                if (hrs < 9 || hrs === 12) {
                    setError('Meetings can only be scheduled from 9:00 AM onwards.');
                    return false;
                }
            }
        } else if (!selectedTime) {
            setError('Please pick a convenient time slot.');
            return false;
        }

        return true;
    };

    useEffect(() => {
        if (!selectedDate) setSelectedDate(todayStr);
    }, []);

    const handleInputChange = (e) => {
        if (error) setError('');
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const finalTime = useCustomTime ? (customTime || 'Custom Time') : selectedTime;
        
        const payload = {
            mentorId: Number(pro.id),
            mentorName: pro.name,
            mentorEmail: pro.email,
            serviceType: service.title,
            price: Number(service.price) || 0,
            ...formData, // guestName, guestEmail, guestWhatsapp, customRequest
            bookingDate: selectedDate,
            bookingTime: finalTime,
            status: 'PENDING'
        };

        console.log('Sending booking payload:', payload);

        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                const errorText = await res.text();
                try {
                    const errorObj = JSON.parse(errorText);
                    alert(`Submission failed: ${errorObj.message || errorObj.error || 'Server error'}`);
                } catch {
                    alert('Submission failed. Please check your network or try again.');
                }
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
        <div 
            className="booking-modal-overlay" 
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="booking-modal-content large" onClick={e => e.stopPropagation()}>
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
                            <div className="form-row-side">
                                <div className="form-group-simple">
                                    <label>1. Date of Meeting</label>
                                    <input 
                                        type="date" 
                                        value={selectedDate} 
                                        min={todayStr}
                                        max={fifteenDaysMax}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="simple-input"
                                    />
                                </div>

                                <div className="form-group-simple">
                                    <label>2. Time Period</label>
                                    <div className="period-toggle-modern">
                                        <button 
                                            className={timePeriod === 'AM' && !useCustomTime ? 'active' : ''} 
                                            onClick={() => { setTimePeriod('AM'); setUseCustomTime(false); }}
                                        >AM (Morning)</button>
                                        <button 
                                            className={timePeriod === 'PM' && !useCustomTime ? 'active' : ''} 
                                            onClick={() => { setTimePeriod('PM'); setUseCustomTime(false); }}
                                        >PM (Afternoon)</button>
                                        <button 
                                            className={useCustomTime ? 'active' : ''} 
                                            onClick={() => setUseCustomTime(true)}
                                        >Custom</button>
                                    </div>
                                </div>
                            </div>

                            {error && <div className="booking-error-msg">{error}</div>}

                            <div className="time-slots-section-modern">
                                {!useCustomTime ? (
                                    <>
                                        <label className="section-small-label">Select Available Slot:</label>
                                        <div className="time-slots-grid-modern">
                                            {(timePeriod === 'AM' ? amSlots : pmSlots).map(time => (
                                                <button 
                                                    key={time} 
                                                    className={`time-slot-pill-modern ${selectedTime === time ? 'selected' : ''}`}
                                                    onClick={() => setSelectedTime(time)}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="form-group-simple">
                                        <label>Specify Your Custom Time</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 10:45 AM" 
                                            value={customTime}
                                            onChange={(e) => setCustomTime(e.target.value)}
                                            className="simple-input"
                                        />
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="booking-footer">
                            <button 
                                className="booking-next-btn-simple" 
                                onClick={() => {
                                    if (validateStep1()) setStep(2);
                                }}
                            >
                                Continue to Details →
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="booking-step">
                        <form onSubmit={handleSubmit} className="booking-form-simple">
                            <div className="form-row-side">
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
                                    style={{ pointerEvents: 'auto' }}
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
