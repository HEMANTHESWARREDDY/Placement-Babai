import React from 'react';
import './SessionDetail.css';

function SessionDetail({ session, onClose }) {
    if (!session) return null;

    return (
        <div className="session-detail-overlay" onClick={onClose}>
            <div className="session-detail-modal" onClick={(e) => e.stopPropagation()}>
                <button className="sd-close-btn" onClick={onClose}>✕</button>
                
                <div className="sd-header">
                    <div className="sd-badge">🚀 Mentorship Session</div>
                    <h2 className="sd-title">{session.title}</h2>
                    {session.sessionDate && (
                        <div className="sd-date-tag">
                            📅 {new Date(session.sessionDate).toLocaleDateString('en-US', { 
                                weekday: 'long',
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                            })}
                        </div>
                    )}
                </div>

                <div className="sd-content">
                    <div className="sd-section">
                        <h3>About this Session</h3>
                        <p className="sd-description">{session.description}</p>
                    </div>

                    {session.schedule && (
                        <div className="sd-section">
                            <h3>Schedule</h3>
                            <div className="sd-schedule-box">
                                <span className="sd-schedule-icon">⏰</span>
                                <span>{session.schedule}</span>
                            </div>
                        </div>
                    )}

                    <div className="sd-info-banner">
                        <span className="sd-banner-icon">✨</span>
                        <p>This is a free mentorship session provided by PlacementBabai experts. Make sure to join on time!</p>
                    </div>
                </div>

                <div className="sd-footer">
                    <button className="sd-cancel-btn" onClick={onClose}>Close</button>
                    <a href={session.link} target="_blank" rel="noreferrer" className="sd-join-btn">
                        Join Session Now
                    </a>
                </div>
            </div>
        </div>
    );
}

export default SessionDetail;
