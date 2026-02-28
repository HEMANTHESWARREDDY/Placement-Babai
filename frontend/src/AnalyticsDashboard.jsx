import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import './AnalyticsDashboard.css';

function AnalyticsDashboard() {
    const [websiteStats, setWebsiteStats] = useState(null);
    const [historicalStats, setHistoricalStats] = useState([]);
    const [activeDateIndex, setActiveDateIndex] = useState(0);

    useEffect(() => {
        fetch('http://localhost:8080/api/analytics/website')
            .then(res => res.json())
            .then(data => setWebsiteStats(data))
            .catch(console.error);

        fetch('http://localhost:8080/api/analytics/historical')
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
    return (
        <div className="analytics-container">
            <h2>Website Traffic (Overall)</h2>
            {websiteStats ? (
                <>
                    <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                        <div className="stat-card">
                            <h3>Last 1 Hour</h3>
                            <p>{websiteStats.last1Hour}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Today</h3>
                            <p>{websiteStats.today}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Last 7 Days</h3>
                            <p>{websiteStats.last7Days}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Lifetime</h3>
                            <p>{websiteStats.lifetime}</p>
                        </div>
                    </div>

                    <h2>Total Job Applies</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Last 1 Hour</h3>
                            <p>{websiteStats.last1HourApplies}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Today</h3>
                            <p>{websiteStats.todayApplies}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Last 7 Days</h3>
                            <p>{websiteStats.last7DaysApplies}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Lifetime</h3>
                            <p>{websiteStats.lifetimeApplies}</p>
                        </div>
                    </div>
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
