import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import { API_BASE_URL } from './config';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Legend, BarChart, Bar 
} from 'recharts';
import './AnalyticsDashboard.css';

function AnalyticsDashboard() {
    const [websiteStats, setWebsiteStats] = useState(null);
    const [historicalStats, setHistoricalStats] = useState([]);
    const [activeDayData, setActiveDayData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedMetric, setSelectedMetric] = useState('views');
    const [viewType, setViewType] = useState('grid'); // 'grid' or 'graph'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/analytics/website`)
            .then(res => res.json())
            .then(data => setWebsiteStats(data))
            .catch(console.error);

        fetch(`${API_BASE_URL}/api/analytics/historical`)
            .then(res => res.json())
            .then(data => {
                setHistoricalStats(data);
                if (data.length > 0) setActiveDayData(data[0]);
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handleDateChange = (date) => {
        if (!date) return;
        setSelectedDate(date);
        const selectedDateStr = format(date, 'yyyy-MM-dd');
        const found = historicalStats.find(stat => stat.date === selectedDateStr);
        setActiveDayData(found || null);
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
        } else if (selectedMetric === 'mentors') {
            last1Hour = websiteStats.last1HourMentors;
            today = websiteStats.todayMentors;
            last7Days = websiteStats.last7DaysMentors;
        } else if (selectedMetric === 'mentorApplicants') {
            last1Hour = websiteStats.last1HourMentorApplicants;
            today = websiteStats.todayMentorApplicants;
            last7Days = websiteStats.last7DaysMentorApplicants;
        } else if (selectedMetric === 'sessions') {
            last1Hour = websiteStats.last1HourSessions;
            today = websiteStats.todaySessions;
            last7Days = websiteStats.last7DaysSessions;
        } else if (selectedMetric === 'joins') {
            last1Hour = websiteStats.last1HourSessionJoins;
            today = websiteStats.todaySessionJoins;
            last7Days = websiteStats.last7DaysSessionJoins;
        }

        return (
            <div className="stats-grid breakdown-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <h3>Last 1 Hour</h3>
                    <p>{last1Hour || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Today</h3>
                    <p>{today || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Last 7 Days</h3>
                    <p>{last7Days || 0}</p>
                </div>
            </div>
        );
    };

    const renderGraph = () => {
        if (!historicalStats || historicalStats.length === 0) return null;

        const chartData = [...historicalStats].reverse().map(day => ({
            name: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: day.views,
            applies: day.applies,
            jobs: day.jobsCreated,
            mentors: day.mentorsJoined,
            applicants: day.mentorApplicants,
            sessions: day.freeSessionsCreated,
            joins: day.sessionJoins
        }));

        const metricMap = {
            views: { key: 'views', color: '#1e3c72', label: 'Views' },
            applies: { key: 'applies', color: '#10b981', label: 'Applies' },
            jobs: { key: 'jobs', color: '#f59e0b', label: 'Jobs Created' },
            mentors: { key: 'mentors', color: '#8b5cf6', label: 'Mentors Joined' },
            mentorApplicants: { key: 'applicants', color: '#ec4899', label: 'Mentor Applicants' },
            sessions: { key: 'sessions', color: '#f97316', label: 'Sessions Created' },
            joins: { key: 'joins', color: '#3b82f6', label: 'Session Joins' }
        };

        const activeMetric = metricMap[selectedMetric];

        return (
            <div className="graph-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey={activeMetric.key} stroke={activeMetric.color} fill={activeMetric.color} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const [expandedSections, setExpandedSections] = useState({
        lifetime: true,
        active: false,
        recent: false,
        daywise: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="analytics-container">
            {websiteStats ? (
                <>
                    <div className={`analytics-section ${expandedSections.lifetime ? 'expanded' : ''}`}>
                        <div className="analytics-section-header" onClick={() => toggleSection('lifetime')}>
                            <h2>Lifetime Overview</h2>
                            <span className="expand-icon">{expandedSections.lifetime ? '−' : '+'}</span>
                        </div>
                        {expandedSections.lifetime && (
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
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
                                    <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Total Mentors</h3>
                                    <p style={{ color: 'white' }}>{websiteStats.lifetimeMentors}</p>
                                </div>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
                                    <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Mentor Applicants</h3>
                                    <p style={{ color: 'white' }}>{websiteStats.lifetimeMentorApplicants}</p>
                                </div>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
                                    <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Total Sessions Created</h3>
                                    <p style={{ color: 'white' }}>{websiteStats.lifetimeSessions || 0}</p>
                                </div>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
                                    <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Total Session Joins</h3>
                                    <p style={{ color: 'white' }}>{websiteStats.lifetimeSessionJoins || 0}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`analytics-section ${expandedSections.active ? 'expanded' : ''}`}>
                        <div className="analytics-section-header" onClick={() => toggleSection('active')}>
                            <h2>Active Stats</h2>
                            <span className="expand-icon">{expandedSections.active ? '−' : '+'}</span>
                        </div>
                        {expandedSections.active && (
                            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                                    <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Active Jobs</h3>
                                    <p style={{ color: 'white' }}>{websiteStats.activeJobs || 0}</p>
                                </div>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
                                    <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Active Mentors</h3>
                                    <p style={{ color: 'white' }}>{websiteStats.activeMentors || 0}</p>
                                </div>
                                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white' }}>
                                    <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Active Sessions</h3>
                                    <p style={{ color: 'white' }}>{websiteStats.activeSessions || 0}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`analytics-section ${expandedSections.recent ? 'expanded' : ''}`}>
                        <div className="analytics-section-header" onClick={() => toggleSection('recent')}>
                            <h2>Recent Activity Breakdown</h2>
                            <span className="expand-icon">{expandedSections.recent ? '−' : '+'}</span>
                        </div>
                        {expandedSections.recent && renderMetricGrid()}
                    </div>

                    <div className={`analytics-section ${expandedSections.daywise ? 'expanded' : ''}`}>
                        <div className="analytics-section-header" onClick={() => toggleSection('daywise')}>
                            <h2>Day-wise Analytics</h2>
                            <span className="expand-icon">{expandedSections.daywise ? '−' : '+'}</span>
                        </div>
                        {expandedSections.daywise && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="view-toggle-group" style={{ 
                                            display: 'flex', 
                                            background: '#f1f5f9', 
                                            padding: '4px', 
                                            borderRadius: '10px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <button 
                                                onClick={() => setViewType('grid')}
                                                style={{
                                                    padding: '6px 16px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: viewType === 'grid' ? 'white' : 'transparent',
                                                    boxShadow: viewType === 'grid' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                    color: viewType === 'grid' ? '#1e3c72' : '#64748b',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Grid View
                                            </button>
                                            <button 
                                                onClick={() => setViewType('graph')}
                                                style={{
                                                    padding: '6px 16px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: viewType === 'graph' ? 'white' : 'transparent',
                                                    boxShadow: viewType === 'graph' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                    color: viewType === 'graph' ? '#1e3c72' : '#64748b',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Graph View
                                            </button>
                                        </div>
                                    </div>
                                    <select
                                        value={selectedMetric}
                                        onChange={(e) => setSelectedMetric(e.target.value)}
                                        style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500', color: '#1e293b', backgroundColor: 'white' }}
                                    >
                                        <option value="views">Website Traffic (Overall)</option>
                                        <option value="applies">Total Job Applies</option>
                                        <option value="jobs">Total Jobs Created</option>
                                        <option value="mentors">Mentors Joined</option>
                                        <option value="mentorApplicants">Mentor Applicants</option>
                                        <option value="sessions">Free Sessions Created</option>
                                        <option value="joins">Free Session Joins</option>
                                    </select>
                                </div>

                                {historicalStats.length > 0 ? (
                                    <div className="historical-container">
                                        <div className="calendar-picker-wrapper">
                                            <div className="calendar-picker-left">
                                                <span className="calendar-label">Select Date:</span>
                                                <DatePicker
                                                    selected={selectedDate}
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
                                        {viewType === 'graph' ? (
                                            renderGraph()
                                        ) : activeDayData ? (
                                            <div className="historical-content" style={{ padding: 0 }}>
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
                                                    <div className="stat-card day-views">
                                                        <h3>Mentors Joined</h3>
                                                        <p>{activeDayData.mentorsJoined}</p>
                                                    </div>
                                                    <div className="stat-card day-views">
                                                        <h3>Mentor Applicants</h3>
                                                        <p>{activeDayData.mentorApplicants}</p>
                                                    </div>
                                                    <div className="stat-card day-views">
                                                        <h3>Sessions Created</h3>
                                                        <p>{activeDayData.freeSessionsCreated || 0}</p>
                                                    </div>
                                                    <div className="stat-card day-views">
                                                        <h3>Session Joins</h3>
                                                        <p>{activeDayData.sessionJoins || 0}</p>
                                                    </div>
                                                </div>

                                                <div className="day-searches">
                                                    <h3>Top Searches ({formatDate(activeDayData.date)})</h3>
                                                    <div className="searches-container" style={{ marginTop: '1rem' }}>
                                                        {activeDayData.topSearches && activeDayData.topSearches.length > 0 ? (
                                                            <ul className="search-list">
                                                                {activeDayData.topSearches.map((search, idx) => (
                                                                    <li key={idx}>
                                                                        <span className="search-keyword">"{search.keyword}"</span>
                                                                        <span className="search-count">{search.count} searches</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="no-data">No searches recorded on this day.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="no-data-placeholder" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                                No analytics data available for the selected date.
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                ) : <p>Loading historical stats...</p>}
                            </>
                        )}
                    </div>
                </>
            ) : <p>Loading website stats...</p>}
        </div>
    );
}

export default AnalyticsDashboard;

