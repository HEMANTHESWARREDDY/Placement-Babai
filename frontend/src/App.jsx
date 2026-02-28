import { useState, useEffect, useRef } from 'react';
import JobDetail from './JobDetail';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import CustomSelect from './CustomSelect';
import LegalModal from './LegalModal';
import { API_BASE_URL } from './config';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [searchExperience, setSearchExperience] = useState('');
  const [currentView, setCurrentView] = useState('home'); // 'home', 'admin-login', 'admin-dashboard'
  const [adminData, setAdminData] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortType, setSortType] = useState('');
  const [legalContent, setLegalContent] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    ],
    location: [
      { label: '🏠 Remote', value: 'Remote' },
      { label: '🏙️ Bangalore', value: 'Bangalore' },
      { label: '🌆 Hyderabad', value: 'Hyderabad' },
      { label: '🌇 Mumbai', value: 'Mumbai' },
      { label: '🏘️ Pune', value: 'Pune' },
    ],
    companyType: [
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
      { label: '🕒 Today', value: '24h' },
      { label: '📅 Last 7 days', value: '7d' },
      { label: '🗓️ Last 30 days', value: '30d' },
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
        const matched =
          jobRole.includes(roleVal) ||
          titleLow.includes(roleVal) ||
          catLow.includes(roleVal) ||
          skillsLow.includes(roleVal) ||
          // special aliases
          (roleVal === 'developer' && (titleLow.includes('dev') || titleLow.includes('engineer') || titleLow.includes('full stack') || titleLow.includes('backend') || titleLow.includes('frontend'))) ||
          (roleVal === 'ml' && (titleLow.includes('machine learning') || titleLow.includes(' ml ') || titleLow.includes('data scientist') || titleLow.includes('ai ') || skillsLow.includes('tensorflow') || skillsLow.includes('pytorch'))) ||
          (roleVal === 'qa' && (titleLow.includes('test') || titleLow.includes('qa') || titleLow.includes('quality'))) ||
          (roleVal === 'devops' && (titleLow.includes('devops') || titleLow.includes('cloud') || titleLow.includes('sre') || skillsLow.includes('docker') || skillsLow.includes('kubernetes'))) ||
          (roleVal === 'analyst' && (titleLow.includes('analyst') || titleLow.includes('bi ') || titleLow.includes('data'))) ||
          (roleVal === 'design' && (titleLow.includes('design') || titleLow.includes('ui') || titleLow.includes('ux')));
        if (!matched) return false;
      }

      // ── Location filter ───────────────────────────────────────────
      if (activeFilters.location) {
        const locFilter = activeFilters.location.toLowerCase();
        const locJob = (job.location || '').toLowerCase();
        const typeJob = (job.jobType || '').toLowerCase();
        const isRemote = locJob.includes('remote') || typeJob.includes('remote');
        if (locFilter === 'remote') {
          if (!isRemote) return false;
        } else {
          if (!locJob.includes(locFilter)) return false;
        }
      }

      // ── Company type filter ───────────────────────────────────────
      if (activeFilters.companyType) {
        const ctJob = (job.companyType || '').toLowerCase();
        if (!ctJob.includes(activeFilters.companyType.toLowerCase())) return false;
      }

      // ── Job Type filter ───────────────────────────────────────────
      if (activeFilters.jobType && job.jobType !== activeFilters.jobType) return false;

      // ── Salary / Package filter ───────────────────────────────────
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

      // ── Experience filter (filter bar dropdown) ──────────────────
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
      if (!sortType) return 0;
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
    fetch(`${API_BASE_URL}/api/analytics/view/website`, { method: 'POST' }).catch(() => { });

    // Hidden admin route via URL parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setCurrentView('admin-login');
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

  const newJobsToday = jobs.filter(job => {
    if (!job.postedDate) return false;
    const jobDate = new Date(job.postedDate);
    const now = new Date();
    const diffTime = Math.abs(now - jobDate);
    return diffTime <= 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="App">
      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetail job={selectedJob} onClose={closeJob} />
      )}

      {/* Legal Content Modal */}
      {legalContent && (
        <LegalModal type={legalContent} onClose={() => setLegalContent(null)} />
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => { setSearchKeyword(''); setSearchLocation(''); setShowAll(false); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); fetchJobs(); }}>
            <img src="/logos/logo.png" alt="PlacementBabai" className="logo-img" />
            <span className="header-tagline">Explore. Apply. Get Hired.</span>
          </div>

          <div className="header-badge" onClick={() => {
            setActiveFilters(prev => ({ ...prev, datePosted: '24h' }));
            setShowAll(true);
            setIsMobileMenuOpen(false);
            if (filterBarRef.current) {
              setTimeout(() => {
                filterBarRef.current.scrollTo({ left: filterBarRef.current.scrollWidth, behavior: 'smooth' });
              }, 100);
            }
            document.querySelector('.jobs-section')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            🔥 {newJobsToday} New Jobs Today
          </div>

          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>

          <nav className={isMobileMenuOpen ? "nav-open" : ""}>
            <ul className="nav-links">
              <li>
                <a href="#home" onClick={(e) => {
                  e.preventDefault();
                  setSearchKeyword(''); setSearchLocation(''); setShowAll(false); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); fetchJobs();
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', flexShrink: 0 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  Home
                </a>
              </li>
              <li>
                <a href="#about" onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  const footer = document.querySelector('.footer-section');
                  if (footer) footer.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  About
                </a>
              </li>
              <li>
                <a href="#browse" onClick={(e) => {
                  e.preventDefault();
                  setSearchKeyword('');
                  setSearchLocation('');
                  setSearchExperience('');
                  setActiveFilters({});
                  setSortType('');
                  setShowAll(true);
                  setIsMobileMenuOpen(false);
                  fetchJobs().then(() => {
                    document.querySelector('.jobs-section')?.scrollIntoView({ behavior: 'smooth' });
                  });
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', flexShrink: 0 }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  Browse All Jobs
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Searching for Your Dream Job?<br /><span className="hero-highlight">Let Placement<span style={{ color: '#ff8c00', WebkitTextFillColor: '#ff8c00' }}>Babai</span> Help You Get Hired</span></h1>
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
              Search
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
              setSearchKeyword('');
              setSearchLocation('');
              setSearchExperience('');
              setActiveFilters({});
              setSortType('');
              setShowAll(true);
              fetchJobs().then(() => {
                document.querySelector('.jobs-section')?.scrollIntoView({ behavior: 'smooth' });
              });
            }}>
              Browse All Jobs &rarr;
            </button>
          </div>

          {/* Trust Stats */}
          <div className="hero-stats">
            <div className="hero-stat"><span className="stat-number">500+</span><span className="stat-label">Jobs Listed</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><span className="stat-number">150+</span><span className="stat-label">Companies</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><span className="stat-number">2,000+</span><span className="stat-label">Job Seekers</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><span className="stat-number">400+</span><span className="stat-label">Offers Secured</span></div>
          </div>
        </div>
      </section >

      {/* Jobs Section */}
      < section className="jobs-section" id="jobs" >
        {/* Filter Bar */}
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
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? '← less jobs' : 'View all jobs →'}
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
                      {/* recent-label removed — now in section-header */}
                      {filtered.map((job) => (
                        <div
                          key={job.id}
                          className="job-card"
                          onClick={() => openJob(job)}
                          title="Click to view job details"
                        >
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

                          <div className="job-card-footer">
                            <span className="view-details-hint">View Details →</span>
                          </div>
                        </div>
                      ))}
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
              PlacementBabai is a trusted job discovery platform helping students and professionals find verified placements from top companies. We simplify job searching by providing updated, genuine, and handpicked opportunities — all in one place. <strong>Explore. Apply. Get Hired.</strong>
            </p>
            {/* Full tagline for desktop */}
            <p className="footer-tagline footer-tagline-desktop">
              PlacementBabai is a trusted job discovery platform helping students and professionals find verified placement links from top companies.<br /><br />
              We simplify job searching by providing updated, genuine, and handpicked opportunities — all in one place.<br /><br />
              <strong>Explore. Apply. Get Hired.</strong>
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a></li>
                <li><a href="#search" onClick={(e) => { e.preventDefault(); document.querySelector('.hero')?.scrollIntoView({ behavior: 'smooth' }); setTimeout(() => document.querySelector('.search-input').focus(), 500); }}>Search Jobs</a></li>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); document.querySelector('.companies-section')?.scrollIntoView({ behavior: 'smooth' }); }}>Featured Companies</a></li>
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
                To make job searching simple, transparent, and accessible for every student in India.
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
