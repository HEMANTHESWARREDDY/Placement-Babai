import { useState, useEffect, useRef } from 'react';
import JobDetail from './JobDetail';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import CustomSelect from './CustomSelect';
import LegalModal from './LegalModal';
import AllJobsModal from './AllJobsModal';
import ProConnect from './ProConnect';
import MentorLogin from './MentorLogin';
import MentorDashboard from './MentorDashboard';
import InterviewPrep from './InterviewPrep';
import { API_BASE_URL } from './config';
import './App.css';

// Force Redeploy Stable State f881810
const getStableDailyNumber = () => {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const min = 500;
  const max = 900;
  const range = max - min + 1;
  const stableRandom = Math.abs(hash) % range;
  return min + stableRandom;
};

function App() {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [expandedPillar, setExpandedPillar] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [jobs, setJobs] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [searchExperience, setSearchExperience] = useState('');
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    if (path.includes('/admin') || params.get('admin') === 'true') {
      return localStorage.getItem('adminToken') ? 'admin-dashboard' : 'admin-login';
    }
    
    if (path.includes('/mentor')) {
      return localStorage.getItem('mentorToken') ? 'mentor-dashboard' : 'mentor-login';
    }
    
    const savedView = localStorage.getItem('currentView');
    if (savedView && savedView !== 'home' && path === '/') return savedView;
    return 'home';
  });

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
    
    // Sync currentView to URL
    let newPath = '/';
    if (currentView === 'admin-dashboard' || currentView === 'admin-login') {
      newPath = '/admin';
    } else if (currentView === 'mentor-dashboard' || currentView === 'mentor-login') {
      newPath = '/mentor';
    } else if (activeMainTab === 'pro-connect') {
      newPath = '/proConnect';
    } else if (activeMainTab === 'interview-prep') {
      newPath = '/prepZo';
    }

    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, [currentView]);

  const [adminData, setAdminData] = useState(() => {
    const token = localStorage.getItem('adminToken');
    const username = localStorage.getItem('adminUsername');
    const email = localStorage.getItem('adminEmail');
    return token ? { token, username, email } : null;
  });
  const [mentorData, setMentorData] = useState(() => {
    const token = localStorage.getItem('mentorToken');
    const username = localStorage.getItem('mentorUsername');
    const id = localStorage.getItem('mentorId');
    return token ? { token, username, id } : null;
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortType, setSortType] = useState('');
  const [legalContent, setLegalContent] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Dropdown for Menu
  const [appliesCount, setAppliesCount] = useState({});
  const [todaySessionsCount, setTodaySessionsCount] = useState(0);
  const [showAllJobsModal, setShowAllJobsModal] = useState(false);

  // General ATS States
  const [genAtsFile, setGenAtsFile] = useState(null);
  const [genAtsResult, setGenAtsResult] = useState(null);
  const [genAtsError, setGenAtsError] = useState(null);
  const [genAtsLoading, setGenAtsLoading] = useState(false);
  const genFileInputRef = useRef(null);
  const [isGenDragging, setIsGenDragging] = useState(false);
  const [genAtsJd, setGenAtsJd] = useState("");
  const [atsCheckType, setAtsCheckType] = useState("general"); // "general" or "targeted"

  const handleGenAtsFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGenAtsFile(file);
      setGenAtsResult(null);
      setGenAtsError(null);
    }
  };

  const handleGenAtsUpload = async () => {
    if (!genAtsFile) {
      setGenAtsError("Please select or drop a resume file first.");
      return;
    }
    if (atsCheckType === "targeted" && !genAtsJd.trim()) {
      setGenAtsError("Please paste the target job description to run a Targeted JD Match.");
      return;
    }
    setGenAtsLoading(true);
    setGenAtsError(null);
    setGenAtsResult(null);

    const formData = new FormData();
    formData.append("resume", genAtsFile);
    if (atsCheckType === "targeted" && genAtsJd.trim()) {
      formData.append("jd", genAtsJd.trim());
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/general-ats-check`, {
        method: 'POST',
        body: formData,
      });

      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Response was not JSON
      }

      if (!res.ok) {
        const errorMsg = data && data.error ? data.error : `Server returned status: ${res.status}`;
        throw new Error(errorMsg);
      }

      if (data && data.error) {
        setGenAtsError(data.error);
      } else {
        setGenAtsResult(data);
      }
    } catch (err) {
      console.error(err);
      setGenAtsError(err.message || "Failed to parse and analyze resume. Please try again with a valid PDF or DOCX file.");
    } finally {
      setGenAtsLoading(false);
    }
  };

  const getSubscoreColor = (score) => {
    if (score >= 70) return '#10b981'; // Green
    if (score >= 40) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getVisualProgress = (score) => {
    return score === 0 ? 4 : score;
  };

  const [showGeneralAtsModal, setShowGeneralAtsModal] = useState(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    return path.toLowerCase() === '/resumereview' || params.has('resumeReview');
  });

  const [activeMainTab, setActiveMainTab] = useState(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    if (path === '/proConnect' || params.has('proConnect')) return 'pro-connect';
    if (path === '/prepZo' || params.has('prepZo')) return 'interview-prep';
    if (path === '/jobs' || params.has('jobs')) return 'jobs';
    
    return 'home';
  });

  // Keep path synchronized when general ATS modal is open/closed
  useEffect(() => {
    if (currentView === 'home') {
      if (showGeneralAtsModal) {
        if (window.location.pathname !== '/ResumeReview') {
          window.history.pushState({}, '', '/ResumeReview');
        }
      } else {
        let newPath = '/';
        if (activeMainTab === 'pro-connect') newPath = '/proConnect';
        else if (activeMainTab === 'interview-prep') newPath = '/prepZo';
        else if (activeMainTab === 'jobs') newPath = '/jobs';
        
        if (window.location.pathname !== newPath && window.location.pathname === '/ResumeReview') {
          window.history.pushState({}, '', newPath);
        }
      }
    }
  }, [showGeneralAtsModal, activeMainTab, currentView]);

  useEffect(() => {
    localStorage.setItem('activeMainTab', activeMainTab);
    
    // Only update path if not in a special dashboard view
    if (currentView === 'home' && !showGeneralAtsModal) {
      let newPath = '/';
      if (activeMainTab === 'pro-connect') newPath = '/proConnect';
      else if (activeMainTab === 'interview-prep') newPath = '/prepZo';
      else if (activeMainTab === 'jobs') newPath = '/jobs';
      
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    }
  }, [activeMainTab, currentView, showGeneralAtsModal]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      
      if (path === '/admin') {
        setCurrentView(localStorage.getItem('adminToken') ? 'admin-dashboard' : 'admin-login');
      } else if (path === '/mentor') {
        setCurrentView(localStorage.getItem('mentorToken') ? 'mentor-dashboard' : 'mentor-login');
      } else {
        setCurrentView('home');
        if (path.toLowerCase() === '/resumereview' || params.has('resumeReview')) {
          setShowGeneralAtsModal(true);
        } else {
          setShowGeneralAtsModal(false);
          if (path === '/proConnect' || params.has('proConnect')) setActiveMainTab('pro-connect');
          else if (path === '/prepZo' || params.has('prepZo')) setActiveMainTab('interview-prep');
          else if (path === '/jobs' || params.has('jobs')) setActiveMainTab('jobs');
          else setActiveMainTab('home');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const filterBarRef = useRef(null);
  const jobsGridRef = useRef(null);

  // Carousel scroll state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
      { label: '📌 Other', value: 'Other' },
    ],
    location: [
      { label: '🏠 Remote', value: 'Remote' },
      { label: '🏙️ Bangalore', value: 'Bangalore' },
      { label: '🌆 Hyderabad', value: 'Hyderabad' },
      { label: '🌇 Mumbai', value: 'Mumbai' },
      { label: '🏘️ Pune', value: 'Pune' },
      { label: '📌 Other', value: 'Other' },
    ],
    companyType: [
      { label: '🏢 MNC', value: 'MNC' },
      { label: '🚀 Startup', value: 'Startup' },
      { label: '📌 Other', value: 'Other' },
    ],
    jobType: [
      { label: '💼 Full-time', value: 'Full-time' },
      { label: '⏰ Part-time', value: 'Part-time' },
      { label: '📋 Internship', value: 'Internship' },
      { label: '🔀 Hybrid', value: 'Hybrid' },
      { label: '📌 Other', value: 'Other' },
    ],
    salary: [
      { label: '💰 0–3 LPA', value: '0-3' },
      { label: '💰 3–6 LPA', value: '3-6' },
      { label: '💰 6–10 LPA', value: '6-10' },
      { label: '💰 10+ LPA', value: '10+' },
      { label: '📌 Other', value: 'Other' },
    ],
    datePosted: [
      { label: '🕒 Today', value: '24h' },
      { label: '📅 Last 7 days', value: '7d' },
      { label: '🗓️ Last 30 days', value: '30d' },
      { label: '📌 Other', value: 'Other' },
    ],
    passoutYear: [
      { label: '🎓 2024', value: '2024' },
      { label: '🎓 2025', value: '2025' },
      { label: '🎓 2026', value: '2026' },
      { label: '🎓 Other', value: 'Other' },
    ],
  };

  const getSuggestions = () => {
    if (!searchKeyword.trim() || jobs.length === 0) return [];
    const kw = searchKeyword.toLowerCase();
    const suggestions = [];
    const seen = new Set();

    for (const job of jobs) {
      const items = [
        job.title,
        job.company,
        ...(job.skills ? job.skills.split(',').map(s => s.trim()) : [])
      ].filter(Boolean);

      for (const item of items) {
        if (item.toLowerCase().includes(kw)) {
          if (!seen.has(item)) {
            seen.add(item);
            suggestions.push(item);
          }
        }
      }
    }

    // Sort suggestions to prioritize exact or closest matches
    suggestions.sort((a, b) => {
      const aLow = a.toLowerCase();
      const bLow = b.toLowerCase();

      // 1. Exact matches first
      if (aLow === kw && bLow !== kw) return -1;
      if (bLow === kw && aLow !== kw) return 1;

      // 2. Starts with kw
      const aStarts = aLow.startsWith(kw);
      const bStarts = bLow.startsWith(kw);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      // 3. Contains a word that starts with kw
      const aWordStarts = aLow.split(/\s+/).some(word => word.startsWith(kw));
      const bWordStarts = bLow.split(/\s+/).some(word => word.startsWith(kw));
      if (aWordStarts && !bWordStarts) return -1;
      if (bWordStarts && !aWordStarts) return 1;

      // 4. Shorter strings first (e.g. "Java" before "JavaScript")
      return aLow.length - bLow.length;
    });

    return suggestions.slice(0, 2);
  };

  const getLocSuggestions = () => {
    if (!searchLocation.trim() || jobs.length === 0) return [];
    const kw = searchLocation.toLowerCase();
    const suggestions = [];
    const seen = new Set();

    for (const job of jobs) {
      const loc = job.location || '';
      if (loc && loc.toLowerCase().includes(kw)) {
        // Just extract the city/primary name if it's comma separated, or use whole string
        // We'll just use the whole location string for simplicity but ensure uniqueness
        if (!seen.has(loc)) {
          seen.add(loc);
          suggestions.push(loc);
        }
      }
    }

    // Sort locations using the same smarter logic
    suggestions.sort((a, b) => {
      const aLow = a.toLowerCase();
      const bLow = b.toLowerCase();
      if (aLow === kw && bLow !== kw) return -1;
      if (bLow === kw && aLow !== kw) return 1;

      const aStarts = aLow.startsWith(kw);
      const bStarts = bLow.startsWith(kw);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      const aWordStarts = aLow.split(/[\s,]+/).some(word => word.startsWith(kw));
      const bWordStarts = bLow.split(/[\s,]+/).some(word => word.startsWith(kw));
      if (aWordStarts && !bWordStarts) return -1;
      if (bWordStarts && !aWordStarts) return 1;

      return aLow.length - bLow.length;
    });

    return suggestions.slice(0, 2);
  };

  const toggleFilter = (group, value) => {
    setActiveFilters(prev => ({
      ...prev,
      // if same value selected again from dropdown, clear it; otherwise set it
      [group]: value === undefined || prev[group] === value ? undefined : value,
    }));
    setShowAll(false);
  };

  // Extract the first number from a string like "3 - 7 LPA" or "2 - 5 Years"
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

  const applyFilters = (list) => {
    return list.filter(job => {

      // ── Role filter ───────────────────────────────────────────────
      if (activeFilters.role) {
        const roleVal = activeFilters.role.toLowerCase();
        const titleLow = (job.title || '').toLowerCase();
        const catLow = (job.category || '').toLowerCase();
        const jobRole = (job.role || '').toLowerCase();
        const skillsLow = (job.skills || '').toLowerCase();

        const isDeveloper = titleLow.includes('dev') || titleLow.includes('engineer') || titleLow.includes('full stack') || titleLow.includes('backend') || titleLow.includes('frontend') || jobRole.includes('developer');
        const isML = titleLow.includes('machine learning') || titleLow.includes(' ml ') || titleLow.includes('data scientist') || titleLow.includes('ai ') || skillsLow.includes('tensorflow') || skillsLow.includes('pytorch') || jobRole.includes('ml');
        const isQA = titleLow.includes('test') || titleLow.includes('qa') || titleLow.includes('quality') || jobRole.includes('qa');
        const isDevOps = titleLow.includes('devops') || titleLow.includes('cloud') || titleLow.includes('sre') || skillsLow.includes('docker') || skillsLow.includes('kubernetes') || jobRole.includes('devops');
        const isAnalyst = titleLow.includes('analyst') || titleLow.includes('bi ') || titleLow.includes('data') || jobRole.includes('analyst');
        const isDesign = titleLow.includes('design') || titleLow.includes('ui') || titleLow.includes('ux') || jobRole.includes('design');

        if (roleVal === 'other') {
          if (isDeveloper || isML || isQA || isDevOps || isAnalyst || isDesign) return false;
        } else {
          const matched =
            jobRole.includes(roleVal) ||
            titleLow.includes(roleVal) ||
            catLow.includes(roleVal) ||
            skillsLow.includes(roleVal) ||
            (roleVal === 'developer' && isDeveloper) ||
            (roleVal === 'ml' && isML) ||
            (roleVal === 'qa' && isQA) ||
            (roleVal === 'devops' && isDevOps) ||
            (roleVal === 'analyst' && isAnalyst) ||
            (roleVal === 'design' && isDesign);
          if (!matched) return false;
        }
      }

      // ── Location filter ───────────────────────────────────────────
      if (activeFilters.location) {
        const locFilter = activeFilters.location.toLowerCase();
        const locJob = (job.location || '').toLowerCase();
        const typeJob = (job.jobType || '').toLowerCase();
        const isRemote = locJob.includes('remote') || typeJob.includes('remote');
        if (locFilter === 'other') {
          if (isRemote || locJob.includes('bangalore') || locJob.includes('hyderabad') || locJob.includes('mumbai') || locJob.includes('pune')) return false;
        } else if (locFilter === 'remote') {
          if (!isRemote) return false;
        } else {
          if (!locJob.includes(locFilter)) return false;
        }
      }

      // ── Company type filter ───────────────────────────────────────
      if (activeFilters.companyType) {
        const ctJob = (job.companyType || '').toLowerCase();
        if (activeFilters.companyType === 'Other') {
          if (ctJob.includes('mnc') || ctJob.includes('startup')) return false;
        } else {
          if (!ctJob.includes(activeFilters.companyType.toLowerCase())) return false;
        }
      }

      // ── Job Type filter ───────────────────────────────────────────
      if (activeFilters.jobType) {
        const tJob = job.jobType || '';
        if (activeFilters.jobType === 'Other') {
          if (tJob === 'Full-time' || tJob === 'Part-time' || tJob === 'Internship' || tJob === 'Hybrid') return false;
        } else if (tJob !== activeFilters.jobType) {
          return false;
        }
      }

      // ── Salary / Package filter ───────────────────────────────────
      if (activeFilters.salary) {
        const salaryStr = job.salary || '';
        if (activeFilters.salary === 'Other') {
          const low = parseRangeLow(salaryStr);
          if (low !== null || salaryStr.includes('As per')) return false; // If there's a specific amount or string, might not be "Other", but typically Other = Not Specified / Unknown
        } else if (salaryStr) {
          const low = parseRangeLow(salaryStr);
          const high = parseRangeHigh(salaryStr);
          if (low !== null) {
            const jobHigh = high ?? low;
            if (activeFilters.salary === '0-3' && !(low < 3)) return false;
            if (activeFilters.salary === '3-6' && !(low < 6 && jobHigh >= 3)) return false;
            if (activeFilters.salary === '6-10' && !(low < 10 && jobHigh >= 6)) return false;
            if (activeFilters.salary === '10+' && !(jobHigh >= 10)) return false;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }

      // ── Experience filter (filter bar dropdown) ──────────────────
      if (activeFilters.experience) {
        const expStr = (job.experienceLevel || '').toLowerCase();
        const isFresher = expStr.includes('fresh') || expStr.includes('0 - 0') || expStr === '0';
        if (activeFilters.experience === 'Other') {
          const expLow = parseRangeLow(expStr);
          if (isFresher || expLow !== null) return false;
        } else if (activeFilters.experience === 'fresher') {
          if (!isFresher) return false;
        } else {
          if (isFresher) return false;
          const expLow = parseRangeLow(expStr);
          const expHigh = parseRangeHigh(expStr) ?? expLow;
          if (expLow !== null) {
            if (activeFilters.experience === '1-3' && !(expLow < 3 && (expHigh ?? expLow) >= 1)) return false;
            if (activeFilters.experience === '3+' && !((expHigh ?? expLow) >= 3)) return false;
          } else {
            return false;
          }
        }
      }

      // ── Experience filter (search bar number input) ───────────────
      if (searchExperience !== '') {
        const n = parseInt(searchExperience, 10);
        const expStr = (job.experienceLevel || '').toLowerCase();
        const isFresher = expStr.includes('fresh') || expStr.includes('0 - 0') || expStr === '0';
        if (n === 0) {
          if (!isFresher) return false;
        } else {
          if (isFresher) return false;
          const expLow = parseRangeLow(expStr);
          const expHigh = parseRangeHigh(expStr) ?? expLow;
          if (expLow !== null) {
            // Allow ±1 year tolerance around the entered number
            if (!(expLow <= n + 1 && (expHigh ?? expLow) >= Math.max(0, n - 1))) return false;
          }
        }
      }

      // ── Date Posted filter ───────────────────────────────────────
      if (activeFilters.datePosted) {
        if (!job.postedDate) {
          if (activeFilters.datePosted !== 'Other') return false;
        } else {
          const jobDate = new Date(job.postedDate);
          const now = new Date();
          const diffTime = Math.abs(now - jobDate);
          const oneDay = 24 * 60 * 60 * 1000;

          if (activeFilters.datePosted === 'Other') {
            if (diffTime <= 30 * oneDay) return false;
          } else if (activeFilters.datePosted === '24h') {
            // Strict calendar day match instead of 24h rolling window
            if (jobDate.toDateString() !== now.toDateString()) return false;
          } else if (activeFilters.datePosted === '7d') {
            if (diffTime > 7 * oneDay) return false;
          } else if (activeFilters.datePosted === '30d') {
            if (diffTime > 30 * oneDay) return false;
          }
        }
      }

      // ── Passout Year filter ───────────────────────────────────────
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
      if (!sortType) {
        const aIsLastDay = a.expiryDate && a.expiryDate !== "Don't know" && new Date(a.expiryDate).toDateString() === new Date().toDateString();
        const bIsLastDay = b.expiryDate && b.expiryDate !== "Don't know" && new Date(b.expiryDate).toDateString() === new Date().toDateString();
        if (aIsLastDay && !bIsLastDay) return -1;
        if (!aIsLastDay && bIsLastDay) return 1;

        const aIsNew = a.postedDate && new Date(a.postedDate).toDateString() === new Date().toDateString();
        const bIsNew = b.postedDate && new Date(b.postedDate).toDateString() === new Date().toDateString();
        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;

        const aApplies = appliesCount[a.id] || 0;
        const bApplies = appliesCount[b.id] || 0;
        if (bApplies !== aApplies) return bApplies - aApplies;

        return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
      }
      if (sortType === 'newest') return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
      if (sortType === 'oldest') return new Date(a.postedDate || 0) - new Date(b.postedDate || 0);
      if (sortType === 'az') return (a.title || '').localeCompare(b.title || '');
      if (sortType === 'za') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some(Boolean) || !!sortType;


  useEffect(() => {
    fetchJobs();
    fetchMentors();
    fetchTodaySessionsCount();
    fetch(`${API_BASE_URL}/api/analytics/view/website`, { method: 'POST' }).catch(() => { });

    fetch(`${API_BASE_URL}/api/analytics/applies/grouped`)
      .then(res => res.ok ? res.json() : {})
      .then(data => setAppliesCount(data))
      .catch(() => { });

    // Hidden admin route via URL parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      // Clean up URL without refreshing
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  }, []);

  // After jobs load, check if URL has ?job=ID and auto-open it
  useEffect(() => {
    if (jobs.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('job');
    if (jobId) {
      const found = jobs.find(j => String(j.id) === String(jobId));
      if (found) setSelectedJob(found);
    }
  }, [jobs]);

  useEffect(() => {
    if (selectedJob) {
      fetch(`${API_BASE_URL}/api/analytics/view/job/${selectedJob.id}`, { method: 'POST' }).catch(() => { });
    }
  }, [selectedJob]);

  const checkScroll = () => {
    if (jobsGridRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = jobsGridRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 for subpixel rounding differences
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [jobs, activeFilters, searchKeyword, searchLocation, sortType, showAll]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setIsSearchResult(false);
      const response = await fetch(`${API_BASE_URL}/api/jobs`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      // Sort newest first (by date, then by id as tiebreaker)
      const sorted = [...data].sort((a, b) => {
        const dateDiff = new Date(b.postedDate) - new Date(a.postedDate);
        return dateDiff !== 0 ? dateDiff : b.id - a.id;
      });
      setJobs(sorted);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      setMentorsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mentors`);
      if (response.ok) {
        const data = await response.json();
        setMentors(data);
      }
    } catch (err) {
      console.error('Error fetching mentors:', err);
    } finally {
      setMentorsLoading(false);
    }
  };

  const fetchTodaySessionsCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/active`);
      if (response.ok) {
        const sessions = await response.json();
        
        const isSessionPast = (session) => {
          if (!session.sessionDate) return false;
          
          const now = new Date();
          const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
          
          if (session.sessionDate < todayStr) return true;
          
          if (session.sessionDate === todayStr && session.schedule) {
            try {
              const timeStr = session.schedule.toUpperCase();
              let hours = 0;
              let minutes = 0;
              
              const timeMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/);
              if (timeMatch) {
                hours = parseInt(timeMatch[1]);
                minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const ampm = timeMatch[3];
                
                if (ampm === 'PM' && hours < 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
                
                const sessionTime = new Date();
                sessionTime.setHours(hours, minutes, 0, 0);
                
                return now.getTime() > (sessionTime.getTime() + 30 * 60 * 1000);
              }
            } catch (e) {
              console.error("Time parse error:", e);
            }
          }
          return false;
        };

        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        
        const todaySessions = sessions.filter(s => s.sessionDate === todayStr && !isSessionPast(s));
        setTodaySessionsCount(todaySessions.length);
      }
    } catch (err) {
      console.error('Error fetching today sessions count:', err);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);

      if (searchKeyword && searchKeyword.trim()) {
        fetch(`${API_BASE_URL}/api/analytics/search?keyword=${encodeURIComponent(searchKeyword.trim())}`, { method: 'POST' }).catch(() => { });
      }
      let url = `${API_BASE_URL}/api/jobs`;

      if (searchKeyword) {
        url = `${API_BASE_URL}/api/jobs/search?keyword=${encodeURIComponent(searchKeyword)}`;
      } else if (searchLocation) {
        url = `${API_BASE_URL}/api/jobs/location?location=${encodeURIComponent(searchLocation)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to search jobs');
      }
      const data = await response.json();
      const sorted = [...data].sort((a, b) => {
        if (searchKeyword) {
          const kw = searchKeyword.toLowerCase();

          const getScore = (job) => {
            let score = 0;
            const title = (job.title || '').toLowerCase();
            const skills = (job.skills || '').toLowerCase();
            const company = (job.company || '').toLowerCase();

            // 1. Title matching (Highest priority)
            if (title === kw) score += 100;
            else if (title.startsWith(kw)) score += 80;
            else if (title.includes(kw)) score += 60;

            // 2. Skills matching (Second priority)
            const skillsList = skills.split(',').map(s => s.trim());
            if (skillsList.includes(kw)) score += 50;
            else if (skills.includes(kw)) score += 30;

            // 3. Company matching (Third priority)
            if (company === kw) score += 20;
            else if (company.startsWith(kw)) score += 15;
            else if (company.includes(kw)) score += 10;

            return score;
          };

          const aScore = getScore(a);
          const bScore = getScore(b);

          if (aScore !== bScore) {
            return bScore - aScore; // higher score first
          }
        }

        // If no search or scores are tied, sort by date
        const dateDiff = new Date(b.postedDate) - new Date(a.postedDate);
        return dateDiff !== 0 ? dateDiff : b.id - a.id;
      });
      setJobs(sorted);
      setShowAll(!!searchKeyword || !!searchLocation); // expand results if user searched
      setIsSearchResult(!!searchKeyword || !!searchLocation);
      setError(null);
      // Wait for React to render the new state, then smoothly scroll down to the results
      setTimeout(() => {
        document.querySelector('.jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getCompanyInitials = (company) => {
    return company
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleAdminLogin = (data) => {
    setAdminData(data);
    setCurrentView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminEmail');
    setAdminData(null);
    setCurrentView('home');
  };

  const handleMentorLogin = (data) => {
    setMentorData(data);
    setCurrentView('mentor-dashboard');
  };

  const handleMentorLogout = () => {
    localStorage.removeItem('mentorToken');
    localStorage.removeItem('mentorUsername');
    localStorage.removeItem('mentorId');
    setMentorData(null);
    setCurrentView('home');
  };

  // Opens a job and updates the URL so it can be shared
  const openJob = (job) => {
    setSelectedJob(job);
    const url = new URL(window.location.href);
    url.searchParams.set('job', job.id);
    window.history.pushState({}, '', url.toString());
  };

  // Closes job modal and removes ?job= from URL
  const closeJob = () => {
    setSelectedJob(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('job');
    window.history.pushState({}, '', url.toString());
  };

  // Render based on current view
  if (currentView === 'admin-login') {
    return <AdminLogin onLoginSuccess={handleAdminLogin} onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'admin-dashboard' && adminData) {
    return <AdminDashboard adminData={adminData} onLogout={handleAdminLogout} />;
  }

  if (currentView === 'mentor-login') {
    return <MentorLogin onLoginSuccess={handleMentorLogin} onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'mentor-dashboard' && mentorData) {
    return <MentorDashboard mentorAuth={mentorData} onLogout={handleMentorLogout} />;
  }

  const newJobsToday = jobs.filter(job => {
    if (!job.postedDate) return false;
    // Strictly compare calendar dates to avoid 24h rolling issues spanning daylines
    return new Date(job.postedDate).toDateString() === new Date().toDateString();
  }).length;

  const newMentorsToday = mentors.filter(mentor => {
    if (!mentor.createdAt) return false;
    return new Date(mentor.createdAt).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="App">
      {/* Floating Check ATS Score Button */}
      {activeMainTab === 'jobs' && !showGeneralAtsModal && (
        <button
          onClick={() => {
            setShowGeneralAtsModal(true);
          }}
          className="ats-floating-button"
          style={{
            position: 'fixed',
            bottom: '35px',
            right: '35px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #0ea5e9, #0073b1)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: '0.85rem 1.75rem',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 115, 177, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          Check ATS Score
        </button>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetail job={selectedJob} onClose={closeJob} />
      )}

      {/* Legal Content Modal */}
      {legalContent && (
        <LegalModal type={legalContent} onClose={() => setLegalContent(null)} />
      )}

      {/* AI General ATS Resume Reviewer Modal */}
      {showGeneralAtsModal && (
        <div className="general-ats-modal-overlay" onClick={() => setShowGeneralAtsModal(false)}>
          <div className="general-ats-modal" onClick={(e) => e.stopPropagation()}>
            <div className="general-ats-modal-header">
              <h2>AI ATS Resume Reviewer</h2>
              <button className="general-ats-modal-close" onClick={() => setShowGeneralAtsModal(false)}>✕</button>
            </div>
            <div className="general-ats-modal-body">
              <div className="resume-review-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.05rem', color: '#64748b', margin: 0 }}>
                  Upload your resume for a comprehensive general ATS compliance score!
                </p>
              </div>

              <div className="resume-review-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem' }}>
                
                {/* Segmented Pill Tabs for Check Mode */}
                {!genAtsResult && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    background: '#f1f5f9',
                    borderRadius: '24px',
                    padding: '4px',
                    marginBottom: '2rem',
                    border: '1px solid #e2e8f0',
                    width: 'fit-content',
                    margin: '0 auto 2rem auto'
                  }}>
                    <button
                      onClick={() => {
                        setAtsCheckType("general");
                        setGenAtsError(null);
                      }}
                      style={{
                        padding: '0.6rem 1.8rem',
                        borderRadius: '20px',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: atsCheckType === 'general' ? '#0073b1' : 'transparent',
                        color: atsCheckType === 'general' ? '#ffffff' : '#64748b',
                        boxShadow: atsCheckType === 'general' ? '0 2px 8px rgba(0, 115, 177, 0.15)' : 'none'
                      }}
                    >
                      General ATS Check
                    </button>
                    <button
                      onClick={() => {
                        setAtsCheckType("targeted");
                        setGenAtsError(null);
                      }}
                      style={{
                        padding: '0.6rem 1.8rem',
                        borderRadius: '20px',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: atsCheckType === 'targeted' ? '#0073b1' : 'transparent',
                        color: atsCheckType === 'targeted' ? '#ffffff' : '#64748b',
                        boxShadow: atsCheckType === 'targeted' ? '0 2px 8px rgba(0, 115, 177, 0.15)' : 'none'
                      }}
                    >
                      Targeted JD Match
                    </button>
                  </div>
                )}

                {/* Target JD Textarea */}
                {atsCheckType === "targeted" && !genAtsResult && (
                  <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
                    <label style={{
                      display: 'block',
                      fontWeight: '600',
                      color: '#0f172a',
                      fontSize: '0.95rem',
                      marginBottom: '0.5rem',
                      textAlign: 'left'
                    }}>
                      Target Job Description (JD)
                    </label>
                    <textarea
                      value={genAtsJd}
                      onChange={(e) => setGenAtsJd(e.target.value)}
                      placeholder="Paste the target job description details here (skills, responsibilities, credentials) to evaluate how well your resume matches the role requirements..."
                      style={{
                        width: '100%',
                        height: '120px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        padding: '0.85rem 1rem',
                        fontSize: '0.95rem',
                        color: '#1e293b',
                        background: '#f8fafc',
                        resize: 'none',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid #0073b1';
                        e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 177, 0.1)';
                        e.target.style.background = '#ffffff';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid #cbd5e1';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = '#f8fafc';
                      }}
                    />
                  </div>
                )}
                
                {/* Upload Area */}
                {!genAtsResult && (
                  <div 
                    className={`ats-upload-area ${isGenDragging ? 'dragging' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsGenDragging(true); }}
                    onDragLeave={() => setIsGenDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsGenDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setGenAtsFile(e.dataTransfer.files[0]);
                        setGenAtsResult(null);
                        setGenAtsError(null);
                      }
                    }}
                    onClick={() => genFileInputRef.current && genFileInputRef.current.click()}
                    style={{ 
                      border: '2px dashed #38bdf8', 
                      borderRadius: '12px', 
                      padding: '3rem 2rem', 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      background: isGenDragging ? '#f0f9ff' : '#f8fafc',
                      transition: 'all 0.2s ease',
                      marginBottom: '2rem'
                    }}
                  >
                    <input 
                      type="file" 
                      ref={genFileInputRef} 
                      style={{ display: 'none' }} 
                      accept=".pdf,.docx,.pptx"
                      onChange={handleGenAtsFileChange}
                    />
                    
                    {genAtsFile ? (
                      <div className="ats-file-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <button 
                          className="ats-remove-file" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setGenAtsFile(null); 
                            setGenAtsResult(null); 
                            if (genFileInputRef.current) genFileInputRef.current.value = '';
                          }}
                          style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove file"
                        >×</button>
                        <div className="ats-file-icon-wrapper">
                          {genAtsFile.name.endsWith('.pdf') ? (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          ) : (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0073b1" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          )}
                        </div>
                        <p style={{ fontWeight: '600', color: '#0f172a', margin: 0 }}>{genAtsFile.name}</p>
                        <span style={{ fontSize: '0.85rem', color: '#0073b1', textDecoration: 'underline' }}>Click to change file</span>
                      </div>
                    ) : (
                      <div className="ats-upload-prompt" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="ats-resume-symbol">
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0073b1" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="14" r="2"/><line x1="12" y1="16" x2="12" y2="18"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
                        </div>
                        <p style={{ fontWeight: '600', color: '#334155', margin: 0 }}>Drop your resume here or click to browse</p>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Supports PDF, DOCX, PPTX formats</span>
                      </div>
                    )}
                  </div>
                )}

                {genAtsError && <p className="ats-error" style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1.5rem', fontWeight: '500' }}>{genAtsError}</p>}

                {!genAtsResult && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button 
                      onClick={handleGenAtsUpload}
                      disabled={genAtsLoading || !genAtsFile}
                      style={{
                        background: genAtsFile ? 'linear-gradient(135deg, #0073b1, #0ea5e9)' : '#e2e8f0',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.85rem 2.5rem',
                        borderRadius: '30px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: genAtsFile ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s ease',
                        boxShadow: genAtsFile ? '0 4px 15px rgba(0, 115, 177, 0.25)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {genAtsLoading ? (
                        <>
                          <span className="ats-spinner" style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Analyzing Resume...
                        </>
                      ) : 'Analyze Match'}
                    </button>
                  </div>
                )}

                {/* Results Display */}
                {genAtsResult && (
                  <div className="ats-result-box" style={{ animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>AI ATS Analysis Result</h3>
                      <button 
                        onClick={() => {
                          setGenAtsFile(null);
                          setGenAtsResult(null);
                          setGenAtsError(null);
                          setGenAtsJd("");
                          if (genFileInputRef.current) genFileInputRef.current.value = '';
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid #cbd5e1',
                          borderRadius: '20px',
                          padding: '0.4rem 1.2rem',
                          color: '#475569',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Analyze New Resume
                      </button>
                    </div>

                    <div className="ats-header-summary" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2.5rem' }}>
                      <div className="ats-progress-outer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div className="ats-progress-container" style={{ position: 'relative', width: '130px', height: '130px' }}>
                          <svg className="ats-progress-svg" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                            <circle className="ats-progress-bg" cx="50" cy="50" r="45" style={{ fill: 'none', stroke: '#e2e8f0', strokeWidth: '8' }} />
                            <circle
                              className="ats-progress-bar"
                              cx="50" cy="50" r="45"
                              stroke={getSubscoreColor(genAtsResult.score)}
                              strokeDasharray="283"
                              strokeDashoffset={283 - (283 * getVisualProgress(genAtsResult.score)) / 100}
                              style={{ fill: 'none', strokeWidth: '8', strokeLinecap: 'round', transition: 'stroke-dashoffset 0.8s ease' }}
                            />
                          </svg>
                          <div className="ats-progress-text" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <span className="ats-score-value" style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0f172a', display: 'block', lineHeight: 1 }}>{genAtsResult.score}</span>
                            <span className="ats-score-label" style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>ATS SCORE</span>
                          </div>
                        </div>
                      </div>

                      {/* Grid of Subscores */}
                      {genAtsResult.subScores && (
                        <div className="ats-subscores-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                          <div className="ats-subscore-card" style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div className="ats-subscore-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '600' }}>
                              <span className="ats-subscore-title">🛠️ Skills Match</span>
                              <span className="ats-subscore-num" style={{ color: getSubscoreColor(genAtsResult.subScores.skillsMatch) }}>{genAtsResult.subScores.skillsMatch}%</span>
                            </div>
                            <div className="ats-subscore-bar-bg" style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(genAtsResult.subScores.skillsMatch)}%`, height: '100%', background: getSubscoreColor(genAtsResult.subScores.skillsMatch), borderRadius: '4px', transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                          <div className="ats-subscore-card" style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div className="ats-subscore-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '600' }}>
                              <span className="ats-subscore-title">💼 Experience</span>
                              <span className="ats-subscore-num" style={{ color: getSubscoreColor(genAtsResult.subScores.experienceMatch) }}>{genAtsResult.subScores.experienceMatch}%</span>
                            </div>
                            <div className="ats-subscore-bar-bg" style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(genAtsResult.subScores.experienceMatch)}%`, height: '100%', background: getSubscoreColor(genAtsResult.subScores.experienceMatch), borderRadius: '4px', transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                          <div className="ats-subscore-card" style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div className="ats-subscore-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '600' }}>
                              <span className="ats-subscore-title">🔑 Keyword Density</span>
                              <span className="ats-subscore-num" style={{ color: getSubscoreColor(genAtsResult.subScores.keywordMatch) }}>{genAtsResult.subScores.keywordMatch}%</span>
                            </div>
                            <div className="ats-subscore-bar-bg" style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(genAtsResult.subScores.keywordMatch)}%`, height: '100%', background: getSubscoreColor(genAtsResult.subScores.keywordMatch), borderRadius: '4px', transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                          <div className="ats-subscore-card" style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div className="ats-subscore-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '600' }}>
                              <span className="ats-subscore-title">🌟 Projects Relevance</span>
                              <span className="ats-subscore-num" style={{ color: getSubscoreColor(genAtsResult.subScores.projectRelevance) }}>{genAtsResult.subScores.projectRelevance}%</span>
                            </div>
                            <div className="ats-subscore-bar-bg" style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(genAtsResult.subScores.projectRelevance)}%`, height: '100%', background: getSubscoreColor(genAtsResult.subScores.projectRelevance), borderRadius: '4px', transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                          <div className="ats-subscore-card" style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div className="ats-subscore-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '600' }}>
                              <span className="ats-subscore-title">📋 Formatting Score</span>
                              <span className="ats-subscore-num" style={{ color: getSubscoreColor(genAtsResult.subScores.formattingScore) }}>{genAtsResult.subScores.formattingScore}%</span>
                            </div>
                            <div className="ats-subscore-bar-bg" style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(genAtsResult.subScores.formattingScore)}%`, height: '100%', background: getSubscoreColor(genAtsResult.subScores.formattingScore), borderRadius: '4px', transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                          <div className="ats-subscore-card" style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div className="ats-subscore-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '600' }}>
                              <span className="ats-subscore-title">🎓 Education Match</span>
                              <span className="ats-subscore-num" style={{ color: getSubscoreColor(genAtsResult.subScores.educationMatch) }}>{genAtsResult.subScores.educationMatch}%</span>
                            </div>
                            <div className="ats-subscore-bar-bg" style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div className="ats-subscore-bar-fill" style={{ width: `${getVisualProgress(genAtsResult.subScores.educationMatch)}%`, height: '100%', background: getSubscoreColor(genAtsResult.subScores.educationMatch), borderRadius: '4px', transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Insights */}
                    {genAtsResult.aiInsights && (
                      <div className="ats-insights-section" style={{ background: '#f0fdf4', borderLeft: '4px solid #16a34a', padding: '1.25rem 1.5rem', borderRadius: '0 8px 8px 0', marginBottom: '2.5rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem', color: '#14532d', fontSize: '1rem', fontWeight: '700' }}>💡 Recruiter Insights</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534', lineHeight: 1.5 }}>{genAtsResult.aiInsights}</p>
                      </div>
                    )}

                    {/* Detailed Analysis Tabs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                      
                      {/* Strengths */}
                      <div className="ats-strengths-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
                          <span style={{ color: '#22c55e' }}>✓</span> Strengths
                        </h4>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.9rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {genAtsResult.strengths && genAtsResult.strengths.map((str, idx) => (
                            <li key={idx}>{str}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="ats-weaknesses-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
                          <span style={{ color: '#ef4444' }}>✗</span> Areas of Improvement
                        </h4>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.9rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {genAtsResult.weaknesses && genAtsResult.weaknesses.map((weak, idx) => (
                            <li key={idx}>{weak}</li>
                          ))}
                        </ul>
                      </div>

                    </div>



                    {/* Formatting Analysis */}
                    {genAtsResult.formattingAnalysis && (
                      <div className="ats-formatting-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>📋 Resume Formatting Check</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                          <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Bullet Points</span>
                            <strong style={{ fontSize: '0.95rem', color: genAtsResult.formattingAnalysis.bulletPointsCheck === 'Pass' ? '#22c55e' : '#f59e0b' }}>
                              {genAtsResult.formattingAnalysis.bulletPointsCheck}
                            </strong>
                          </div>
                          <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Standard Headers</span>
                            <strong style={{ fontSize: '0.95rem', color: genAtsResult.formattingAnalysis.sectionHeaderCheck === 'Pass' ? '#22c55e' : '#f59e0b' }}>
                              {genAtsResult.formattingAnalysis.sectionHeaderCheck}
                            </strong>
                          </div>
                          <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>No Complex Tables</span>
                            <strong style={{ fontSize: '0.95rem', color: genAtsResult.formattingAnalysis.tablesCheck === 'Pass' ? '#22c55e' : '#f59e0b' }}>
                              {genAtsResult.formattingAnalysis.tablesCheck}
                            </strong>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                          <strong>Feedback:</strong> {genAtsResult.formattingAnalysis.feedback}
                        </p>
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Jobs Modal */}
      {showAllJobsModal && (() => {
        const modalJobs = applyFilters(jobs);
        let modalTitle = 'All Jobs';
        if (isSearchResult) modalTitle = 'Search Results';
        else if (hasActiveFilters) modalTitle = 'Filtered Search';

        return (
          <AllJobsModal
            jobs={modalJobs}
            title={modalTitle}
            openJob={openJob}
            onClose={() => setShowAllJobsModal(false)}
          />
        );
      })()}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => { setSearchKeyword(''); setSearchLocation(''); setShowAll(false); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); fetchJobs(); }}>
            <img src="/logos/logo.png" alt="PlacementBabai" className="logo-img" />
            <span className="header-tagline">
              {activeMainTab === 'pro-connect' ? 'Connect. Learn. Grow.' : 
               activeMainTab === 'interview-prep' ? 'Practice. Perform. Get Placed.' : 
               'Explore. Apply. Get Hired.'}
            </span>
          </div>

          {activeMainTab !== 'home' && (
            <div className="header-badge" onClick={() => {
              if (activeMainTab === 'interview-prep') {
                 // Navigate to PrepZo and maybe focus on sessions if possible, 
                 // but for now just showing the info is good.
                 window.scrollTo({ top: 0, behavior: 'smooth' });
              } else if (activeMainTab === 'pro-connect') {
                document.querySelector('.pro-profiles-section')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                setActiveFilters(prev => ({ ...prev, datePosted: '24h' }));
                setShowAll(true);
                setIsMobileMenuOpen(false);
                if (filterBarRef.current) {
                  setTimeout(() => {
                    filterBarRef.current.scrollTo({ left: filterBarRef.current.scrollWidth, behavior: 'smooth' });
                  }, 100);
                }
                document.querySelector('.jobs-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}>
              🔥 {activeMainTab === 'interview-prep' ? `${todaySessionsCount} Free Sessions Today` :
                  activeMainTab === 'pro-connect' ? `${newMentorsToday} New Mentors Today` : 
                  `${newJobsToday} New Jobs Today`}
            </div>
          )}

          <div className="header-actions-mobile">
            {activeMainTab !== 'jobs' && (
              <button 
                className="mobile-pro-connect-btn" 
                title="Back to Jobs"
                onClick={() => {
                  setActiveMainTab('jobs');
                  sessionStorage.setItem('activeMainTab', 'jobs');
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
              </button>
            )}

            {activeMainTab !== 'pro-connect' && (
              <button 
                className="mobile-pro-connect-btn" 
                title="ProConnect"
                onClick={() => {
                  setActiveMainTab('pro-connect');
                  sessionStorage.setItem('activeMainTab', 'pro-connect');
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </button>
            )}

            {activeMainTab !== 'interview-prep' && (
              <button 
                className="mobile-pro-connect-btn" 
                title="Interview Prep"
                onClick={() => {
                  setActiveMainTab('interview-prep');
                  sessionStorage.setItem('activeMainTab', 'interview-prep');
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              </button>
            )}

            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          <nav className={isMobileMenuOpen ? "nav-open" : ""}>
            <ul className="nav-links">
              <li>
                <a href="#home" onClick={(e) => {
                  e.preventDefault();
                  setActiveMainTab('home');
                  sessionStorage.setItem('activeMainTab', 'home');
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className={activeMainTab === 'home' ? 'active-nav' : ''}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  Home
                </a>
              </li>
              <li>
                <a href="#jobs" onClick={(e) => {
                  e.preventDefault();
                  setActiveMainTab('jobs');
                  sessionStorage.setItem('activeMainTab', 'jobs');
                  setSearchKeyword(''); setSearchLocation(''); setShowAll(false); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); fetchJobs();
                }} className={activeMainTab === 'jobs' ? 'active-nav' : ''}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  Jobs
                </a>
              </li>
              <li>
                <a href="#pro-connect" onClick={(e) => {
                  e.preventDefault();
                  setActiveMainTab('pro-connect');
                  sessionStorage.setItem('activeMainTab', 'pro-connect');
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className={activeMainTab === 'pro-connect' ? 'active-nav' : ''}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  ProConnect
                </a>
              </li>
              <li>
                <a href="#interview-prep" onClick={(e) => {
                  e.preventDefault();
                  setActiveMainTab('interview-prep');
                  sessionStorage.setItem('activeMainTab', 'interview-prep');
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className={activeMainTab === 'interview-prep' ? 'active-nav' : ''}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                  PrepZo
                </a>
              </li>
              <li>
                <a href="#about" onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  const footer = document.querySelector('.footer-section');
                  if (footer) footer.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  About
                </a>
              </li>
              
              {/* MOBILE ONLY FLAT LINKS */}
              <li className="mobile-nav-item">
                <a 
                  href="#all-jobs"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAllJobsModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  Browse All Jobs
                </a>
              </li>
              <li className="mobile-nav-item">
                <a 
                  href="#mentor-login"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentView('mentor-login');
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                  Mentor Login
                </a>
              </li>

              {/* PC ONLY DROPDOWN MENU */}
              <li className="nav-dropdown-item pc-nav-item" ref={dropdownRef}>
                <button 
                  className={`nav-menu-btn ${showMenuDropdown ? 'active' : ''}`}
                  onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                  style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                  Menu
                </button>
                {showMenuDropdown && (
                  <div className="nav-dropdown-content">
                    <button onClick={() => { setShowAllJobsModal(true); setShowMenuDropdown(false); setIsMobileMenuOpen(false); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                      Browse All Jobs
                    </button>
                    <button onClick={() => { setCurrentView('mentor-login'); setShowMenuDropdown(false); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                      Mentor Login
                    </button>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {activeMainTab === 'home' ? (
        <>
          {/* AI-Powered Hero Section */}
          <section className="hero-ai">
            <div className="hero-ai-container">
              <div className="hero-ai-left">
                <h1>
                  Your Ultimate Career<span className="mobile-br"><br /></span> Buddy to<br />
                  <span className="hero-ai-gradient-text">Land Tech Placements</span>
                </h1>
                
                <p className="hero-ai-desc">
                  Get verified job openings, AI-powered resume analysis, interview preparation, and mentorship — all in one place.
                </p>
                
                <div className="hero-ai-cta-container">
                  <button className="hero-ai-cta-btn" onClick={() => {
                    setActiveMainTab('jobs');
                    setTimeout(() => {
                      document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}>
                    Start Getting Interviews <span className="btn-arrow">&rarr;</span>
                  </button>
                  <button className="hero-ai-cta-btn secondary" onClick={() => {
                    setShowGeneralAtsModal(true);
                  }}>
                    Analyze Resume Free <span className="btn-arrow">&rarr;</span>
                  </button>
                </div>
                
                <div className="hero-ai-bullets">
                  <div className="hero-ai-bullet-item">
                    <span className="hero-ai-bullet-icon">✓</span> 100% Verified Job Links
                  </div>
                  <div className="hero-ai-bullet-item">
                    <span className="hero-ai-bullet-icon">✓</span> Real Interview Questions & Answers
                  </div>
                  <div className="hero-ai-bullet-item">
                    <span className="hero-ai-bullet-icon">✓</span> 1:1 Verified Mentorship
                  </div>
                </div>
                
                <div className="hero-ai-social-proof">
                  <div className="hero-ai-avatars">
                    <div className="hero-ai-avatar avatar-1">H</div>
                    <div className="hero-ai-avatar avatar-2">B</div>
                    <div className="hero-ai-avatar avatar-3">K</div>
                    <div className="hero-ai-avatar avatar-4">S</div>
                  </div>
                  <div className="hero-ai-rating-container">
                    <div className="hero-ai-stars">★★★★★</div>
                    <div className="hero-ai-rating-stats">
                      <span className="stat-item"><strong>7,000+</strong><span className="stat-label">Students & Professionals</span></span>
                      <span className="separator">•</span>
                      <span className="stat-item"><strong>1,200+</strong><span className="stat-label">Placements</span></span>
                      <span className="separator">•</span>
                      <span className="stat-item"><strong>4.8/5</strong><span className="stat-label">User Rating</span></span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="hero-ai-right">
                <div className="hero-ai-glow"></div>
                
                {/* Card 1: AI Match Score Card */}
                <div className="card-match-score">
                  <div className="card-match-score-header">
                    <div className="card-match-icon">✦</div>
                    <div className="card-match-title">
                      <h3>ATS Score</h3>
                      <span>Based on your resume</span>
                    </div>
                  </div>
                  <div className="card-match-circle-score">94%</div>
                  <div className="card-match-status">Perfect Match Found</div>
                  
                  <div className="card-match-stats-list">
                    <div className="card-match-stat-row">
                      <span>Skills Match</span>
                      <span>95%</span>
                    </div>
                    <div className="card-match-stat-row">
                      <span>Experience</span>
                      <span>88%</span>
                    </div>
                    <div className="card-match-stat-row">
                      <span>Formatting</span>
                      <span>92%</span>
                    </div>
                  </div>
                </div>
                
                {/* Card 2: Resume Analysis Card */}
                <div className="card-resume-analysis">
                  <h4>Resume Analysis</h4>
                  <div className="card-resume-item">
                    <span className="card-resume-item-check">✓</span>
                    <span>Skills extracted: 15</span>
                  </div>
                  <div className="card-resume-item">
                    <span className="card-resume-item-check">✓</span>
                    <span>Experience: 2+ years</span>
                  </div>
                  <div className="card-resume-pulsing">
                    <span className="pulse-dot"></span>
                    <span>Finding matches...</span>
                  </div>
                </div>
                
                {/* Card 3: Amazon Job Card */}
                <div className="card-google-job">
                  <div className="card-google-logo" style={{ background: '#ff9900', color: '#ffffff' }}>A</div>
                  <div className="card-google-info">
                    <h4>Amazon</h4>
                    <span>Software Engineer</span>
                    <div className="card-google-pills">
                      <span className="card-google-pill-remote" style={{ background: '#e0f2fe', color: '#0369a1' }}>Full Time</span>
                      <span className="card-google-pill-salary">₹45 - ₹55 LPA</span>
                    </div>
                  </div>
                </div>
                
                {/* Card 4: Matched Today Card */}
                <div className="card-matched-today">
                  <h3>{getStableDailyNumber()}+</h3>
                  <span>Members applied today</span>
                </div>
              </div>
            </div>
          </section>

          {/* Core Pillars Section */}
          <section className="home-pillars-section">
            <div className="home-pillars-container">
              <div className="home-section-header">
                <h2>Placement<span>Babai</span> Core Ecosystem</h2>
                <p>Everything you need to go from preparation to verified placement links</p>
              </div>
              
              <div className="home-pillars-grid">
                <div
                  className="home-pillar-card job-pillar"
                  onClick={() => {
                    if (window.innerWidth <= 640) {
                      setExpandedPillar(expandedPillar === 'jobs' ? null : 'jobs');
                    } else {
                      setActiveMainTab('jobs'); window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  <div className="pillar-card-header">
                    <div className="pillar-icon-wrapper">💼</div>
                    <h3>Verified Jobs Board</h3>
                    <span className={`pillar-chevron ${expandedPillar === 'jobs' ? 'open' : ''}`}>▾</span>
                  </div>
                  <div className={`pillar-card-body ${expandedPillar === 'jobs' ? 'expanded' : ''}`}>
                    <p>Access handpicked hiring links from top tech MNCs and startups. Checked daily, zero spam.</p>
                    <span className="pillar-link" onClick={(e) => { e.stopPropagation(); setActiveMainTab('jobs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Browse Jobs &rarr;</span>
                  </div>
                </div>

                <div
                  className="home-pillar-card connect-pillar"
                  onClick={() => {
                    if (window.innerWidth <= 640) {
                      setExpandedPillar(expandedPillar === 'connect' ? null : 'connect');
                    } else {
                      setActiveMainTab('pro-connect'); window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  <div className="pillar-card-header">
                    <div className="pillar-icon-wrapper">👥</div>
                    <h3>ProConnect Mentorship</h3>
                    <span className={`pillar-chevron ${expandedPillar === 'connect' ? 'open' : ''}`}>▾</span>
                  </div>
                  <div className={`pillar-card-body ${expandedPillar === 'connect' ? 'expanded' : ''}`}>
                    <p>Connect 1:1 with verified industry leaders for resume reviews, mock interviews, and career guidance.</p>
                    <span className="pillar-link" onClick={(e) => { e.stopPropagation(); setActiveMainTab('pro-connect'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Find Mentors &rarr;</span>
                  </div>
                </div>

                <div
                  className="home-pillar-card prep-pillar"
                  onClick={() => {
                    if (window.innerWidth <= 640) {
                      setExpandedPillar(expandedPillar === 'prep' ? null : 'prep');
                    } else {
                      setActiveMainTab('interview-prep'); window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  <div className="pillar-card-header">
                    <div className="pillar-icon-wrapper">🎓</div>
                    <h3>PrepZo AI Interview Prep</h3>
                    <span className={`pillar-chevron ${expandedPillar === 'prep' ? 'open' : ''}`}>▾</span>
                  </div>
                  <div className={`pillar-card-body ${expandedPillar === 'prep' ? 'expanded' : ''}`}>
                    <p>Practice company-specific interview questions and join free live mentorship workshops daily.</p>
                    <span className="pillar-link" onClick={(e) => { e.stopPropagation(); setActiveMainTab('interview-prep'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Start Practice &rarr;</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="how-it-works-section">
            <div className="how-it-works-container">
              <div className="home-section-header">
                <h2>How Placement<span>Babai</span> Works</h2>
                <p>Simple 4-step path to landing your next tech interview</p>
              </div>

              <div className="timeline-steps-circular">
                {/* SVG connection line behind the circles */}
                <div className="timeline-svg-line">
                  <svg viewBox="0 0 1200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Gap 1 Wave */}
                    <path d="M 220,100 C 245,145 295,145 340,45" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 8" opacity="0.9" />

                    {/* Gap 2 Wave */}
                    <path d="M 537,100 C 562,145 612,145 660,45" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 8" opacity="0.9" />

                    {/* Gap 3 Wave */}
                    <path d="M 854,100 C 879,145 929,145 982,45" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 8" opacity="0.9" />
                  </svg>
                </div>

                <div className="circular-step-card">
                  <div className="circular-step-badge">
                    <span className="badge-num">01</span>
                    <span className="badge-lbl">Step</span>
                  </div>
                  <h4>Explore Jobs</h4>
                  <p>See and search through 100% verified jobs on our active jobs dashboard daily.</p>
                </div>

                <div className="circular-step-card">
                  <div className="circular-step-badge">
                    <span className="badge-num">02</span>
                    <span className="badge-lbl">Step</span>
                  </div>
                  <h4>ATS & Resume Match</h4>
                  <p>Check your ATS score freely and match your resume using our AI-powered analyzer.</p>
                </div>

                <div className="circular-step-card">
                  <div className="circular-step-badge">
                    <span className="badge-num">03</span>
                    <span className="badge-lbl">Step</span>
                  </div>
                  <h4>ProConnect Insights</h4>
                  <p>Connect with a pro 1:1 via ProConnect to get real industry insights and feedback.</p>
                </div>

                <div className="circular-step-card">
                  <div className="circular-step-badge">
                    <span className="badge-num">04</span>
                    <span className="badge-lbl">Step</span>
                  </div>
                  <h4>PrepZo Practice</h4>
                  <p>Prepare in PrepZo accordingly using real company-specific interview archives.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : activeMainTab === 'jobs' ? (
        <>
          {/* Hero Section */}
          <section className="hero">
            <div className="hero-content">
              <h1>Searching for Your Dream&nbsp;Job?<br /><span className="hero-highlight">Let Placement<span style={{ color: '#ff8c00', WebkitTextFillColor: '#ff8c00' }}>Babai</span> Help You Get Hired</span></h1>
              <p className="hero-subtitle" style={{ marginBottom: '0.25rem' }}>
                India’s Trusted Job Discovery Platform for Freshers & Professionals
              </p>
              <p className="hero-subtitle" style={{ marginTop: 0, fontWeight: '600' }}>
                Verified placement links, Updated daily
              </p>

              {/* Search Bar */}
              <div className="search-container">
                <div className="search-input-group">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by Skills, Company or Job Title"
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyPress={handleKeyPress}
                  />
                  {showSuggestions && getSuggestions().length > 0 && (
                    <div className="search-suggestions">
                      {getSuggestions().map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="search-suggestion-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSearchKeyword(suggestion);
                            setShowSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="search-input-group">
                  <span className="search-icon">📍</span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Location"
                    value={searchLocation}
                    onChange={(e) => {
                      setSearchLocation(e.target.value);
                      setShowLocSuggestions(true);
                    }}
                    onFocus={() => setShowLocSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowLocSuggestions(false), 200)}
                    onKeyPress={handleKeyPress}
                  />
                  {showLocSuggestions && getLocSuggestions().length > 0 && (
                    <div className="search-suggestions">
                      {getLocSuggestions().map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="search-suggestion-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSearchLocation(suggestion);
                            setShowLocSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="search-input-group search-exp-input-group">
                  <span className="search-icon">🎓</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="search-input search-exp-number"
                    placeholder="Years of exp"
                    value={searchExperience}
                    onChange={(e) => setSearchExperience(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  {searchExperience !== '' && (
                    <span className="exp-badge">
                      {parseInt(searchExperience, 10) === 0 ? '🌱 Fresher' : parseInt(searchExperience, 10) <= 3 ? '📅 Junior' : '🚀 Senior'}
                    </span>
                  )}
                </div>

                <button className="search-btn" onClick={handleSearch}>
                  Search Jobs
                </button>
              </div>

              {/* Popular Searches */}
              <div className="popular-searches">
                <span className="popular-label">🔥 Trending:</span>
                {['Java Developer', 'Data Analyst', 'React Developer', 'Python', 'DevOps'].map(tag => (
                  <button key={tag} className="popular-tag" onClick={() => setSearchKeyword(tag)}>
                    {tag}
                  </button>
                ))}
              </div>

              <div className="hero-browse">
                <button className="browse-all-btn" onClick={(e) => {
                  e.preventDefault();
                  setShowAllJobsModal(true);
                }}>
                  Browse All Jobs &rarr;
                </button>
              </div>

              {/* Trust Stats */}
              <div className="hero-stats">
                <div className="hero-stat"><span className="stat-number">1,500+</span><span className="stat-label">Jobs Listed</span></div>
                <div className="hero-stat-divider" />
                <div className="hero-stat"><span className="stat-number">150+</span><span className="stat-label">Companies</span></div>
                <div className="hero-stat-divider" />
                <div className="hero-stat"><span className="stat-number">7,000+</span><span className="stat-label">Job Seekers</span></div>
                <div className="hero-stat-divider" />
                <div className="hero-stat"><span className="stat-number">1,200+</span><span className="stat-label">Offers Secured</span></div>
              </div>
            </div>
          </section >

          {/* Jobs Section */}
          <section className="jobs-section" id="jobs">
            <div className="filter-bar-wrapper">
              {/* Fixed label - mobile only */}
              <span className="filter-bar-label" style={{ color: '#334155' }}>Filters</span>

              {/* Left scroll arrow - mobile only */}
              <button className="filter-scroll-btn filter-scroll-left" aria-label="Scroll filters left"
                onClick={() => { filterBarRef.current?.scrollBy({ left: -150, behavior: 'smooth' }); }}>
                ‹
              </button>

              {/* Scrollable pills */}
              <div className="filter-bar" ref={filterBarRef}>
                <CustomSelect
                  options={FILTERS.passoutYear}
                  value={activeFilters.passoutYear}
                  onChange={(val) => toggleFilter('passoutYear', val)}
                  placeholder="🎓 Passout Year"
                />

                <CustomSelect
                  options={FILTERS.salary}
                  value={activeFilters.salary}
                  onChange={(val) => toggleFilter('salary', val)}
                  placeholder="💰 Package"
                />

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
                  options={FILTERS.companyType}
                  value={activeFilters.companyType}
                  onChange={(val) => toggleFilter('companyType', val)}
                  placeholder="🏢 Company"
                />

                <CustomSelect
                  options={FILTERS.jobType}
                  value={activeFilters.jobType}
                  onChange={(val) => toggleFilter('jobType', val)}
                  placeholder="💼 Job Type"
                />

                <CustomSelect
                  options={FILTERS.datePosted}
                  value={activeFilters.datePosted}
                  onChange={(val) => toggleFilter('datePosted', val)}
                  placeholder="🗓️ Date Posted"
                />

                <CustomSelect
                  options={[
                    { label: 'Newest First', value: 'newest' },
                    { label: 'Oldest First', value: 'oldest' },
                    { label: 'A-Z', value: 'az' },
                    { label: 'Z-A', value: 'za' }
                  ]}
                  value={sortType}
                  onChange={(val) => { setSortType(val); setShowAll(false); }}
                  placeholder="Sort By"
                />

                {/* Clear REMOVED from scroll area - now after › */}
              </div>

              {/* Right scroll arrow pinned at right edge */}
              <button
                className="filter-scroll-btn filter-scroll-right"
                aria-label="Scroll filters right"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
                onClick={() => { filterBarRef.current?.scrollBy({ left: 150, behavior: 'smooth' }); }}>
                ›
              </button>

              {/* Clear pinned AFTER › - always visible, easy to tap */}
              {hasActiveFilters && (
                <button className="filter-clear-btn" onClick={() => { setActiveFilters({}); setSortType(''); setShowAll(false); }}>
                  ✕
                </button>
              )}
            </div>

            <div className="section-header">
              <h2>
                {isSearchResult
                  ? `Search Results (${applyFilters(jobs).length})`
                  : hasActiveFilters
                    ? `Filtered Search (${applyFilters(jobs).length})`
                    : showAll
                      ? `All Jobs`
                      : 'Recent Jobs'}
              </h2>
              {/* Center label - mobile only */}
              {!showAll && !isSearchResult && applyFilters(jobs).length > 3 && (
                <span className="section-showing-label">
                  showing top 3 jobs
                </span>
              )}
              {applyFilters(jobs).length > 3 && (
                <button
                  className="view-all-btn"
                  onClick={() => {
                    setShowAllJobsModal(true);
                  }}
                >
                  View all jobs →
                </button>
              )}
            </div>

            {loading && <div className="loading">Loading jobs...</div>}

            {error && <div className="error">Error: {error}</div>}

            {
              !loading && !error && jobs.length === 0 && (
                <div className="no-jobs">No jobs found. Try a different search.</div>
              )
            }

            {
              !loading && !error && jobs.length > 0 && (() => {
                const totalFiltered = applyFilters(jobs);           // filter ALL jobs
                const filtered = showAll ? totalFiltered : totalFiltered.slice(0, 3); // then slice
                return (
                  <>
                    {filtered.length === 0 ? (
                      <div className="no-jobs">No jobs match the selected filters. <button className="filter-clear-btn" onClick={() => setActiveFilters({})}>Clear filters</button></div>
                    ) : (
                      <div className="jobs-carousel-wrapper">
                        <button
                          className="jobs-nav-btn jobs-nav-prev"
                          aria-label="Previous job"
                          onClick={() => {
                            if (jobsGridRef.current) {
                              jobsGridRef.current.scrollBy({ left: -jobsGridRef.current.offsetWidth, behavior: 'smooth' });
                            }
                          }}
                          style={{ visibility: canScrollLeft ? 'visible' : 'hidden' }}
                        >
                          ‹
                        </button>

                        <div className="jobs-grid" ref={jobsGridRef} onScroll={checkScroll}>
                          {filtered.map((job) => {
                            const isNewJob = job.postedDate && new Date(job.postedDate).toDateString() === new Date().toDateString();
                            const isLastDay = job.expiryDate && job.expiryDate !== "Don't know" && new Date(job.expiryDate).toDateString() === new Date().toDateString();
                            return (
                              <div
                                key={job.id}
                                className="job-card"
                                onClick={() => openJob(job)}
                                title="Click to view job details"
                                style={{ position: 'relative' }}
                              >
                                <div className="job-card-body">
                                  <div className="job-card-header">
                                    <div className="company-logo">
                                      {getCompanyInitials(job.company)}
                                    </div>
                                    <div className="job-info">
                                      <h3 className="job-title">{job.title}</h3>
                                      <p className="company-name">{job.company}</p>
                                    </div>
                                  </div>

                                  <div className="job-details">
                                    {isNewJob && (
                                      <div className="job-detail-item" style={{
                                        background: 'rgba(217, 119, 6, 0.15)',
                                        border: '1px solid rgba(217, 119, 6, 0.4)',
                                        color: '#b45309',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '20px',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.2rem'
                                      }}>
                                        <span style={{ fontSize: '0.85rem', animation: 'pulse 2s infinite' }}>🔥</span>
                                        <span>Posted Today</span>
                                      </div>
                                    )}
                                    {isLastDay && (
                                      <div className="job-detail-item" style={{
                                        background: 'rgba(230, 74, 25, 0.1)',
                                        border: '1px solid rgba(230, 74, 25, 0.3)',
                                        color: '#e64a19',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '20px',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.2rem'
                                      }}>
                                        <span style={{ fontSize: '0.85rem', animation: 'bounce 2s infinite' }}>⏳</span>
                                        <span>Last Day to Apply</span>
                                      </div>
                                    )}
                                    <div className="job-detail-item">
                                      <span className="job-detail-icon">💰</span>
                                      <span>{job.salary || '—'}</span>
                                    </div>
                                    {job.experienceLevel && (
                                      <div className="job-detail-item">
                                        <span className="job-detail-icon">📅</span>
                                        <span>{job.experienceLevel}</span>
                                      </div>
                                    )}
                                    {job.passoutYear && (
                                      <div className="job-detail-item">
                                        <span className="job-detail-icon">🎓</span>
                                        <span>{job.passoutYear}</span>
                                      </div>
                                    )}
                                    <div className="job-detail-item">
                                      <span className="job-detail-icon">📍</span>
                                      <span>{job.location}</span>
                                    </div>
                                    {job.jobType && (
                                      <div className="job-detail-item">
                                        <span className="job-detail-icon">💼</span>
                                        <span>{job.jobType}</span>
                                      </div>
                                    )}
                                  </div>

                                  {job.description && (
                                    <p className="job-description">{job.description}</p>
                                  )}

                                  {job.skills && (
                                    <div className="job-skills">
                                      {job.skills.split(',').map((skill, index) => (
                                        <span key={index} className="skill-tag">
                                          {skill.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="job-card-footer">
                                  <span className="view-details-hint">View Details →</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <button
                          className="jobs-nav-btn jobs-nav-next"
                          aria-label="Next job"
                          onClick={() => {
                            if (jobsGridRef.current) {
                              jobsGridRef.current.scrollBy({ left: jobsGridRef.current.offsetWidth, behavior: 'smooth' });
                            }
                          }}
                          style={{ visibility: canScrollRight ? 'visible' : 'hidden' }}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}

          </section >
        </>
      ) : activeMainTab === 'pro-connect' ? (
        <ProConnect onMentorLoginClick={() => setCurrentView('mentor-login')} />
      ) : (
        <InterviewPrep />
      )}

      {/* Featured Companies Marquee */}
      < section className="companies-section" >
        <h2 className="companies-title">Featured Companies</h2>
        <div className="marquee-wrapper">
          <div className="marquee-track">
            {[
              { name: 'IBM', image: '/logos/IBM.jpg' },
              { name: 'LTIMindtree', image: '/logos/LTIMindtree.jpg' },
              { name: 'Accenture', image: '/logos/accenture.jpg' },
              { name: 'Amazon', image: '/logos/amazon.png' },
              { name: 'Capgemini', image: '/logos/capgemini.png' },
              { name: 'Cognizant', image: '/logos/cognizant.jpg' },
              { name: 'Deloitte', image: '/logos/deloitte.png' },
              { name: 'Google', image: '/logos/google.jpg' },
              { name: 'HCLTech', image: '/logos/hcltech.jpg' },
              { name: 'Infosys', image: '/logos/infosys.jpg' },
              { name: 'Microsoft', image: '/logos/microsoft.jpg' },
              { name: 'Oracle', image: '/logos/oracle.png' },
              { name: 'TCS', image: '/logos/tcs.jpg' },
              { name: 'Tech Mahindra', image: '/logos/tech mahindra.jpg' },
              // Duplicates for seamless loop
              { name: 'IBM', image: '/logos/IBM.jpg' },
              { name: 'LTIMindtree', image: '/logos/LTIMindtree.jpg' },
              { name: 'Accenture', image: '/logos/accenture.jpg' },
              { name: 'Amazon', image: '/logos/amazon.png' },
              { name: 'Capgemini', image: '/logos/capgemini.png' },
              { name: 'Cognizant', image: '/logos/cognizant.jpg' },
              { name: 'Deloitte', image: '/logos/deloitte.png' },
              { name: 'Google', image: '/logos/google.jpg' },
              { name: 'HCLTech', image: '/logos/hcltech.jpg' },
              { name: 'Infosys', image: '/logos/infosys.jpg' },
              { name: 'Microsoft', image: '/logos/microsoft.jpg' },
              { name: 'Oracle', image: '/logos/oracle.png' },
              { name: 'TCS', image: '/logos/tcs.jpg' },
              { name: 'Tech Mahindra', image: '/logos/tech mahindra.jpg' }
            ].map((company, index) => (
              <div key={index} className="company-logo-item">
                <img src={company.image} alt={company.name} className="company-logo-img" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer-section" id="about">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logos/logo.png" alt="PlacementBabai" className="footer-logo" />
            {/* Short tagline for mobile */}
            <p className="footer-tagline footer-tagline-mobile">
              PlacementBabai is India's trusted platform helping candidates secure dream jobs through verified off-campus links. We simplify your placement journey by providing active, genuine, and handpicked opportunities — all in one place. <strong>Explore. Apply. Get Hired.</strong>
            </p>
            {/* Full tagline for desktop */}
            <p className="footer-tagline footer-tagline-desktop">
              PlacementBabai is India's trusted platform helping candidates secure dream jobs through verified off-campus links.<br /><br />
              We simplify your placement journey by providing active, genuine, and handpicked opportunities — all in one place.<br /><br />
              <strong>Explore. Apply. Get Hired.</strong>
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#home" onClick={(e) => { e.preventDefault(); setActiveMainTab('home'); sessionStorage.setItem('activeMainTab', 'home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a></li>
                <li><a href="#jobs" onClick={(e) => { e.preventDefault(); setActiveMainTab('jobs'); sessionStorage.setItem('activeMainTab', 'jobs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Search Jobs</a></li>
                <li><a href="#pro-connect" onClick={(e) => { e.preventDefault(); setActiveMainTab('pro-connect'); sessionStorage.setItem('activeMainTab', 'pro-connect'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>ProConnect</a></li>
                <li><a href="#interview-prep" onClick={(e) => { e.preventDefault(); setActiveMainTab('interview-prep'); sessionStorage.setItem('activeMainTab', 'interview-prep'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>PrepZo Practice</a></li>
                <li><a href="#companies" onClick={(e) => { e.preventDefault(); if (activeMainTab !== 'home') { setActiveMainTab('home'); sessionStorage.setItem('activeMainTab', 'home'); setTimeout(() => { document.querySelector('.companies-section')?.scrollIntoView({ behavior: 'smooth' }); }, 150); } else { document.querySelector('.companies-section')?.scrollIntoView({ behavior: 'smooth' }); } }}>Featured Companies</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Legal</h3>
              <ul>
                <li><a href="#privacy" onClick={(e) => { e.preventDefault(); setLegalContent('privacy'); }}>Privacy Policy</a></li>
                <li><a href="#terms" onClick={(e) => { e.preventDefault(); setLegalContent('terms'); }}>Terms of Service</a></li>
                <li><a href="#contact" onClick={(e) => { e.preventDefault(); setLegalContent('contact'); }}>Contact Us</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Our Mission</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '250px', margin: 0 }}>
                To empower job seekers across India by providing verified off-campus opportunities, expert mentorship, and premium career prep tools to get placed with confidence.
              </p>
            </div>

            <div className="footer-column">
              <div className="footer-social-wrapper">
                <h3 className="footer-social-heading">Follow us at</h3>
                <div className="footer-socials">
                  <a href="#" aria-label="LinkedIn" className="social-icon social-linkedin" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  </a>
                  <a href="https://www.instagram.com/placement_babai?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" aria-label="Instagram" className="social-icon social-insta" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                  <a href="https://youtube.com/@placementbabai?si=UFcAEkaMRb6nyDeT" aria-label="YouTube" className="social-icon social-youtube" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                  </a>
                  <a href="https://t.me/+78I0GYO6f8A5MmQ9" aria-label="Telegram" className="social-icon social-telegram" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 PlacementBabai. All rights reserved.</p>
          <hr className="footer-divider" />
          <p className="footer-made-with">Made with ❤️ for Job Seekers in India</p>
        </div>
      </footer >

    </div >
  );
}

export default App;
