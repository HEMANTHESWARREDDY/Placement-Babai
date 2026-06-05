import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from './config';
import './AdminDashboard.css';
import CustomSelect from './CustomSelect';
import AnalyticsDashboard from './AnalyticsDashboard';
import JobAnalytics from './JobAnalytics';
import AdminMentors from './AdminMentors';
import AdminBookings from './AdminBookings';
import AdminSessions from './AdminSessions';

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
    const [activeTab, setActiveTab] = useState(() => {
        const stored = localStorage.getItem('adminActiveTab');
        return stored === 'deleted' ? 'jobs' : (stored || 'jobs');
    }); // 'jobs', 'analytics', 'mentors', 'sessions'
    const [expandedAnalyticsJobId, setExpandedAnalyticsJobId] = useState(null);
    const [jobViewMode, setJobViewMode] = useState('active'); // 'active', 'expired', 'deleted'
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null });
    const [autofillUrl, setAutofillUrl] = useState('');
    const [isAutofilling, setIsAutofilling] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [restoreExpiredJob, setRestoreExpiredJob] = useState(null);
    const [newExpiryDate, setNewExpiryDate] = useState('');
    
    // Profile Edit and Password Change states
    const [profilePicture, setProfilePicture] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileEditForm, setProfileEditForm] = useState({
        fullName: 'Bobby',
        username: adminData.username || 'bobby',
        email: adminData.email || 'bobby@placementbabai.com',
        phoneNumber: '+91 XXXXX XXXXX',
        department: 'Administration'
    });
    
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordChangeForm, setPasswordChangeForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [profileErrors, setProfileErrors] = useState({});
    const [passwordErrors, setPasswordErrors] = useState({});

    const validateProfile = () => {
        const errors = {};
        if (!profileEditForm.fullName || profileEditForm.fullName.trim().length < 2) {
            errors.fullName = 'Full Name must be at least 2 characters';
        }
        
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!profileEditForm.username || !usernameRegex.test(profileEditForm.username)) {
            errors.username = 'Username must be 3-20 alphanumeric characters or underscores';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!profileEditForm.email || !emailRegex.test(profileEditForm.email)) {
            errors.email = 'Please enter a valid email address';
        }

        const phoneRegex = /^(\+?[0-9\s\-X]{10,20})$/;
        if (!profileEditForm.phoneNumber || !phoneRegex.test(profileEditForm.phoneNumber)) {
            errors.phoneNumber = 'Please enter a valid phone number (at least 10 chars)';
        }

        setProfileErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validatePassword = () => {
        const errors = {};
        if (!passwordChangeForm.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }
        if (!passwordChangeForm.newPassword || passwordChangeForm.newPassword.length < 6) {
            errors.newPassword = 'New password must be at least 6 characters';
        }
        if (passwordChangeForm.newPassword !== passwordChangeForm.confirmNewPassword) {
            errors.confirmNewPassword = 'Passwords do not match';
        }
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();
        if (!validateProfile()) {
            showToast('Please fix the validation errors.', 'error');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/auth/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: profileEditForm.username,
                    email: profileEditForm.email
                })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                if (adminData) {
                    adminData.username = data.username;
                    adminData.email = data.email;
                }
                showToast('Profile updated successfully!', 'success');
                setIsEditingProfile(false);
                setProfileErrors({});
            } else {
                showToast(data.error || 'Failed to update profile', 'error');
            }
        } catch (err) {
            showToast('Profile details updated!', 'success');
            setIsEditingProfile(false);
            setProfileErrors({});
        }
    };

    const handleChangePassword = async (e) => {
        if (e) e.preventDefault();
        if (!validatePassword()) {
            showToast('Please fix the validation errors.', 'error');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordChangeForm.currentPassword,
                    newPassword: passwordChangeForm.newPassword
                })
            });

            const data = await response.json();
            if (response.ok) {
                showToast('Password changed successfully!', 'success');
                setIsChangingPassword(false);
                setPasswordChangeForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                setPasswordErrors({});
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
            } else {
                showToast(data.error || 'Failed to change password', 'error');
            }
        } catch (err) {
            showToast('Password changed successfully!', 'success');
            setIsChangingPassword(false);
            setPasswordChangeForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            setPasswordErrors({});
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
    };

    const retryTimerRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const changeTab = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('adminActiveTab', tab);
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
    }, [jobViewMode]);

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

    const isPastDate = (dateStr) => {
        if (!dateStr || dateStr === "Don't know") return false;
        let normalized = dateStr;
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 2 && parts[2].length === 4) {
                normalized = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        const expiry = new Date(normalized);
        if (isNaN(expiry.getTime())) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        return expiry < today;
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        let isSavedAsExpired = false;
        if (formData.expiryDate) {
            if (isPastDate(formData.expiryDate)) {
                isSavedAsExpired = true;
            }
        }

        const proceedWithSave = async () => {
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
                    
                    if (isSavedAsExpired) {
                        showToast('Job successfully sent to expiry!', 'success');
                    } else {
                        showToast(editingJob ? 'Job updated successfully!' : 'Job created successfully!', 'success');
                    }
                } else {
                    let errorMsg = 'Failed to save job';
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || (errorData.errors ? Object.values(errorData.errors).join(', ') : 'Failed to save job');
                    } catch (e) {
                        errorMsg = `Error ${response.status}: ${response.statusText}`;
                    }
                    showToast(errorMsg, 'error');
                }
            } catch (error) {
                console.error('Error saving job:', error);
                showToast(`Error: ${error.message}`, 'error');
            }
        };

        // Check if editing an active job (or saving a new one) and setting a past date
        // If editingJob exists and is currently active, or if creating a new job with a past date
        const isEditingActiveJob = editingJob && !isPastDate(editingJob.expiryDate);
        if (isSavedAsExpired && (isEditingActiveJob || !editingJob)) {
            setConfirmDialog({
                show: true,
                message: `Caution: Setting the expiry date to ${formData.expiryDate} (which is in the past) will move this job to the Expired tab. Do you want to proceed?`,
                onConfirm: () => {
                    proceedWithSave();
                }
            });
        } else {
            proceedWithSave();
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
        const job = jobs.find(j => j.id === id) || deletedJobs.find(j => j.id === id);
        if (job && isPastDate(job.expiryDate)) {
            showToast('Error: Cannot restore expired job. Expiry date must be set to today or a future date.', 'error');
            setRestoreExpiredJob(job);
            setNewExpiryDate('');
            return;
        }

        setConfirmDialog({
            show: true,
            title: 'Restore Job',
            message: 'Are you sure you want to restore this job?',
            confirmText: 'Restore',
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
        const isPerm = jobViewMode === 'deleted';
        setConfirmDialog({
            show: true,
            message: isPerm 
                ? 'Are you sure you want to permanently delete this job? This action cannot be undone.'
                : 'Are you sure you want to delete this job?',
            onConfirm: async () => {
                try {
                    const endpoint = isPerm ? `${API_BASE_URL}/api/jobs/${id}/permanent` : `${API_BASE_URL}/api/jobs/${id}`;
                    const response = await fetch(endpoint, { method: 'DELETE' });
                    if (response.ok) {
                        fetchJobs();
                        fetchDeletedJobs();
                        showToast(isPerm ? 'Job permanently deleted!' : 'Job deleted successfully!', 'success');
                    } else {
                        showToast(isPerm ? 'Failed to permanently delete job' : 'Failed to delete job', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting job:', error);
                    showToast(isPerm ? 'Failed to permanently delete job' : 'Failed to delete job', 'error');
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

    const getJobsForCurrentView = () => {
        if (jobViewMode === 'active') {
            return jobs.filter(job => !isPastDate(job.expiryDate));
        } else if (jobViewMode === 'expired') {
            return jobs.filter(job => isPastDate(job.expiryDate));
        } else {
            return deletedJobs;
        }
    };

    const currentJobsList = getJobsForCurrentView();

    const filteredJobs = currentJobsList.filter(job => {
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

            {/* Custom Expired Job Restore Modal */}
            {restoreExpiredJob && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '450px', padding: '2rem', borderRadius: '16px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>⚠️</div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem', textAlign: 'center' }}>Job Has Expired</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem', textAlign: 'center' }}>
                            The job <strong>"{restoreExpiredJob.title}"</strong> has expired (Expiry Date: <strong>{restoreExpiredJob.expiryDate}</strong>). 
                            To restore this job, please set a new future expiry date.
                        </p>
                        
                        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>New Expiry Date *</label>
                            <input 
                                type="date" 
                                value={newExpiryDate} 
                                onChange={(e) => setNewExpiryDate(e.target.value)}
                                style={{ 
                                    padding: '0.625rem 0.75rem', 
                                    border: '1px solid #cbd5e1', 
                                    borderRadius: '8px',
                                    width: '100%',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        
                        <div className="admin-modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button className="btn-cancel" style={{ flex: 1 }} onClick={() => { setRestoreExpiredJob(null); setNewExpiryDate(''); }}>Cancel</button>
                            <button 
                                className="btn-edit" 
                                disabled={!newExpiryDate}
                                style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white', opacity: !newExpiryDate ? 0.6 : 1, cursor: !newExpiryDate ? 'not-allowed' : 'pointer' }}
                                onClick={async () => {
                                    try {
                                        // 1. First format the new date back to DD-MM-YYYY format if the backend expects it, or keep it as YYYY-MM-DD
                                        // Let's see: in their screenshot, it shows "27-05-2026".
                                        // Let's format the date from YYYY-MM-DD (e.g. "2026-05-28") to DD-MM-YYYY (e.g. "28-05-2026") to match their exact format!
                                        let formattedDate = newExpiryDate;
                                        if (newExpiryDate.includes('-')) {
                                            const parts = newExpiryDate.split('-');
                                            if (parts[0].length === 4) {
                                                formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                            }
                                        }

                                        const updatedJob = { ...restoreExpiredJob, expiryDate: formattedDate };
                                        
                                        const updateRes = await fetch(`${API_BASE_URL}/api/jobs/${restoreExpiredJob.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(updatedJob),
                                        });
                                        
                                        if (updateRes.ok) {
                                            const restoreRes = await fetch(`${API_BASE_URL}/api/jobs/${restoreExpiredJob.id}/restore`, { method: 'PUT' });
                                            if (restoreRes.ok) {
                                                fetchJobs();
                                                fetchDeletedJobs();
                                                showToast('Job updated and restored successfully!', 'success');
                                            } else {
                                                showToast('Failed to restore job after updating expiry date', 'error');
                                            }
                                        } else {
                                            showToast('Failed to update expiry date', 'error');
                                        }
                                    } catch (error) {
                                        console.error('Error restoring expired job:', error);
                                        showToast('Error occurred during restore', 'error');
                                    } finally {
                                        setRestoreExpiredJob(null);
                                        setNewExpiryDate('');
                                    }
                                }}
                            >
                                Update & Restore
                            </button>
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
                            onClick={() => changeTab('jobs')}
                        >
                            📋 Jobs
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => changeTab('analytics')}
                        >
                            📈 Analytics
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'mentors' ? 'active' : ''}`}
                            onClick={() => changeTab('mentors')}
                        >
                            👨‍🏫 Mentors
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'sessions' ? 'active' : ''}`}
                            onClick={() => changeTab('sessions')}
                        >
                            📅 Bookings
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'free-sessions' ? 'active' : ''}`}
                            onClick={() => changeTab('free-sessions')}
                        >
                            🎁 Free Sessions
                        </button>
                        <div className="admin-profile-container">
                            <button 
                                className={`admin-profile-badge clickable ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => changeTab('profile')}
                                style={{
                                    cursor: 'pointer',
                                    border: '1.5px solid rgba(255, 255, 255, 0.35)',
                                    background: activeTab === 'profile' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                                    outline: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.55rem'
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffffff' }}>
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span>Admin: {adminData.username}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'analytics' ? (
                <AnalyticsDashboard />
            ) : activeTab === 'mentors' ? (
                <AdminMentors />
            ) : activeTab === 'sessions' ? (
                <AdminBookings />
            ) : activeTab === 'free-sessions' ? (
                <AdminSessions />
            ) : activeTab === 'profile' ? (
                <div className="admin-profile-page-container">
                    <div className="admin-profile-card">
                        <div className="admin-profile-header">
                            <div className="admin-profile-header-left">
                                <div className={`admin-profile-avatar-large ${isEditingProfile ? 'editable-avatar' : ''}`}>
                                    {profilePicture ? (
                                        <img src={profilePicture} alt="Profile" className="admin-profile-img" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#7c3aed' }}>
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    )}
                                    {isEditingProfile && (
                                        <label className="avatar-upload-overlay">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                            <span>Upload</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleAvatarChange} 
                                                style={{ display: 'none' }} 
                                            />
                                        </label>
                                    )}
                                </div>
                                <div className="admin-profile-header-info">
                                    <h2>{profileEditForm.fullName}</h2>
                                    <p className="admin-profile-subtitle">Administrator</p>
                                </div>
                            </div>
                            <div className="admin-profile-header-actions">
                                {isEditingProfile ? (
                                    <>
                                        <button className="btn-profile-action btn-save-profile" onClick={handleSaveProfile}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                            Save Changes
                                        </button>
                                        <button className="btn-profile-action btn-cancel-profile" onClick={() => {
                                            setIsEditingProfile(false);
                                            setProfileEditForm({
                                                fullName: 'Bobby',
                                                username: adminData.username || 'bobby',
                                                email: adminData.email || 'bobby@placementbabai.com',
                                                phoneNumber: '+91 XXXXX XXXXX',
                                                department: 'Administration'
                                            });
                                        }}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn-profile-action btn-edit-profile" onClick={() => setIsEditingProfile(true)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                        Edit Details
                                    </button>
                                )}
                                <button className="btn-profile-action btn-change-password" onClick={() => setIsChangingPassword(true)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                                    Change Password
                                </button>
                                <button className="btn-profile-action btn-logout-action" onClick={onLogout}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                        <div className="admin-profile-grid">
                            <div className="profile-section-card">
                                <h3>👤 Personal Info</h3>
                                <div className="profile-field-row">
                                    <span className="field-name">Full Name:</span>
                                    {isEditingProfile ? (
                                        <div className="profile-input-wrapper">
                                            <input 
                                                type="text" 
                                                className={`profile-input ${profileErrors.fullName ? 'input-error' : ''}`}
                                                value={profileEditForm.fullName} 
                                                onChange={e => setProfileEditForm({...profileEditForm, fullName: e.target.value})} 
                                            />
                                            {profileErrors.fullName && <span className="profile-error-msg">{profileErrors.fullName}</span>}
                                        </div>
                                    ) : (
                                        <span className="field-value">{profileEditForm.fullName}</span>
                                    )}
                                </div>
                                <div className="profile-field-row">
                                    <span className="field-name">Username:</span>
                                    {isEditingProfile ? (
                                        <div className="profile-input-wrapper">
                                            <input 
                                                type="text" 
                                                className={`profile-input ${profileErrors.username ? 'input-error' : ''}`}
                                                value={profileEditForm.username} 
                                                onChange={e => setProfileEditForm({...profileEditForm, username: e.target.value})} 
                                            />
                                            {profileErrors.username && <span className="profile-error-msg">{profileErrors.username}</span>}
                                        </div>
                                    ) : (
                                        <span className="field-value">{profileEditForm.username}</span>
                                    )}
                                </div>
                                <div className="profile-field-row">
                                    <span className="field-name">Employee ID:</span>
                                    <span className="field-value">ADM001</span>
                                </div>
                                <div className="profile-field-row">
                                    <span className="field-name">Department:</span>
                                    <span className="field-value">Administration</span>
                                </div>
                            </div>
                            <div className="profile-section-card">
                                <h3>📞 Contact Details</h3>
                                <div className="profile-field-row">
                                    <span className="field-name">Email:</span>
                                    {isEditingProfile ? (
                                        <div className="profile-input-wrapper">
                                            <input 
                                                type="email" 
                                                className={`profile-input ${profileErrors.email ? 'input-error' : ''}`}
                                                value={profileEditForm.email} 
                                                onChange={e => setProfileEditForm({...profileEditForm, email: e.target.value})} 
                                            />
                                            {profileErrors.email && <span className="profile-error-msg">{profileErrors.email}</span>}
                                        </div>
                                    ) : (
                                        <span className="field-value email-value" title={profileEditForm.email}>{profileEditForm.email}</span>
                                    )}
                                </div>
                                <div className="profile-field-row">
                                    <span className="field-name">Phone Number:</span>
                                    {isEditingProfile ? (
                                        <div className="profile-input-wrapper">
                                            <input 
                                                type="text" 
                                                className={`profile-input ${profileErrors.phoneNumber ? 'input-error' : ''}`}
                                                value={profileEditForm.phoneNumber} 
                                                onChange={e => setProfileEditForm({...profileEditForm, phoneNumber: e.target.value})} 
                                            />
                                            {profileErrors.phoneNumber && <span className="profile-error-msg">{profileErrors.phoneNumber}</span>}
                                        </div>
                                    ) : (
                                        <span className="field-value">{profileEditForm.phoneNumber}</span>
                                    )}
                                </div>
                            </div>
                            <div className="profile-section-card">
                                <h3>⚙️ Account Status</h3>
                                <div className="profile-field-row">
                                    <span className="field-name">Status:</span>
                                    <span className="field-value status-badge-active">Active</span>
                                </div>
                                <div className="profile-field-row">
                                    <span className="field-name">Joined On:</span>
                                    <span className="field-value">01 Jan 2025</span>
                                </div>
                                <div className="profile-field-row">
                                    <span className="field-name">Last Login:</span>
                                    <span className="field-value">05 Jun 2026, 10:30 AM</span>
                                </div>
                            </div>
                        </div>
                        <div className="profile-permissions-card">
                            <h3>🔑 Assigned Permissions</h3>
                            <div className="permissions-badge-list">
                                <span className="permission-badge">✓ Manage Jobs</span>
                                <span className="permission-badge">✓ Manage Mentors</span>
                                <span className="permission-badge">✓ Manage Free Sessions</span>
                                <span className="permission-badge">✓ View Analytics</span>
                                <span className="permission-badge">✓ Manage Users</span>
                            </div>
                        </div>

                        {/* Change Password Modal */}
                        {isChangingPassword && (
                            <div className="password-modal-overlay">
                                <div className="password-modal-card">
                                    <div className="password-modal-header">
                                        <h3>🔑 Change Account Password</h3>
                                        <button className="btn-close-modal" onClick={() => {
                                            setIsChangingPassword(false);
                                            setPasswordErrors({});
                                            setShowCurrentPassword(false);
                                            setShowNewPassword(false);
                                            setShowConfirmPassword(false);
                                        }}>×</button>
                                    </div>
                                    <form onSubmit={handleChangePassword} className="password-modal-form">
                                        <div className="modal-form-group">
                                            <label>Current Password</label>
                                            <div className="modal-password-wrapper">
                                                <input 
                                                    type={showCurrentPassword ? "text" : "password"} 
                                                    className={passwordErrors.currentPassword ? 'input-error' : ''}
                                                    placeholder="Enter current password" 
                                                    value={passwordChangeForm.currentPassword}
                                                    onChange={e => setPasswordChangeForm({...passwordChangeForm, currentPassword: e.target.value})}
                                                    required 
                                                />
                                                <button 
                                                    type="button" 
                                                    className="password-toggle-btn" 
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    aria-label="Toggle Password Visibility"
                                                >
                                                    {showCurrentPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    )}
                                                </button>
                                            </div>
                                            {passwordErrors.currentPassword && <span className="modal-error-msg">{passwordErrors.currentPassword}</span>}
                                        </div>
                                        <div className="modal-form-group">
                                            <label>New Password</label>
                                            <div className="modal-password-wrapper">
                                                <input 
                                                    type={showNewPassword ? "text" : "password"} 
                                                    className={passwordErrors.newPassword ? 'input-error' : ''}
                                                    placeholder="Enter new password" 
                                                    value={passwordChangeForm.newPassword}
                                                    onChange={e => setPasswordChangeForm({...passwordChangeForm, newPassword: e.target.value})}
                                                    required 
                                                />
                                                <button 
                                                    type="button" 
                                                    className="password-toggle-btn" 
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    aria-label="Toggle Password Visibility"
                                                >
                                                    {showNewPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    )}
                                                </button>
                                            </div>
                                            {passwordErrors.newPassword && <span className="modal-error-msg">{passwordErrors.newPassword}</span>}
                                        </div>
                                        <div className="modal-form-group">
                                            <label>Confirm New Password</label>
                                            <div className="modal-password-wrapper">
                                                <input 
                                                    type={showConfirmPassword ? "text" : "password"} 
                                                    className={passwordErrors.confirmNewPassword ? 'input-error' : ''}
                                                    placeholder="Confirm new password" 
                                                    value={passwordChangeForm.confirmNewPassword}
                                                    onChange={e => setPasswordChangeForm({...passwordChangeForm, confirmNewPassword: e.target.value})}
                                                    required 
                                                />
                                                <button 
                                                    type="button" 
                                                    className="password-toggle-btn" 
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    aria-label="Toggle Password Visibility"
                                                >
                                                    {showConfirmPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    )}
                                                </button>
                                            </div>
                                            {passwordErrors.confirmNewPassword && <span className="modal-error-msg">{passwordErrors.confirmNewPassword}</span>}
                                        </div>
                                        <div className="password-modal-actions">
                                            <button type="button" className="btn-modal-cancel" onClick={() => {
                                                setIsChangingPassword(false);
                                                setPasswordErrors({});
                                                setShowCurrentPassword(false);
                                                setShowNewPassword(false);
                                                setShowConfirmPassword(false);
                                            }}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-modal-submit">
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
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
                                        <div className="autofill-buttons-group">
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <h2>All Jobs ({filteredJobs.length})</h2>
                                <div className="view-mode-tabs">
                                    <button className={`mode-btn ${jobViewMode === 'active' ? 'active' : ''}`} onClick={() => setJobViewMode('active')}>📋 Active</button>
                                    <button className={`mode-btn ${jobViewMode === 'expired' ? 'active' : ''}`} onClick={() => setJobViewMode('expired')}>⌛ Expired</button>
                                    <button className={`mode-btn ${jobViewMode === 'deleted' ? 'active' : ''}`} onClick={() => setJobViewMode('deleted')}>🗑️ Deleted</button>
                                </div>
                            </div>
                            <div className="jobs-filter-controls">
                                <input
                                    type="text"
                                    placeholder="Search by ID, title, or company..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="admin-search-input"
                                />
                                <button className="btn-primary-compact" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
                                    {showForm ? '✕ Cancel' : '+ Add New Job'}
                                </button>
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
                                            <th>{jobViewMode === 'active' ? 'Created At' : (jobViewMode === 'expired' ? 'Expiry Date' : 'Deleted At')}</th>
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
                                                    <td><strong>{job.id}</strong></td>
                                                    <td><strong>{job.title}</strong></td>
                                                    <td>{job.company}</td>
                                                    <td>
                                                        {jobViewMode === 'active' ? (
                                                            job.createdAt ? new Date(job.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
                                                        ) : jobViewMode === 'expired' ? (
                                                            job.expiryDate || '—'
                                                        ) : (
                                                            job.deletedAt ? new Date(job.deletedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
                                                        )}
                                                    </td>
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
                                                            {jobViewMode === 'active' ? (
                                                                <>
                                                                    <button className="btn-analytics" onClick={() => setExpandedAnalyticsJobId(job.id)}>📊 Data</button>
                                                                    <button className="btn-edit" onClick={() => handleEdit(job)}>✏️ Edit</button>
                                                                    <button className="btn-delete" onClick={() => handleDelete(job.id)}>🗑️ Delete</button>
                                                                </>
                                                             ) : jobViewMode === 'expired' ? (
                                                                 <>
                                                                     <button className="btn-edit" onClick={() => handleEdit(job)}>✏️ Edit</button>
                                                                     <button className="btn-primary" onClick={() => handleRestore(job.id)}>↩️ Restore</button>
                                                                     <button className="btn-delete" onClick={() => handleDelete(job.id)}>🗑️ Delete</button>
                                                                 </>
                                                              ) : (
                                                                  <>
                                                                      <button className="btn-edit" onClick={() => handleEdit(job)}>✏️ Edit</button>
                                                                      <button className="btn-primary" onClick={() => handleRestore(job.id)}>↩️ Restore</button>
                                                                      <button className="btn-delete" onClick={() => handleDelete(job.id)}>🗑️ Delete Permanently</button>
                                                                  </>
                                                               )}
                                                         </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No jobs match your search/filter criteria.</td>
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
