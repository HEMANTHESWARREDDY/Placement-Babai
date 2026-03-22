import React, { useState } from 'react';
import './AdminLogin.css'; // Reusing the admin styling
import { API_BASE_URL } from './config';

function MentorLogin({ onLoginSuccess, onBack }) {
    const [view, setView] = useState('login'); // login, forgot, verify, reset
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset Flow state
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/mentors/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('mentorToken', data.token);
                localStorage.setItem('mentorUsername', data.username);
                localStorage.setItem('mentorId', data.id);
                onLoginSuccess(data);
            } else {
                setError(data.error || 'Invalid credentials or application still pending.');
            }
        } catch (err) {
            setError('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentors/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setView('verify');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to send code.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentors/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, code: resetCode })
            });
            const data = await res.json();
            if (res.ok) {
                setView('reset');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentors/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, code: resetCode, password: newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setView('login');
                setCredentials({ username: forgotEmail, password: '' });
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Reset failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container mentor-portal-bg">
            <div className="admin-login-box">
                <button className="back-home-btn" onClick={onBack}>← Back to Home</button>
                
                {view === 'login' && (
                    <>
                        <h2>Mentor Portal Login</h2>
                        <form onSubmit={handleSubmit}>
                            {message && <div style={{color: '#16a34a', marginBottom: '1rem', fontWeight: '600'}}>{message}</div>}
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label>Username or Email</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={credentials.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter username or email"
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '5px' }}>
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter password"
                                />
                            </div>
                            
                            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                                <button 
                                    type="button" 
                                    onClick={() => { setView('forgot'); setError(''); setMessage(''); }}
                                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                        </form>
                    </>
                )}

                {view === 'forgot' && (
                    <>
                        <h2>Forgot Password</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter your email to receive a reset code.</p>
                        <form onSubmit={handleSendCode}>
                            {error && <div className="error-message">{error}</div>}
                            <div className="form-group">
                                <label>Registered Email</label>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                            <button type="button" onClick={() => setView('login')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>
                                Back to Login
                            </button>
                        </form>
                    </>
                )}

                {view === 'verify' && (
                    <>
                        <h2>Enter Code</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>We sent a 6-digit code to {forgotEmail}</p>
                        <form onSubmit={handleVerifyCode}>
                            {message && <div style={{color: '#16a34a', marginBottom: '1rem'}}>{message}</div>}
                            {error && <div className="error-message">{error}</div>}
                            <div className="form-group">
                                <label>Reset Code</label>
                                <input
                                    type="text"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    required
                                    placeholder="Enter 6-digit code"
                                    maxLength="6"
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Checking...' : 'Verify Code'}
                            </button>
                            <button type="button" onClick={() => setView('forgot')} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>
                                Re-enter Email
                            </button>
                        </form>
                    </>
                )}

                {view === 'reset' && (
                    <>
                        <h2>Reset Password</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Create a new strong password for your account.</p>
                        <form onSubmit={handleResetPassword}>
                            {error && <div className="error-message">{error}</div>}
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Enter new password"
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Resetting...' : 'Change Password'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default MentorLogin;
