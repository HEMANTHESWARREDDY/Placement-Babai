import { useState, useEffect } from 'react';
import './JobAnalytics.css';

function JobAnalytics({ jobId, onClose }) {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:8080/api/analytics/job/${jobId}`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(console.error);
    }, [jobId]);

    if (!stats) return (
        <div className="ja-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ja-modal">
                <div className="job-analytics-loading">Loading metrics...</div>
            </div>
        </div>
    );

    return (
        <div className="ja-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ja-modal">
                <button className="ja-close" onClick={onClose} aria-label="Close">✕</button>
                <div className="job-analytics-wrapper">
                    <h3 className="ja-modal-title">Job Analytics</h3>
                    <h4 className="job-analytics-title">Views</h4>
                    <div className="job-analytics-inline">
                        <div className="job-stat-card">
                            <span>1H</span>
                            <strong>{stats.last1Hour}</strong>
                        </div>
                        <div className="job-stat-card">
                            <span>Today</span>
                            <strong>{stats.today}</strong>
                        </div>
                        <div className="job-stat-card">
                            <span>7 Days</span>
                            <strong>{stats.last7Days}</strong>
                        </div>
                        <div className="job-stat-card">
                            <span>All Time</span>
                            <strong>{stats.lifetime}</strong>
                        </div>
                    </div>

                    <h4 className="job-analytics-title" style={{ marginTop: '1rem' }}>Applies</h4>
                    <div className="job-analytics-inline applies-inline">
                        <div className="job-stat-card">
                            <span>1H</span>
                            <strong>{stats.last1HourApplies}</strong>
                        </div>
                        <div className="job-stat-card">
                            <span>Today</span>
                            <strong>{stats.todayApplies}</strong>
                        </div>
                        <div className="job-stat-card">
                            <span>7 Days</span>
                            <strong>{stats.last7DaysApplies}</strong>
                        </div>
                        <div className="job-stat-card">
                            <span>All Time</span>
                            <strong>{stats.lifetimeApplies}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobAnalytics;
