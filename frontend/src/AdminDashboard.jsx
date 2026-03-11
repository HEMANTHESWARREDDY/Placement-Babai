import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from './config';
import './AdminDashboard.css';
import CustomSelect from './CustomSelect';
import AnalyticsDashboard from './AnalyticsDashboard';
import JobAnalytics from './JobAnalytics';
import AdminMentors from './AdminMentors';

const parseRangeLow = (str) => {
    if (!str) return null;
    const nums = str.match(/[\d.]+/g);
    return nums ? parseFloat(nums[0]) : null;
};

const parseRangeHigh = (str) => {
    if (!str) return null;
    const nums = str.match(/[\d.]+/g);
    return nums && nums.length > 1 ? parseFloat(nums[1]) : (nums ? parseFloat(nums[0]) : null);
};

const FILTERS = {
    role: [
        { label: '💻 Developer', value: 'Developer' },
        { label: '📊 Analyst', value: 'Analyst' },
        { label: '🤖 ML / AI', value: 'ML' },
        { label: '🔍 QA / Test', value: 'QA' },
        { label: '⚙️ DevOps', value: 'DevOps' },
        { label: '🎨 Design', value: 'Design' },
        { label: '📌 Other', value: 'Other' },
    ],
    experience: [
        { label: '🌱 Fresher', value: 'fresher' },
        { label: '📅 1–3 Yrs', value: '1-3' },
        { label: '📅 3+ Yrs', value: '3+' },
    ],
    company: [
        { label: '🏢 MNC', value: 'MNC' },
        { label: '🚀 Startup', value: 'Startup' },
    ],
    jobType: [
        { label: '💼 Full-time', value: 'Full-time' },
        { label: '⏰ Part-time', value: 'Part-time' },
        { label: '📋 Internship', value: 'Internship' },
        { label: '🔀 Hybrid', value: 'Hybrid' },
    ],
    salary: [
        { label: '💰 0–3 LPA', value: '0-3' },
        { label: '💰 3–6 LPA', value: '3-6' },
        { label: '💰 6–10 LPA', value: '6-10' },
        { label: '💰 10+ LPA', value: '10+' },
    ],
    datePosted: [
        { label: '🕒 Last 24 hours', value: '24h' },
        { label: '📅 Last 7 days', value: '7d' },
        { label: '🗓️ Last 30 days', value: '30d' },
    ],
    passoutYear: [
        { label: '🎓 2024', value: '2024' },
        { label: '🎓 2025', value: '2025' },
        { label: '🎓 2026', value: '2026' },
        { label: '🎓 Other', value: 'Other' },
    ],
    sort: [
        { label: '🕒 Newest First', value: 'newest' },
        { label: '📅 Oldest First', value: 'oldest' },
        { label: '🔤 Title: A-Z', value: 'az' },
        { label: '🔤 Title: Z-A', value: 'za' },
    ],
};

const EMPTY_FORM = {
    title: '',
    company: '',
    companyLogo: '',
    location: '',
    passoutYear: '',
    description: '',
    salary: '',
    experienceLevel: '',
    jobType: 'Full-time',
    role: 'Developer',
    companyType: 'MNC',
    category: '',
    skills: '',
    applyLink: '',
    responsibilities: '',
    requirements: '',
    expiryDate: '',
};

