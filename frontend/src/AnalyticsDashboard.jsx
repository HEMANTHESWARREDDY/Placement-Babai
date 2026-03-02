import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import { API_BASE_URL } from './config';
import './AnalyticsDashboard.css';

function AnalyticsDashboard() {
    const [websiteStats, setWebsiteStats] = useState(null);
    const [historicalStats, setHistoricalStats] = useState([]);
    const [activeDateIndex, setActiveDateIndex] = useState(0);
    const [selectedMetric, setSelectedMetric] = useState('views');

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/analytics/website`)
            .then(res => res.json())
            .then(data => setWebsiteStats(data))
            .catch(console.error);

        fetch(`${API_BASE_URL}/api/analytics/historical`)
            .then(res => res.json())
            .then(data => {
                setHistoricalStats(data);
                // First element is today, we can just use that
            })
            .catch(console.error);
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const activeDayData = historicalStats[activeDateIndex] || null;

    const handleDateChange = (date) => {
        if (!date) return;
        const selectedDateStr = format(date, 'yyyy-MM-dd');
        const foundIndex = historicalStats.findIndex(stat => stat.date === selectedDateStr);
        if (foundIndex !== -1) {
            setActiveDateIndex(foundIndex);
        }
    };

    const minDate = historicalStats.length > 0 ? parseISO(historicalStats[historicalStats.length - 1].date) : new Date();
    const maxDate = historicalStats.length > 0 ? parseISO(historicalStats[0].date) : new Date();

    const renderMetricGrid = () => {
        let last1Hour, today, last7Days;

        if (selectedMetric === 'views') {
            last1Hour = websiteStats.last1Hour;
            today = websiteStats.today;
            last7Days = websiteStats.last7Days;
        } else if (selectedMetric === 'applies') {
            last1Hour = websiteStats.last1HourApplies;
            today = websiteStats.todayApplies;
            last7Days = websiteStats.last7DaysApplies;
        } else if (selectedMetric === 'jobs') {
            last1Hour = websiteStats.last1HourJobs;
            today = websiteStats.todayJobs;
            last7Days = websiteStats.last7DaysJobs;
        }

        return (
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <h3>Last 1 Hour</h3>
                    <p>{last1Hour}</p>
                </div>
                <div className="stat-card">
                    <h3>Today</h3>
                    <p>{today}</p>
                </div>
                <div className="stat-card">
                    <h3>Last 7 Days</h3>
                    <p>{last7Days}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="analytics-container">
            {websiteStats ? (
                <>
                    <h2>Lifetime Overview</h2>
                    <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
                            <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Total Views</h3>
                            <p style={{ color: 'white' }}>{websiteStats.lifetime}</p>
                        </div>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
                            <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Total Applies</h3>
                            <p style={{ color: 'white' }}>{websiteStats.lifetimeApplies}</p>
                        </div>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
                            <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Total Jobs Created</h3>
                            <p style={{ color: 'white' }}>{websiteStats.lifetimeJobs}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0 }}>Recent Activity Breakdown</h2>
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500', color: '#1e293b', backgroundColor: 'white' }}
                        >
                            <option value="views">Website Traffic (Overall)</option>
                            <option value="applies">Total Job Applies</option>
                            <option value="jobs">Total Jobs Created</option>
                        </select>
                    </div>
                    {renderMetricGrid()}
                </>
            ) : <p>Loading website stats...</p>}

            <h2>Day-wise Analytics</h2>
            {historicalStats.length > 0 ? (
                <div className="historical-container">
                    <div className="calendar-picker-wrapper">
                        <div className="calendar-picker-left">
                            <span className="calendar-label">Select Date:</span>
                            <DatePicker
                                selected={activeDayData ? parseISO(activeDayData.date) : new Date()}
                                onChange={handleDateChange}
                                minDate={minDate}
                                maxDate={maxDate}
                                dateFormat="dd MMM yyyy"
                                className="analytics-datepicker"
                            />
                        </div>
                        <span className="calendar-hint">
                            * Records are available for the past 15 days
                        </span>
                    </div>

                    <div className="historical-content">
                        <div className="day-views-container">
                            <div className="stat-card day-views">
                                <h3>Total Views</h3>
                                <p>{activeDayData.views}</p>
                            </div>
                            <div className="stat-card day-views">
                                <h3>Total Applies</h3>
                                <p>{activeDayData.applies}</p>
                            </div>
                            <div className="stat-card day-views">
                                <h3>Total Jobs Created</h3>
                                <p>{activeDayData.jobsCreated}</p>
                            </div>
                        </div>

                        <div className="day-searches">
                            <h3>Top Searches ({activeDateIndex === 0 ? 'Today' : formatDate(activeDayData.date)})</h3>
                            <div className="searches-container" style={{ marginTop: '1rem' }}>
                                {activeDayData.topSearches.length > 0 ? (
                                    <ul className="search-list">
                                        {activeDayData.topSearches.map((s, idx) => (
                                            <li key={idx}>
                                                <span className="search-keyword">"{s.keyword}"</span>
                                                <span className="search-count">{s.count} searches</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="no-data">No searches recorded on this day.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            ) : <p>Loading historical stats...</p>}
        </div>
    );
}

export default AnalyticsDashboard;
