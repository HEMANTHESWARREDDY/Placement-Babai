import React from 'react';
import './SessionDetail.css';

function SessionDetail({ session, onClose }) {
    const [copied, setCopied] = React.useState(false);
    if (!session) return null;

    const handleShare = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('prepzo', '');
        url.searchParams.set('session', session.id);
        navigator.clipboard.writeText(url.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="session-detail-overlay" onClick={onClose}>
            <div className="session-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sd-actions-top">
                    <button className="sd-share-btn" onClick={handleShare} title="Copy Link">
                        {copied ? '✅' : '🔗'}
                    </button>
                    <button className="sd-close-btn" onClick={onClose}>✕</button>
                </div>
                
                <div className="sd-scroll-content">
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
                </div>

                <div className="sd-footer">
                    <button className="sd-cancel-btn" onClick={onClose}>Close</button>
                    <a href={session.link} target="_blank" rel="noreferrer" className="sd-join-btn">
                        Join Session Now
                    </a>
                </div>
                {copied && <div className="sd-copy-toast">Link Copied!</div>}
            </div>
        </div>
    );
}

export default SessionDetail;
