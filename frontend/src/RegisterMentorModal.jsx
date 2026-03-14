import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import './RegisterMentorModal.css';

function RegisterMentorModal({ onClose, onLoginClick }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        experience: '',
        linkedin: '',
        skills: '',
        bio: '',
        username: '',
        password: '',
        confirmPassword: '',
        isAvailable: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (formData.password.length < 6) {
                alert('Password must be at least 6 characters.');
                setIsSubmitting(false);
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                alert('Passwords do not match!');
                setIsSubmitting(false);
                return;
            }
            const response = await fetch(`${API_BASE_URL}/api/mentors/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 2500);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'There was an issue submitting your application.');
            }
        } catch (error) {
            console.error('Error applying as mentor:', error);
            alert('A network error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rm-overlay" onClick={onClose}>
            <div className="rm-modal-unified" onClick={e => e.stopPropagation()}>
                <button className="rm-close-btn-unified" onClick={onClose}>✕</button>

                {isSuccess ? (
                    <div className="rm-success-state">
                        <div className="rm-success-icon">🎉</div>
                        <h2>Application Received!</h2>
                        <p>Thank you for your interest in becoming a mentor. Our team will review your profile and reach out to you shortly.</p>
                    </div>
                ) : (
                    <>
                        <div className="rm-header">
                            <h2>Join as a <span style={{ color: '#0ea5e9' }}>Mentor</span></h2>
                            <p>Share your expertise, guide the next generation, and grow your personal brand.</p>
                        </div>

                        <div className="rm-already-mentor-banner">
                            <div className="rm-already-mentor-left">
                                <span className="rm-already-mentor-emoji">⚡</span>
                                <div>
                                    <div className="rm-already-mentor-title">Already a Mentor?</div>
                                    <div className="rm-already-mentor-sub">Log in to your mentor dashboard</div>
                                </div>
                            </div>
                            <button type="button" onClick={() => { onClose(); if(onLoginClick) onLoginClick(); }} className="rm-mentor-login-btn" style={{border: 'none', cursor: 'pointer'}}>
                                Login Here →
                            </button>
                        </div>

                        <form className="rm-form" onSubmit={handleSubmit}>
                            <div className="rm-form-grid">
                                <div className="rm-form-group">
                                    <label>Full Name *</label>
                                    <input type="text" name="name" required placeholder="John Doe" value={formData.name} onChange={handleChange} />
                                </div>
                                <div className="rm-form-group">
                                    <label>Email Address *</label>
                                    <input type="email" name="email" required placeholder="john@example.com" value={formData.email} onChange={handleChange} />
                                </div>
                                <div className="rm-form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" name="phone" placeholder="+91 9876543210" value={formData.phone} onChange={handleChange} />
                                </div>
                                <div className="rm-form-group">
                                    <label>LinkedIn Profile URL *</label>
                                    <input type="url" name="linkedin" required placeholder="https://linkedin.com/in/johndoe" value={formData.linkedin} onChange={handleChange} />
                                </div>
                                <div className="rm-form-group">
                                    <label>Current Company *</label>
                                    <input type="text" name="company" required placeholder="Google, Microsoft, etc." value={formData.company} onChange={handleChange} />
                                </div>
                                <div className="rm-form-group">
                                    <label>Job Title/Role *</label>
                                    <input type="text" name="role" required placeholder="Senior Software Engineer" value={formData.role} onChange={handleChange} />
                                </div>
                                <div className="rm-form-group">
                                    <label>Years of Experience *</label>
                                    <input type="number" name="experience" min="0" required placeholder="e.g. 5" value={formData.experience} onChange={handleChange} />
                                </div>
                                <div className="rm-form-group">
                                    <label>Expertise/Skills (comma separated) *</label>
                                    <input type="text" name="skills" required placeholder="React, Node.js, System Design" value={formData.skills} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="rm-form-group rm-full-width">
                                <label>Short Bio *</label>
                                <textarea name="bio" required placeholder="Tell us a bit about your journey and what you can help mentees with..." rows="4" value={formData.bio} onChange={handleChange}></textarea>
                            </div>

                            <div className="rm-credentials-section">
                                <div className="rm-credentials-title">🔐 Create Login Credentials</div>
                                <div className="rm-credentials-sub">You'll use these to log in once your application is approved</div>
                                <div className="rm-form-grid">
                                    <div className="rm-form-group">
                                        <label>Username *</label>
                                        <input type="text" name="username" required placeholder="Choose a unique username" value={formData.username} onChange={handleChange} />
                                    </div>
                                    <div className="rm-form-group hide-on-mobile"></div>
                                    <div className="rm-form-group">
                                        <label>Password *</label>
                                        <input type="password" name="password" required placeholder="Min 6 characters" value={formData.password} onChange={handleChange} />
                                    </div>
                                    <div className="rm-form-group">
                                        <label>Confirm Password *</label>
                                        <input type="password" name="confirmPassword" required placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="rm-form-actions">
                                <button type="button" className="rm-cancel-btn" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="rm-submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default RegisterMentorModal;
