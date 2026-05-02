import React from 'react';
import './SessionDetail.css';

function SessionDetail({ session, onClose }) {
    const [copied, setCopied] = React.useState(false);
    if (!session) return null;

    const handleShare = async () => {
        const shareUrl = window.location.protocol + "//" + window.location.host + "/prepZo?session=" + session.id;
        const shareData = {
            title: `Mentorship Session: ${session.title}`,
            text: `Join this free mentorship session on PlacementBabai: ${session.title}`,
            url: shareUrl
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="session-detail-overlay" onClick={onClose}>
            <div className="session-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sd-actions-top">
                    <button className="sd-share-btn" onClick={handleShare} title="Share Session">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
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
                            <p>This is a free mentorship session. Make sure to join on time!</p>
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
