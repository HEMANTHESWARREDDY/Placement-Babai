import { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const CHAT_API_KEY = 'REDACTED_OPENROUTER_KEY';
const USE_OPENROUTER = CHAT_API_KEY.startsWith('sk-or-v1-');
const CHAT_API_URL = USE_OPENROUTER
  ? 'https://openrouter.ai/api/v1/chat/completions'
  : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CHAT_API_KEY}`;

const SITE_CONTEXT = `You are "AI Babai", the friendly AI assistant for Placement Babai — India's trusted off-campus placement and career platform.

== WEBSITE FEATURES ==

1. JOBS (home page, route: /)
   - Browse 500+ verified off-campus job listings from MNCs and startups
   - Search by: keyword (job title, company, skills), location, years of experience
   - Filter by: Role (Developer, Analyst, ML/AI, QA, DevOps, Design), Experience (Fresher, 1-3 Yrs, 3+ Yrs), Location (Remote, Bangalore, Hyderabad, Mumbai, Pune), Company Type (MNC, Startup), Job Type (Full-time, Part-time, Internship, Hybrid), Salary (0-3 LPA, 3-6 LPA, 6-10 LPA, 10+ LPA), Date Posted, Passout Year (2024, 2025, 2026)
   - Click any job card to see full details, requirements, and apply link

2. PROCONNECT (route: /proConnect)
   - Book 1-on-1 video sessions with verified industry mentors
   - Mentors from top companies: TCS, Infosys, Google, Wipro, etc.
   - Great for: career guidance, mock interviews, resume review with expert, domain advice
   - Browse all mentors, filter by domain/experience, see availability and book a slot

3. PREPZO - INTERVIEW PREP (route: /prepZo)
   - AI-powered interview preparation tool
   - Topic-wise question banks (DSA, System Design, DBMS, OS, CN, OOP)
   - Company-specific prep (TCS, Infosys, Wipro, Cognizant, Accenture, etc.)
   - HR round preparation, behavioral questions
   - Mock interview with AI feedback

4. PRACTICEHUB (route: /practiceHub)
   - Coding practice problems with solutions
   - Aptitude and reasoning tests (quantitative, verbal, logical)
   - Topic quizzes: Java, Python, SQL, JavaScript, etc.
   - DSA (Data Structures & Algorithms) exercises
   - Real placement test simulations

5. RESUME ATS CHECKER (route: /ResumeReview)
   - Upload your resume (PDF/DOCX) for instant AI analysis
   - General ATS Check: Overall resume quality, formatting score, keyword density
   - Targeted JD Match: Paste any job description to get match % and missing keywords
   - AI tips to improve your resume score

== YOUR JOB ==
- Help users find what they need on Placement Babai
- If a feature exists, guide them to it with clear steps
- If something doesn't exist on the site, suggest the closest available alternative
- Be warm, concise, and encouraging — like a helpful senior who knows this platform inside-out
- Keep responses under 120 words
- Use emojis sparingly (max 2 per response)
- When you want to direct a user to a specific section, include exactly one of these tags at the END of your response:
  [NAVIGATE:jobs] — for the Jobs / home page
  [NAVIGATE:proConnect] — for ProConnect mentor booking
  [NAVIGATE:interviewPrep] — for PrepZo interview prep
  [NAVIGATE:practiceHub] — for PracticeHub coding/aptitude practice
  [NAVIGATE:resumeReview] — for the Resume ATS Checker
