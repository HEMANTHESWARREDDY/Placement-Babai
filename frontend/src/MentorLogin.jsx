import React, { useState } from 'react';
import './AdminLogin.css'; // Reusing the admin styling
import { API_BASE_URL } from './config';

function MentorLogin({ onLoginSuccess, onBack }) {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="admin-login-container mentor-portal-bg">
            <div className="admin-login-box">
                <button className="back-home-btn" onClick={onBack}>← Back to Home</button>
                <h2>Mentor Portal Login</h2>
                <p className="admin-subtitle">Enter your credentials to access your dashboard</p>

                <form onSubmit={handleSubmit}>
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

                    <div className="form-group">
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

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default MentorLogin;