function AdminDashboard({ adminData, onLogout }) {
    const [jobs, setJobs] = useState([]);
    const [deletedJobs, setDeletedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletedLoading, setDeletedLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [sortType, setSortType] = useState('');
    const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'analytics', 'deleted'
    const [expandedAnalyticsJobId, setExpandedAnalyticsJobId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });
    const [autofillUrl, setAutofillUrl] = useState('');
    const [isAutofilling, setIsAutofilling] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    const [showKeyInput, setShowKeyInput] = useState(false);
    const retryTimerRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const toggleFilter = (group, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [group]: value === undefined || prev[group] === value ? undefined : value,
        }));
    };

    const hasActiveFilters = Object.values(activeFilters).some(Boolean) || !!sortType;

    useEffect(() => {
        fetchJobs();
        fetchDeletedJobs();
    }, []);

    useEffect(() => {
        if (!searchQuery || !searchQuery.trim()) return;
        const timer = setTimeout(() => {
            fetch(`${API_BASE_URL}/api/analytics/search?keyword=${encodeURIComponent(searchQuery.trim())}`, { method: 'POST' }).catch(() => { });
        }, 1000);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchJobs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/jobs`);
            const data = await response.json();
            setJobs(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeletedJobs = async () => {
        setDeletedLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/jobs/deleted`);
            const data = await response.json();
            setDeletedJobs(data);
        } catch (error) {
            console.error('Error fetching deleted jobs:', error);
        } finally {
            setDeletedLoading(false);
        }
    };

    const saveGeminiKey = (key) => {
        const trimmed = key.trim();
        localStorage.setItem('gemini_api_key', trimmed);
        setGeminiKey(trimmed);
        setShowKeyInput(false);
        showToast('Key saved! Testing it now...', 'success');
        // Auto-test after save
        setTimeout(() => testGeminiKey(trimmed), 500);
    };

    const testGeminiKey = async (keyToTest) => {
        const key = keyToTest || geminiKey || localStorage.getItem('gemini_api_key') || '';
        if (!key) { showToast('No API key set!', 'error'); return; }
        showToast('🔍 Testing API key...', 'success');
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Reply with the single word: WORKING' }] }],
                        generationConfig: { max_output_tokens: 10 }
                    })
                }
            );
            if (res.ok) {
                const d = await res.json();
                const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || '?';
                showToast(`✅ Key works! Gemini says: ${text.trim()}`, 'success');
            } else {
                const err = await res.json();
                const msg = err?.error?.message || `HTTP ${res.status}`;
                showToast(`❌ Key failed: ${msg.substring(0, 150)}`, 'error');
                console.error('Key test failed:', msg);
            }
        } catch (e) {
            showToast(`❌ Network error: ${e.message}`, 'error');
            console.error('Key test network error:', e);
        }
    };

    const handleAutofill = async () => {
        if (!autofillUrl || !autofillUrl.trim()) {
            showToast('Please paste a valid job link.', 'error');
            return;
        }
        if (retryCountdown > 0) return;

        const rawKeys = geminiKey || localStorage.getItem('gemini_api_key') || '';
        // Support multiple comma-separated keys — tries each until one works
        const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
        if (apiKeys.length === 0) {
            setShowKeyInput(true);
            showToast('Please enter your Gemini API key first.', 'error');
            return;
        }

        setIsAutofilling(true);
        try {
            const url = autofillUrl.trim();
            const prompt = `You are a job data extraction expert. Based on your knowledge of this specific job posting URL, extract ALL details and return a JSON object.

URL: ${url}

Return ONLY valid JSON (no markdown, no explanation) with these exact keys:
{
  "title": "exact job title from the posting",
  "company": "company name (e.g. PwC, IBM, TCS)",
  "location": "city, country (e.g. Bangalore, India)",
  "description": "professional 3-4 sentence role summary",
  "skills": "comma-separated required technical skills",
  "jobType": "Full-time or Full-time (Internship) or Part-time or Contract",
  "experienceLevel": "e.g. 1 - 3 Years or 0 - 1 Years (Entry Level / Student)",
  "salary": "e.g. Not Specified (Standard industry competitive pay) or 10 - 20 LPA",
  "category": "e.g. Data Science or Technology or Software Engineering / IT Operations",
  "role": "e.g. Data Science / Analytics or Developer / Engineer or Analyst",
  "companyType": "e.g. MNC (Large Enterprise) or Startup or Product Company",
  "responsibilities": "5 responsibilities, one per line, no bullet symbols",
  "requirements": "5 requirements, one per line, no bullet symbols",
  "passoutYear": "eligible graduation years e.g. 2021, 2022, 2023",
  "expiryDate": "application deadline or: Don't know",
  "companyLogo": "https://logo.clearbit.com/companyname.com"
}`;

            // Try each API key in order — if one hits quota, move to next
            let geminiRes = null;
            let lastMsg = '';
            for (let i = 0; i < apiKeys.length; i++) {
                const key = apiKeys[i];
                console.log(`Trying API key ${i + 1}/${apiKeys.length}...`);
                geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { response_mime_type: 'application/json' }
                        })
                    }
                );
                if (geminiRes.ok) break; // this key worked!
                const errBody = await geminiRes.json();
                lastMsg = errBody?.error?.message || `HTTP ${geminiRes.status}`;
                console.warn(`Key ${i + 1} failed: ${lastMsg}`);
                geminiRes = null; // mark as failed
            }

            if (!geminiRes) {
                // All keys exhausted
                const retryMatch = lastMsg.match(/retry in ([\d.]+)s/i);
                const waitSecs = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 3 : 65;
                setRetryCountdown(waitSecs);
                showToast(`⏳ All API keys rate-limited. Re-enables in ${waitSecs}s. Or add a key from a different Google account.`, 'error');
                let remaining = waitSecs;
                if (retryTimerRef.current) clearInterval(retryTimerRef.current);
                retryTimerRef.current = setInterval(() => {
                    remaining -= 1;
                    setRetryCountdown(remaining);
                    if (remaining <= 0) {
                        clearInterval(retryTimerRef.current);
                        retryTimerRef.current = null;
                        setRetryCountdown(0);
                        showToast('✅ Ready! Click Auto-Fill to try again.', 'success');
                    }
                }, 1000);
                return;
            }

            const geminiData = await geminiRes.json();
            const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            console.log('Gemini raw response:', rawText);

            // Parse JSON — strip markdown fences if present
            let jsonStr = rawText.trim();
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
            if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
            if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
            const data = JSON.parse(jsonStr.trim());

            setFormData(prev => ({
                ...prev,
                title: data.title || prev.title,
                company: data.company || prev.company,
                location: data.location || prev.location,
                description: data.description || prev.description,
                skills: data.skills || prev.skills,
                jobType: data.jobType || prev.jobType,
                experienceLevel: data.experienceLevel || prev.experienceLevel,
                salary: data.salary || prev.salary,
                category: data.category || prev.category,
                role: data.role || prev.role,
                companyType: data.companyType || prev.companyType,
                responsibilities: data.responsibilities || prev.responsibilities,
                requirements: data.requirements || prev.requirements,
                passoutYear: data.passoutYear || prev.passoutYear,
                expiryDate: data.expiryDate || prev.expiryDate,
                companyLogo: data.companyLogo || prev.companyLogo,
                applyLink: url,
            }));
            showToast('✅ Form autofilled by Gemini AI!', 'success');

        } catch (error) {
            console.error('Autofill error:', error);
            showToast('Failed to parse Gemini response. Check console.', 'error');
        } finally {
            setIsAutofilling(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingJob
                ? `${API_BASE_URL}/api/jobs/${editingJob.id}`
                : `${API_BASE_URL}/api/jobs`;
            const method = editingJob ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchJobs();
                fetchDeletedJobs();
                resetForm();
                showToast(editingJob ? 'Job updated successfully!' : 'Job created successfully!', 'success');
            } else {
                showToast('Failed to save job', 'error');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            showToast('Failed to save job', 'error');
        }
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setFormData({
            title: job.title || '',
            company: job.company || '',
            companyLogo: job.companyLogo || '',
            location: job.location || '',
            passoutYear: job.passoutYear || '',
            description: job.description || '',
            salary: job.salary || '',
            experienceLevel: job.experienceLevel || '',
            jobType: job.jobType || 'Full-time',
            role: job.role || 'Developer',
            companyType: job.companyType || 'MNC',
            category: job.category || '',
            skills: job.skills || '',
            applyLink: job.applyLink || '',
            responsibilities: job.responsibilities || '',
            requirements: job.requirements || '',
            expiryDate: job.expiryDate || '',
        });
        setActiveTab('jobs');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRestore = (id) => {
        setConfirmDialog({
            show: true,
            message: 'Are you sure you want to restore (revoke) this job?',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/jobs/${id}/restore`, { method: 'PUT' });
                    if (response.ok) {
                        fetchJobs();
                        fetchDeletedJobs();
                        showToast('Job restored successfully!', 'success');
                    } else {
                        showToast('Failed to restore job', 'error');
                    }
                } catch (error) {
                    console.error('Error restoring job:', error);
                    showToast('Failed to restore job', 'error');
                }
            }
        });
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            show: true,
            message: 'Are you sure you want to delete this job?',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        fetchJobs();
                        fetchDeletedJobs();
                        showToast('Job deleted successfully!', 'success');
                    } else {
                        showToast('Failed to delete job', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting job:', error);
                    showToast('Failed to delete job', 'error');
                }
            }
        });
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingJob(null);
        setAutofillUrl('');
        setShowForm(false);
    };

    const filteredJobs = jobs.filter(job => {
        // 1. Search Query
        const sq = searchQuery.toLowerCase();
        const matchesSearch =
            (job.id && String(job.id).includes(sq)) ||
            (job.title?.toLowerCase().includes(sq) || '') ||
            (job.company?.toLowerCase().includes(sq) || '');
        if (!matchesSearch) return false;

        // 2. Role filter
        if (activeFilters.role) {
            const roleVal = activeFilters.role.toLowerCase();
            const titleLow = (job.title || '').toLowerCase();
            const catLow = (job.category || '').toLowerCase();
            const jobRole = (job.role || '').toLowerCase();
            const skillsLow = (job.skills || '').toLowerCase();
            const matched =
                jobRole.includes(roleVal) || titleLow.includes(roleVal) || catLow.includes(roleVal) || skillsLow.includes(roleVal) ||
                (roleVal === 'developer' && (titleLow.includes('dev') || titleLow.includes('engineer') || titleLow.includes('full stack') || titleLow.includes('backend') || titleLow.includes('frontend'))) ||
                (roleVal === 'ml' && (titleLow.includes('machine learning') || titleLow.includes(' ml ') || titleLow.includes('data scientist') || titleLow.includes('ai ') || skillsLow.includes('tensorflow') || skillsLow.includes('pytorch'))) ||
                (roleVal === 'qa' && (titleLow.includes('test') || titleLow.includes('qa') || titleLow.includes('quality'))) ||
                (roleVal === 'devops' && (titleLow.includes('devops') || titleLow.includes('cloud') || titleLow.includes('sre') || skillsLow.includes('docker') || skillsLow.includes('kubernetes'))) ||
                (roleVal === 'analyst' && (titleLow.includes('analyst') || titleLow.includes('bi ') || titleLow.includes('data'))) ||
                (roleVal === 'design' && (titleLow.includes('design') || titleLow.includes('ui') || titleLow.includes('ux')));
            if (!matched) return false;
        }

        // 3. Company filter
        if (activeFilters.company) {
            const ctJob = (job.companyType || '').toLowerCase();
            if (!ctJob.includes(activeFilters.company.toLowerCase())) return false;
        }

        // 4. Job Type filter
        if (activeFilters.jobType && job.jobType !== activeFilters.jobType) return false;

        // 5. Salary package filter
        if (activeFilters.salary) {
            const salaryStr = job.salary || '';
            if (salaryStr) {
                const low = parseRangeLow(salaryStr);
                const high = parseRangeHigh(salaryStr);
                if (low !== null) {
                    const jobHigh = high ?? low;
                    if (activeFilters.salary === '0-3' && !(low < 3)) return false;
                    if (activeFilters.salary === '3-6' && !(low < 6 && jobHigh >= 3)) return false;
                    if (activeFilters.salary === '6-10' && !(low < 10 && jobHigh >= 6)) return false;
                    if (activeFilters.salary === '10+' && !(jobHigh >= 10)) return false;
                }
            }
        }

        // 6. Experience filter
        if (activeFilters.experience) {
            const expStr = (job.experienceLevel || '').toLowerCase();
            const isFresher = expStr.includes('fresh') || expStr.includes('0 - 0') || expStr === '0';
            if (activeFilters.experience === 'fresher') {
                if (!isFresher) return false;
            } else {
                if (isFresher) return false;
                const expLow = parseRangeLow(expStr);
                const expHigh = parseRangeHigh(expStr) ?? expLow;
                if (expLow !== null) {
                    if (activeFilters.experience === '1-3' && !(expLow < 3 && (expHigh ?? expLow) >= 1)) return false;
                    if (activeFilters.experience === '3+' && !((expHigh ?? expLow) >= 3)) return false;
                }
            }
        }

        // 7. Date posted filter
        if (activeFilters.datePosted) {
            if (!job.postedDate) return false;
            const jobDate = new Date(job.postedDate);
            const now = new Date();
            const diffTime = Math.abs(now - jobDate);
            const oneDay = 24 * 60 * 60 * 1000;

            if (activeFilters.datePosted === '24h') {
                if (diffTime > oneDay) return false;
            } else if (activeFilters.datePosted === '7d') {
                if (diffTime > 7 * oneDay) return false;
            } else if (activeFilters.datePosted === '30d') {
                if (diffTime > 30 * oneDay) return false;
            }
        }
        // 8. Passout Year filter
        if (activeFilters.passoutYear) {
            const pyJob = job.passoutYear || '';
            if (activeFilters.passoutYear === 'Other') {
                if (!pyJob || pyJob.includes('2024') || pyJob.includes('2025') || pyJob.includes('2026')) {
                    return false;
                }
            } else {
                if (!pyJob.includes(activeFilters.passoutYear)) return false;
            }
        }

        return true;
    }).sort((a, b) => {
        const type = sortType || 'newest';
        if (type === 'newest') {
            return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
        } else if (type === 'oldest') {
            return new Date(a.postedDate || 0) - new Date(b.postedDate || 0);
        } else if (type === 'az') {
            return (a.title || '').localeCompare(b.title || '');
        } else if (type === 'za') {
            return (b.title || '').localeCompare(a.title || '');
        }
        return 0;
    });

    return (
        <div className="admin-dashboard">
            {/* Custom Toast Notification */}
            {toast.show && (
                <div className={`admin-toast admin-toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}

            {/* Custom Confirm Modal */}
            {confirmDialog.show && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <h3>Confirm Action</h3>
                        <p>{confirmDialog.message}</p>
                        <div className="admin-modal-actions">
                            <button className="btn-cancel" onClick={() => setConfirmDialog({ show: false, message: '', onConfirm: null })}>Cancel</button>
                            <button className="btn-confirm-danger" onClick={() => {
                                if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                                setConfirmDialog({ show: false, message: '', onConfirm: null });
                            }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-content">
                    <div className="admin-logo-group">
                        <div className="admin-logo" onClick={onLogout} title="Go to Home">
                            <img src="/logos/logo.png" alt="PlacementBabai" className="admin-brand-logo" />
                        </div>
                        <div>
                            <h1>Admin Dashboard</h1>
                            <p>Welcome, {adminData.username}!</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button
                            className={`btn-tab ${activeTab === 'jobs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('jobs')}
                        >
                            📋 Jobs
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            📈 Analytics
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'deleted' ? 'active' : ''}`}
                            onClick={() => setActiveTab('deleted')}
                        >
                            🗑️ History
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'mentors' ? 'active' : ''}`}
                            onClick={() => setActiveTab('mentors')}
                        >
                            👨‍🏫 Mentors
                        </button>
                        <button className="btn-primary" onClick={() => { setActiveTab('jobs'); setShowForm(!showForm); if (showForm) resetForm(); }}>
                            {showForm ? '✕ Cancel' : '+ Add New Job'}
                        </button>
                        <button className="btn-logout" onClick={onLogout}>Logout</button>
                    </div>
                </div>
            </div>

            {activeTab === 'analytics' ? (
                <AnalyticsDashboard />
            ) : activeTab === 'mentors' ? (
                <AdminMentors />
            ) : activeTab === 'deleted' ? (
                <div className="jobs-management">
                    <div className="jobs-list-header">
                        <h2>Deleted Jobs History ({deletedJobs.length})</h2>
                        <p style={{ color: '#64748b' }}>Jobs are permanently deleted after 15 days.</p>
                    </div>
                    {deletedLoading ? (
                        <div className="loading">Loading deleted jobs...</div>
                    ) : (
                        <div className="jobs-table-container">
                            <table className="jobs-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Company</th>
                                        <th>Deleted At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deletedJobs.length > 0 ? (
                                        deletedJobs.map((job) => (
                                            <tr key={job.id}>
                                                <td>{job.id}</td>
                                                <td><strong>{job.title}</strong></td>
                                                <td>{job.company}</td>
                                                <td>{job.deletedAt ? new Date(job.deletedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="btn-edit" onClick={() => handleEdit(job)}>✏️ Edit</button>
                                                        <button className="btn-primary" onClick={() => handleRestore(job.id)}>↩️ Revoke</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No deleted jobs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Job Form */}
                    {showForm && (
                        <div className="job-form-container">
                            <div className="form-header-with-autofill">
                                <h2>{editingJob ? '✏️ Edit Job' : '➕ Create New Job'}</h2>
                                {!editingJob && (
                                    <div className="autofill-container">
                                        <input
                                            type="url"
                                            placeholder="Paste job link to auto-fill with Gemini AI..."
                                            value={autofillUrl}
                                            onChange={(e) => setAutofillUrl(e.target.value)}
                                            className="autofill-input"
                                        />
                                        <button
                                            type="button"
                                            className="btn-autofill"
                                            onClick={handleAutofill}
                                            disabled={isAutofilling || retryCountdown > 0}
                                            title="Auto-fill using Gemini AI"
                                        >
                                            {isAutofilling
                                                ? '⏳ Extracting...'
                                                : retryCountdown > 0
                                                    ? `⏳ Retry in ${retryCountdown}s`
                                                    : '✨ Auto-Fill'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-key-setup"
                                            onClick={() => setShowKeyInput(v => !v)}
                                            title={geminiKey ? 'Gemini key is set ✅ (click to change)' : 'Set Gemini API key'}
                                            style={{
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '8px',
                                                border: `2px solid ${geminiKey ? '#10b981' : '#f59e0b'}`,
                                                background: geminiKey ? '#d1fae5' : '#fef3c7',
                                                color: geminiKey ? '#065f46' : '#92400e',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '0.85rem',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {geminiKey ? '🔑 Key Set ✅' : '🔑 Set Key'}
                                        </button>
                                    </div>
                                )}
                                {showKeyInput && !editingJob && (
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                        padding: '0.75rem 1rem', background: '#fffbeb',
                                        border: '2px solid #f59e0b', borderRadius: '10px',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: '600' }}>
                                            ⚠️ If all keys show quota errors, they are from the same Google project. Add keys from different Google accounts below (comma-separated):
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                placeholder="key1, key2, key3 (from different Google accounts for more quota)"
                                                defaultValue={geminiKey}
                                                id="gemini-key-input"
                                                style={{
                                                    flex: 1, padding: '0.4rem 0.75rem',
                                                    border: '1px solid #cbd5e1', borderRadius: '6px',
                                                    fontSize: '0.82rem'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const val = document.getElementById('gemini-key-input').value.trim();
                                                    if (val) saveGeminiKey(val);
                                                    else showToast('Key cannot be empty', 'error');
                                                }}
                                                style={{
                                                    padding: '0.4rem 1rem', background: '#3b82f6',
                                                    color: '#fff', border: 'none', borderRadius: '6px',
                                                    cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >Save</button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const val = document.getElementById('gemini-key-input').value.trim() || geminiKey;
                                                    testGeminiKey(val);
                                                }}
                                                style={{
                                                    padding: '0.4rem 0.75rem', background: '#10b981',
                                                    color: '#fff', border: 'none', borderRadius: '6px',
                                                    cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >🔍 Test</button>
                                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                                                style={{ fontSize: '0.8rem', color: '#3b82f6', whiteSpace: 'nowrap' }}>
                                                Get new key →
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleSubmit} className="job-form">

                                {/* Row 1: Title + Company */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Job Title *</label>
                                        <input type="text" name="title" value={formData.title}
                                            onChange={handleInputChange} required
                                            placeholder="e.g., Java Full Stack Developer" />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Name *</label>
                                        <input type="text" name="company" value={formData.company}
                                            onChange={handleInputChange} required
                                            placeholder="e.g., TCS Digital" />
                                    </div>
                                </div>

                                {/* Row 2: Location + Salary */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Location *</label>
                                        <input type="text" name="location" value={formData.location}
                                            onChange={handleInputChange} required
                                            placeholder="e.g., Hyderabad, India" />
                                    </div>
                                    <div className="form-group">
                                        <label>Package *</label>
                                        <input type="text" name="salary" value={formData.salary}
                                            onChange={handleInputChange} required
                                            placeholder="e.g., 10 - 20 LPA" />
                                    </div>
                                </div>

                                {/* Row 3: Experience + Job Type */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Experience *</label>
                                        <input type="text" name="experienceLevel" value={formData.experienceLevel}
                                            onChange={handleInputChange} required
                                            placeholder="e.g., 3 - 7 Years" />
                                    </div>
                                    <div className="form-group">
                                        <label>Job Type *</label>
                                        <select name="jobType" value={formData.jobType} onChange={handleInputChange} required>
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                            <option value="Remote">Remote</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Row 4: Role + Company Type */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Role / Function *</label>
                                        <select name="role" value={formData.role} onChange={handleInputChange} required>
                                            <option value="Developer">Developer / Engineer</option>
                                            <option value="Analyst">Analyst / BI</option>
                                            <option value="ML">ML / AI / Data Science</option>
                                            <option value="QA">QA / Testing</option>
                                            <option value="DevOps">DevOps / Cloud / SRE</option>
                                            <option value="Design">UI / UX / Design</option>
                                            <option value="Management">Management / PM</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Company Type *</label>
                                        <select name="companyType" value={formData.companyType} onChange={handleInputChange} required>
                                            <option value="MNC">MNC (Large Enterprise)</option>
                                            <option value="Startup">Startup</option>
                                            <option value="Product">Product Company</option>
                                            <option value="Service">Service / IT Firm</option>
                                            <option value="Government">Government / PSU</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Category *</label>
                                        <input type="text" name="category" value={formData.category}
                                            onChange={handleInputChange} required
                                            placeholder="e.g., Data Science" />
                                    </div>
                                    <div className="form-group">
                                        <label>Apply Link (Job Opening URL) *</label>
                                        <input type="url" name="applyLink" value={formData.applyLink}
                                            onChange={handleInputChange}
                                            placeholder="https://company.com/careers/job-id" />
                                    </div>
                                </div>

                                {/* Row 6: Passout Year + Expiry Date */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Eligible Passout Years <span className="form-hint">(comma-separated)</span></label>
                                        <input type="text" name="passoutYear" value={formData.passoutYear}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 2024, 2025" />
                                    </div>
                                    <div className="form-group">
                                        <label>Job Expiry Date <span className="form-hint">(optional)</span></label>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', marginTop: '0.5rem' }}>
                                            <label style={{ margin: 0, fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input type="radio"
                                                    name="expiryType"
                                                    checked={formData.expiryDate !== "Don't know"}
                                                    onChange={() => setFormData({ ...formData, expiryDate: '' })}
                                                />
                                                Specific Date
                                            </label>
                                            <label style={{ margin: 0, fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input type="radio"
                                                    name="expiryType"
                                                    checked={formData.expiryDate === "Don't know"}
                                                    onChange={() => setFormData({ ...formData, expiryDate: "Don't know" })}
                                                />
                                                Don't know
                                            </label>
                                        </div>
                                        {formData.expiryDate !== "Don't know" && (
                                            <input type="date" name="expiryDate" value={formData.expiryDate || ''}
                                                onChange={handleInputChange} style={{ marginTop: '0.5rem' }} />
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label>Job Description / About the Role</label>
                                    <textarea name="description" value={formData.description}
                                        onChange={handleInputChange} rows="4"
                                        placeholder="Brief overview of the role and what the candidate will be doing..." />
                                </div>

                                {/* Responsibilities */}
                                <div className="form-group">
                                    <label>Key Responsibilities <span className="form-hint">(one per line)</span></label>
                                    <textarea name="responsibilities" value={formData.responsibilities}
                                        onChange={handleInputChange} rows="5"
                                        placeholder={"Design and develop scalable backend services\nCollaborate with cross-functional teams\nWrite clean, maintainable code\nParticipate in code reviews"} />
                                </div>

                                {/* Requirements */}
                                <div className="form-group">
                                    <label>Requirements & Qualifications <span className="form-hint">(one per line)</span></label>
                                    <textarea name="requirements" value={formData.requirements}
                                        onChange={handleInputChange} rows="5"
                                        placeholder={"Bachelor's degree in Computer Science or related field\n2+ years of experience in Java development\nStrong knowledge of Spring Boot\nExperience with SQL and NoSQL databases"} />
                                </div>

                                {/* Skills */}
                                <div className="form-group">
                                    <label>Required Skills <span className="form-hint">(comma-separated)</span></label>
                                    <input type="text" name="skills" value={formData.skills}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Java, Spring Boot, React, MySQL, AWS" />
                                </div>

                                {/* Company Logo */}
                                <div className="form-group">
                                    <label>Company Logo URL <span className="form-hint">(optional)</span></label>
                                    <input type="url" name="companyLogo" value={formData.companyLogo}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/logo.png" />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-submit">
                                        {editingJob ? '✅ Update Job' : '🚀 Create Job'}
                                    </button>
                                    <button type="button" className="btn-cancel" onClick={resetForm}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Jobs List */}
                    <div className="jobs-management">
                        <div className="jobs-list-header">
                            <h2>All Jobs ({filteredJobs.length})</h2>
                            <div className="jobs-filter-controls">
                                <input
                                    type="text"
                                    placeholder="Search by ID, title, or company..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="admin-search-input"
                                />
                            </div>
                        </div>

                        {/* Advanced Filter Bar */}
                        <div className="admin-filter-bar">
                            <span className="filter-bar-label" style={{ color: '#334155' }}>🎛️ Filters</span>
                            <CustomSelect
                                options={FILTERS.role}
                                value={activeFilters.role}
                                onChange={(val) => toggleFilter('role', val)}
                                placeholder="👤 Role"
                            />
                            <CustomSelect
                                options={FILTERS.experience}
                                value={activeFilters.experience}
                                onChange={(val) => toggleFilter('experience', val)}
                                placeholder="🎓 Experience"
                            />
                            <CustomSelect
                                options={FILTERS.company}
                                value={activeFilters.company}
                                onChange={(val) => toggleFilter('company', val)}
                                placeholder="🏢 Company"
                            />
                            <CustomSelect
                                options={FILTERS.jobType}
                                value={activeFilters.jobType}
                                onChange={(val) => toggleFilter('jobType', val)}
                                placeholder="💼 Job Type"
                            />
                            <CustomSelect
                                options={FILTERS.salary}
                                value={activeFilters.salary}
                                onChange={(val) => toggleFilter('salary', val)}
                                placeholder="💰 Package"
                            />
                            <CustomSelect
                                options={FILTERS.datePosted}
                                value={activeFilters.datePosted}
                                onChange={(val) => toggleFilter('datePosted', val)}
                                placeholder="🗓️ Date Posted"
                            />
                            <CustomSelect
                                options={FILTERS.passoutYear}
                                value={activeFilters.passoutYear}
                                onChange={(val) => toggleFilter('passoutYear', val)}
                                placeholder="🎓 Passout Year"
                            />
                            <CustomSelect
                                options={FILTERS.sort}
                                value={sortType}
                                onChange={(val) => setSortType(val === sortType ? '' : val)}
                                placeholder="Sort By"
                            />

                            {hasActiveFilters && (
                                <button className="filter-clear-btn" onClick={() => { setActiveFilters({}); setSortType(''); }}>
                                    ✕ Clear
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading">Loading jobs...</div>
                        ) : (
                            <div className="jobs-table-container">
                                <table className="jobs-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Title</th>
                                            <th>Company</th>
                                            <th>Location</th>
                                            <th>Salary</th>
                                            <th>Type</th>
                                            <th>Apply Link</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredJobs.length > 0 ? (
                                            filteredJobs.map((job) => (
                                                <tr key={job.id}>
                                                    <td>{job.id}</td>
                                                    <td><strong>{job.title}</strong></td>
                                                    <td>{job.company}</td>
                                                    <td>{job.location}</td>
                                                    <td>{job.salary || job.experienceLevel || '—'}</td>
                                                    <td><span className="job-type-badge">{job.jobType}</span></td>
                                                    <td>
                                                        {job.applyLink
                                                            ? <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="apply-link-cell">🔗 View</a>
                                                            : <span className="no-link">—</span>}
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button className="btn-analytics" onClick={() => setExpandedAnalyticsJobId(job.id)}>📊 Data</button>
                                                            <button className="btn-edit" onClick={() => handleEdit(job)}>✏️ Edit</button>
                                                            <button className="btn-delete" onClick={() => handleDelete(job.id)}>🗑️ Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No jobs match your search/filter criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {expandedAnalyticsJobId && (
                <JobAnalytics
                    jobId={expandedAnalyticsJobId}
                    postedDate={jobs.find(j => j.id === expandedAnalyticsJobId)?.postedDate}
                    expiryDate={jobs.find(j => j.id === expandedAnalyticsJobId)?.expiryDate}
                    onClose={() => setExpandedAnalyticsJobId(null)}
                />
            )}
        </div>
    );
}

export default AdminDashboard;