- Only include a NAVIGATE tag when you are confidently directing the user somewhere specific
- Never include more than one NAVIGATE tag per response`;

const QUICK_REPLIES = [
  { icon: '🔍', label: 'Find jobs for me' },
  { icon: '👨‍💼', label: 'Book a mentor' },
  { icon: '📄', label: 'Check my resume' },
  { icon: '💻', label: 'Practice coding' },
  { icon: '🎯', label: 'Prepare for interviews' },
];

const NAV_ACTIONS = {
  jobs: { label: '→ Go to Jobs', tab: 'jobs' },
  proConnect: { label: '→ Open ProConnect', tab: 'pro-connect' },
  interviewPrep: { label: '→ Open PrepZo', tab: 'interview-prep' },
  practiceHub: { label: '→ Open PracticeHub', tab: 'practice-hub' },
  resumeReview: { label: '→ Check ATS Score', tab: 'resumeReview' },
};

function BabaiMascotImage({ className = '', size = 26, alt = 'AI Babai' }) {
  return (
    <img
      src="/images/Babai.png"
      alt={alt}
      className={className}
      style={{
        display: 'block',
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'cover',
        borderRadius: '50%',
        background: 'transparent',
        boxShadow: 'none',
      }}
    />
  );
}

function ChatBot({ onNavigate, onOpenAts, onAssistantQuery }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hey there! 👋 I'm **AI Babai**, your career buddy! 🚀 From finding jobs to acing interviews, improving your resume, and building skills, I'm here to help you get hired. Explore the ☰ menu for more! 😊",
      navAction: null,
      isWelcome: true,
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const conversationHistory = useRef([]);
  const irrelevantStreakRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      setShowQuickMenu(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showQuickMenu) return;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowQuickMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowQuickMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showQuickMenu]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chatbot-open');
    } else {
      document.body.classList.remove('chatbot-open');
    }
    return () => document.body.classList.remove('chatbot-open');
  }, [isOpen]);

  // Show notification dot after 3 seconds to attract attention
  useEffect(() => {
    if (!hasOpened) {
      const timer = setTimeout(() => setHasOpened(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    setHasOpened(true);
  };

  const parseResponse = (text) => {
    const navMatch = text.match(/\[NAVIGATE:(\w+)\]/);
    const cleanText = text.replace(/\[NAVIGATE:\w+\]/g, '').trim();
    return {
      text: cleanText,
      navAction: navMatch ? navMatch[1] : null,
    };
  };

  const normalizeJobQuery = (query) => {
    if (!query) return '';

    const cleaned = query
      .replace(/^(find|show|search|give|list|me|please|can you|can u|help me with|help me)\s+/i, '')
      .replace(/\s+(?:job|jobs|role|roles|position|positions)\s*$/i, '')
      .trim();

    return cleaned.replace(/\s+/g, ' ');
  };

  const extractJobSearchIntent = (text) => {
    const lower = text.toLowerCase();
    const locationKeywords = ['remote', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'mumbai', 'delhi', 'chennai', 'gurugram', 'noida'];
    const experiencePatterns = [
      /\b(\d+)\s*\+?\s*year(s)?\s*(?:experience|exp)?\b/i,
      /\b(\d+)\s*\+?\s*yr(s)?\b/i,
      /\b(\d+)\s*\+?\s*years?\s*of\s*experience\b/i,
      /\b(\d+)\s*\+?\s*years?\b/i,
      /\bfresher\b/i,
      /\b0\s*years?\s*(?:experience|exp)?\b/i,
    ];

    let location = '';
    for (const keyword of locationKeywords) {
      if (lower.includes(keyword)) {
        location = keyword;
        break;
      }
    }

    let experience = '';
    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[0].toLowerCase();
        if (/fresher|0\s*years?/.test(value)) {
          experience = '0';
        } else {
          const digits = value.match(/(\d+)/);
          experience = digits ? digits[1] : '';
        }
        break;
      }
    }

    const withoutLocation = location
      ? text.replace(new RegExp(`\\b${location}\\b`, 'ig'), '')
      : text;
    const withoutExperience = experience
      ? withoutLocation.replace(new RegExp(`\\b${experience}\\b`, 'ig'), '').replace(/\b(?:years?|yrs?|year|exp|experience)\b/ig, '')
      : withoutLocation;

    const cleaned = withoutExperience
      .replace(/\b(?:find|show|search|give|list|get|need|help me with|help me|please|can you|can u|for|about|in|at|near|around|related to)\b/gi, ' ')
      .replace(/\b(?:job|jobs|role|roles|position|positions|opportunities?|opening|openings)\b/gi, ' ')
      .replace(/[^a-zA-Z0-9\s\-/&.,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const query = normalizeJobQuery(cleaned || withoutExperience);

    return { query, location, experience };
  };

  const detectAssistantAction = (text) => {
    const lower = text.toLowerCase();

    if (/(^|\s)(home|jobs page|open jobs|show jobs|job listing|browse jobs)(\s|$)/.test(lower)) {
      return { kind: 'navigate', tab: 'jobs' };
    }

    if (/(resume|ats|cv|resume review|upload resume|check my resume|resume checker)/.test(lower)) {
      return { kind: 'openAts' };
    }

    if (/(interview|prepzo|prep zo|mock interview|system design|hr round|dsa|behavioural|behavioral|interview prep)/.test(lower)) {
      return { kind: 'navigate', tab: 'interview-prep' };
    }

    if (/(mentor|book.*mentor|proconnect|career guidance|talk to mentor|mentor session|book a session)/.test(lower)) {
      return { kind: 'navigate', tab: 'pro-connect' };
    }

    if (/(practice|coding|dsa|python|java|sql|javascript|aptitude|leetcode|hackerrank|problem practice)/.test(lower)) {
      return { kind: 'navigate', tab: 'practice-hub' };
    }

    if (/(jobs?|roles?|placements?|internship|fresher|developer|engineer|analyst|data|software|java|python|frontend|backend|full stack|qa|devops)/.test(lower)) {
      const intent = extractJobSearchIntent(text);
      const query = intent.query;

      if (query && !/^(hi|hello|hey|thanks|thank you|help|what can you do|what can you help with)$/i.test(query)) {
        return { kind: 'searchJobs', ...intent };
      }

      return { kind: 'navigate', tab: 'jobs' };
    }

    return null;
  };

  const sendMessage = async (userText) => {
    const trimmed = userText.trim();
    if (!trimmed || isTyping) return;

    const newUserMsg = { role: 'user', text: trimmed };
    const action = detectAssistantAction(trimmed);

    if (action) {
      irrelevantStreakRef.current = 0;
      setShowQuickReplies(false);
    } else {
      irrelevantStreakRef.current += 1;
      if (irrelevantStreakRef.current >= 2) {
        setShowQuickReplies(true);
      }
    }

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setShowQuickMenu(false);
    setIsTyping(true);

    if (action) {
      const jobQueryText = action.kind === 'searchJobs' ? normalizeJobQuery(action.query) : '';
      const actionText = action.kind === 'searchJobs'
        ? `I’ll search for ${jobQueryText || 'jobs'}${action.location ? ` in ${action.location}` : ''} and open the results for you.`
        : action.kind === 'openAts'
          ? 'I’ll open the ATS checker for you.'
          : action.kind === 'navigate' && action.tab === 'jobs'
            ? 'I’ll take you to the jobs section.'
            : action.kind === 'navigate' && action.tab === 'pro-connect'
              ? 'I’ll open ProConnect for you.'
              : action.kind === 'navigate' && action.tab === 'interview-prep'
                ? 'I’ll open the interview prep flow for you.'
                : action.kind === 'navigate' && action.tab === 'practice-hub'
                  ? 'I’ll open PracticeHub for you.'
                  : 'I’ll open that section for you.';

      setMessages(prev => [...prev, {
        role: 'bot',
        text: actionText,
        navAction: action.kind === 'navigate' ? action.tab : null,
      }]);

      if (action.kind === 'openAts') {
        onOpenAts?.();
      } else if (action.kind === 'navigate') {
        setTimeout(() => onNavigate?.(action.tab), 120);
      } else if (action.kind === 'searchJobs') {
        setTimeout(() => onAssistantQuery?.({
          kind: 'jobs',
          query: action.query,
          location: action.location,
          experience: action.experience,
        }), 120);
      }

      setIsTyping(false);
      return;
    }

    // Update conversation history for multi-turn context
    conversationHistory.current.push({
      role: 'user',
      parts: [{ text: trimmed }]
    });

    try {
      const requestBody = USE_OPENROUTER
        ? {
            model: 'openai/gpt-oss-20b',
            messages: [
              { role: 'system', content: SITE_CONTEXT },
              ...conversationHistory.current.map((entry) => ({
                role: entry.role === 'user' ? 'user' : 'assistant',
                content: (entry.parts || []).map((part) => part.text).join('\n') || ''
              }))
            ],
            temperature: 0.65,
            max_tokens: 350,
          }
        : {
            system_instruction: {
              parts: [{ text: SITE_CONTEXT }]
            },
            contents: conversationHistory.current,
            generationConfig: {
              maxOutputTokens: 350,
              temperature: 0.65,
            }
          };

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: USE_OPENROUTER
          ? {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${CHAT_API_KEY}`,
              'HTTP-Referer': 'http://localhost:5174',
              'X-Title': 'PlacementBabai',
            }
          : { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = USE_OPENROUTER
        ? (
            data?.choices?.[0]?.message?.content ||
            "I'm not sure about that. Could you rephrase, or try asking about jobs, mentors, interview prep, or resume review?"
          )
        : (
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I'm not sure about that. Could you rephrase, or try asking about jobs, mentors, interview prep, or resume review?"
          );

      const parsed = parseResponse(rawText);

      // Add bot response to history
      conversationHistory.current.push({
        role: 'model',
        parts: [{ text: rawText }]
      });

      // Keep history bounded (last 10 turns = 20 entries)
      if (conversationHistory.current.length > 20) {
        conversationHistory.current = conversationHistory.current.slice(-20);
      }

      setMessages(prev => [...prev, { role: 'bot', ...parsed }]);
    } catch (err) {
      console.error('ChatBot error:', err);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "Hmm, I'm having trouble connecting right now. Please try again in a moment! 🙏",
        navAction: null,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNavigate = (action) => {
    if (action === 'resumeReview') {
      onOpenAts();
    } else {
      const nav = NAV_ACTIONS[action];
      if (nav) onNavigate(nav.tab);
    }
    setIsOpen(false);
  };

  const renderText = (text) => {
    // Render **bold** and newlines
    return text.split('\n').map((line, lineIdx) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={lineIdx}>
          {parts.map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
          {lineIdx < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  const renderMessage = (msg, i) => {
    const isBot = msg.role === 'bot';

    return (
      <div
        key={i}
        className={`chat-msg ${isBot ? 'chat-msg--bot' : 'chat-msg--user'}`}
        style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
      >
        {isBot && (
          <div className="chat-msg-avatar" aria-hidden="true">
            <BabaiMascotImage size={20} />
          </div>
        )}
        <div className="chat-msg-body">
          <div className="chat-bubble-wrap">
            <p className="chat-bubble-text">{renderText(msg.text)}</p>
          </div>
          {isBot && msg.navAction && NAV_ACTIONS[msg.navAction] && (
            <button
              className="chat-nav-btn"
              onClick={() => handleNavigate(msg.navAction)}
              aria-label={`Navigate to ${NAV_ACTIONS[msg.navAction].label}`}
            >
              <span>{NAV_ACTIONS[msg.navAction].label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'chatbot-window--open' : ''}`} role="dialog" aria-label="AI Babai chat assistant">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-left">
            <div className="chatbot-header-avatar" aria-hidden="true">
              <BabaiMascotImage size={26} />
            </div>
            <div className="chatbot-header-info">
              <div className="chatbot-header-name">AI Babai</div>
              <div className="chatbot-header-status">
                <span className="chatbot-status-dot" aria-hidden="true"></span>
                <span>AI Guide · Always here</span>
              </div>
            </div>
          </div>
          <button
            className="chatbot-close-btn"
            onClick={toggleChat}
            aria-label="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="chatbot-messages" role="log" aria-live="polite">
          {messages.map((msg, i) => renderMessage(msg, i))}

          {/* Quick Replies (shown only at start) */}
          {showQuickReplies && !isTyping && (messages.length <= 1 || irrelevantStreakRef.current >= 2) && (
            <div className="chat-quick-replies">
              <p className="chat-quick-label">Quick questions:</p>
              <div className="chat-quick-grid">
                {QUICK_REPLIES.map((q, i) => (
                  <button
                    key={i}
                    className="chat-quick-chip"
                    onClick={() => {
                      irrelevantStreakRef.current = 0;
                      setShowQuickReplies(false);
                      sendMessage(q.label);
                    }}
                  >
                    <span>{q.icon}</span>
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="chat-msg chat-msg--bot chat-msg--typing">
              <div className="chat-msg-avatar" aria-hidden="true">
                <BabaiMascotImage size={18} />
              </div>
              <div className="chat-msg-body">
                <div className="chat-bubble-wrap chat-bubble--typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chatbot-input-area">
          <div className="chatbot-input-wrapper" ref={menuRef}>
            <input
              ref={inputRef}
              id="chatbot-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask anything about Placement Babai..."
              className="chatbot-input"
              disabled={isTyping}
              maxLength={300}
              aria-label="Type your message"
              autoComplete="off"
            />
            <button
              type="button"
              className={`chatbot-menu-btn ${showQuickMenu ? 'chatbot-menu-btn--open' : ''}`}
              onClick={() => setShowQuickMenu(prev => !prev)}
              aria-label="Quick questions menu"
              aria-expanded={showQuickMenu}
              aria-haspopup="menu"
              disabled={isTyping}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16"/>
              </svg>
            </button>
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage(input)}
              disabled={isTyping || !input.trim()}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showQuickMenu && (
              <div className="chatbot-quick-menu" role="menu" aria-label="Quick questions">
                <p className="chatbot-quick-menu-label">Quick questions</p>
                {QUICK_REPLIES.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    className="chatbot-quick-menu-item"
                    role="menuitem"
                    onClick={() => {
                      irrelevantStreakRef.current = 0;
                      setShowQuickReplies(false);
                      sendMessage(q.label);
                    }}
                  >
                    <span>{q.icon}</span>
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="chatbot-powered-by">Powered by PlacementBabai</p>
        </div>
      </div>

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          id="chatbot-toggle"
          className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
          onClick={toggleChat}
          aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
          aria-expanded={isOpen}
        >
          <span className="chatbot-fab-icon chatbot-fab-icon--chat" aria-hidden="true">
            <BabaiMascotImage size={22} />
          </span>
          <span className="chatbot-fab-icon chatbot-fab-icon--close" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </span>
          {!isOpen && (
            <span className="chatbot-fab-label">Ask AI Babai</span>
          )}
          {!isOpen && (
            <span className="chatbot-notif-pulse" aria-hidden="true"></span>
          )}
        </button>
      )}
    </>
  );
}

export default ChatBot;
