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
        education: '',
        username: '',
        password: '',
        confirmPassword: '',
        isAvailable: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const validateForm = () => {
        const newErrors = {};
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) newErrors.email = "Email is required";
        else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format";

        // Phone validation (simple check for 10 digits)
        const phoneRegex = /^\+?\d{10,13}$/;
        if (!formData.phone) newErrors.phone = "Phone number is required";
        else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = "Invalid phone number (min 10 digits)";

        // Username validation (min 3 letters, only letters, numbers, underscores)
        const usernameRegex = /^(?=(?:.*[a-zA-Z]){3,})[a-zA-Z0-9_]+$/;
        if (!formData.username) newErrors.username = "Username is required";
        else if (!usernameRegex.test(formData.username)) {
            newErrors.username = "Min 3 alphabets, only letters, numbers, and underscores allowed";
        }

        // Password validation (min 6 chars, at least 1 number, 1 special char)
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
        if (!formData.password) newErrors.password = "Password is required";
        else if (!passwordRegex.test(formData.password)) {
            newErrors.password = "Min 6 characters, must include 1 number and 1 special character";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Mandatory fields
        const requiredFields = ['name', 'linkedin', 'company', 'role', 'experience', 'skills', 'bio', 'education'];
        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
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
                const backendError = errorData.error || 'There was an issue submitting your application.';
                
                // Map backend errors to specific fields if possible
                if (backendError.toLowerCase().includes('username')) {
                    setErrors(prev => ({ ...prev, username: backendError }));
                } else if (backendError.toLowerCase().includes('email')) {
                    setErrors(prev => ({ ...prev, email: backendError }));
                } else if (backendError.toLowerCase().includes('phone')) {
                    setErrors(prev => ({ ...prev, phone: backendError }));
                } else {
                    alert(backendError);
                }
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
                        </div>

                        <div className="rm-already-mentor-banner">
                            <div className="rm-already-mentor-left">
                                <div>
                                    <div className="rm-already-mentor-title">
                                        <span className="rm-already-mentor-emoji">⚡</span> Already a Mentor?
                                    </div>
                                    <div className="rm-already-mentor-sub">Log in to your mentor dashboard</div>
                                </div>
                            </div>
                            <button type="button" onClick={() => { onClose(); if(onLoginClick) onLoginClick(); }} className="rm-mentor-login-btn" style={{border: 'none', cursor: 'pointer'}}>
                                Login Here →
                            </button>
                        </div>

                        <form className="rm-form" onSubmit={handleSubmit} noValidate>
                            <div className="rm-form-grid">
                                <div className="rm-form-group">
                                    <label>Full Name *</label>
                                    <input type="text" name="name" required placeholder="John Doe" value={formData.name} onChange={handleChange} className={errors.name ? 'input-error' : ''} />
                                    {errors.name && <div className="rm-error-msg">{errors.name}</div>}
                                </div>
                                <div className="rm-form-group">
                                    <label>Email Address *</label>
                                    <input type="email" name="email" required placeholder="john@example.com" value={formData.email} onChange={handleChange} className={errors.email ? 'input-error' : ''} />
                                    {errors.email && <div className="rm-error-msg">{errors.email}</div>}
                                </div>
                                <div className="rm-form-group">
                                    <label>Phone Number *</label>
                                    <input type="tel" name="phone" required placeholder="+91 9876543210" value={formData.phone} onChange={handleChange} className={errors.phone ? 'input-error' : ''} />
                                    {errors.phone && <div className="rm-error-msg">{errors.phone}</div>}
                                </div>
                                <div className="rm-form-group">
                                    <label>LinkedIn Profile URL *</label>
                                    <input type="url" name="linkedin" required placeholder="https://linkedin.com/in/johndoe" value={formData.linkedin} onChange={handleChange} className={errors.linkedin ? 'input-error' : ''} />
                                    {errors.linkedin && <div className="rm-error-msg">{errors.linkedin}</div>}
                                </div>
                                <div className="rm-form-group">
                                    <label>Current Company *</label>
                                    <input type="text" name="company" required placeholder="Google, Microsoft, etc." value={formData.company} onChange={handleChange} className={errors.company ? 'input-error' : ''} />
                                    {errors.company && <div className="rm-error-msg">{errors.company}</div>}
                                </div>
                                <div className="rm-form-group">
                                    <label>Job Title/Role *</label>
                                    <input type="text" name="role" required placeholder="Senior Software Engineer" value={formData.role} onChange={handleChange} className={errors.role ? 'input-error' : ''} />
                                    {errors.role && <div className="rm-error-msg">{errors.role}</div>}
                                </div>
                                <div className="rm-form-group">
                                    <label>Years of Experience *</label>
                                    <input type="number" name="experience" min="0" required placeholder="e.g. 5" value={formData.experience} onChange={handleChange} className={errors.experience ? 'input-error' : ''} />
                                    {errors.experience && <div className="rm-error-msg">{errors.experience}</div>}
                                </div>
                                <div className="rm-form-group">
                                    <label>Expertise/Skills (comma separated) *</label>
                                    <input type="text" name="skills" required placeholder="React, Node.js, System Design" value={formData.skills} onChange={handleChange} className={errors.skills ? 'input-error' : ''} />
                                    {errors.skills && <div className="rm-error-msg">{errors.skills}</div>}
                                </div>
                                <div className="rm-form-group">
                                    <label>Education / Degree *</label>
                                    <input type="text" name="education" required placeholder="B.Tech in Computer Science / MBA, etc." value={formData.education} onChange={handleChange} className={errors.education ? 'input-error' : ''} />
                                    {errors.education && <div className="rm-error-msg">{errors.education}</div>}
                                </div>
                            </div>

                            <div className="rm-form-group rm-full-width">
                                <label>Short Bio *</label>
                                <textarea name="bio" required placeholder="Tell us a bit about your journey and what you can help mentees with..." rows="4" value={formData.bio} onChange={handleChange} className={errors.bio ? 'input-error' : ''}></textarea>
                                {errors.bio && <div className="rm-error-msg">{errors.bio}</div>}
                            </div>

                            <div className="rm-credentials-section">
                                <div className="rm-credentials-title">🔐 Create Login Credentials</div>
                                <div className="rm-credentials-sub">You'll use these to log in once your application is approved</div>
                                <div className="rm-form-grid">
                                    <div className="rm-form-group">
                                        <label>Username *</label>
                                        <input type="text" name="username" required placeholder="Min 3 alphabets (e.g. john_123)" value={formData.username} onChange={handleChange} className={errors.username ? 'input-error' : ''} />
                                        {errors.username && <div className="rm-error-msg">{errors.username}</div>}
                                    </div>
                                    <div className="rm-form-group hide-on-mobile"></div>
                                    <div className="rm-form-group">
                                        <label>Password *</label>
                                        <input type="password" name="password" required placeholder="Min 6 chars, 1 number, 1 symbol" value={formData.password} onChange={handleChange} className={errors.password ? 'input-error' : ''} />
                                        {errors.password && <div className="rm-error-msg">{errors.password}</div>}
                                    </div>
                                    <div className="rm-form-group">
                                        <label>Confirm Password *</label>
                                        <input type="password" name="confirmPassword" required placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} className={errors.confirmPassword ? 'input-error' : ''} />
                                        {errors.confirmPassword && <div className="rm-error-msg">{errors.confirmPassword}</div>}
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
