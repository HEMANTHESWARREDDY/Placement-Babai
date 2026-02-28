import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from './config';
import './AdminDashboard.css';
import CustomSelect from './CustomSelect';
import AnalyticsDashboard from './AnalyticsDashboard';
import JobAnalytics from './JobAnalytics';

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
};

function AdminDashboard({ adminData, onLogout }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [sortType, setSortType] = useState('');
    const [activeTab, setActiveTab] = useState('jobs');
    const [expandedAnalyticsJobId, setExpandedAnalyticsJobId] = useState(null);

    const toggleFilter = (group, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [group]: value === undefined || prev[group] === value ? undefined : value,
        }));
    };

    const hasActiveFilters = Object.values(activeFilters).some(Boolean) || !!sortType;

    useEffect(() => {
        fetchJobs();
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
                resetForm();
                alert(editingJob ? 'Job updated successfully!' : 'Job created successfully!');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            alert('Failed to save job');
        }
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setFormData({
            title: job.title || '',
            company: job.company || '',
            companyLogo: job.companyLogo || '',
            location: job.location || '',
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
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this job?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchJobs();
                alert('Job deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting job:', error);
            alert('Failed to delete job');
        }
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingJob(null);
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
                        <button className="btn-primary" onClick={() => { setActiveTab('jobs'); setShowForm(!showForm); if (showForm) resetForm(); }}>
                            {showForm ? '✕ Cancel' : '+ Add New Job'}
                        </button>
                        <button className="btn-logout" onClick={onLogout}>Logout</button>
                    </div>
                </div>
            </div>

            {activeTab === 'analytics' ? (
                <AnalyticsDashboard />
            ) : (
                <>
                    {/* Job Form */}
                    {showForm && (
                        <div className="job-form-container">
                            <h2>{editingJob ? '✏️ Edit Job' : '➕ Create New Job'}</h2>
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
                    onClose={() => setExpandedAnalyticsJobId(null)}
                />
            )}
        </div>
    );
}

export default AdminDashboard;
