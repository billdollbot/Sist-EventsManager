/**
 * SDC Club Events Hub — App.jsx v5
 * Students: public (no login needed)
 * Faculty/Admin: login required
 * NEW: Sidebar navigation + Light/Dark theme toggle
 */
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import axios from "axios";
import "./App.css";
import {
  Search, X, Zap, LogOut, BookOpen, Shield,
  CalendarDays, MapPin, RefreshCw, Menu,
  Sun, Moon, Home, PlusCircle, ClipboardList,
  Users, Settings, User,
} from "lucide-react";

import LoginPage from "./pages/LoginPage";
import AdminConsole from "./pages/AdminConsole";
import FacultyDashboard from "./pages/FacultyDashboard";
import EventCard from "./components/EventCard";
import ToastStack from "./components/Toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CATEGORIES = ["All", "Technical", "Cultural", "Workshop", "Sports", "Seminar", "Hackathon", "Other"];
const EMOJI = { Technical: "⚙️", Cultural: "🎭", Workshop: "🛠️", Sports: "🏆", Seminar: "📚", Hackathon: "💻", Other: "✨" };

const fmtDateShort = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/* ── Theme Context ─────────────────────────────── */
const ThemeContext = createContext();
export function useTheme() { return useContext(ThemeContext); }

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("sist_theme") || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sist_theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ── Toast hook ─────────────────────────────────── */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

/* ── Announcement Ticker ────────────────────────── */
function Ticker({ events }) {
  if (!events.length) return null;
  const items = [...events, ...events];
  return (
    <div className="ticker-bar" role="marquee" aria-label="Upcoming events ticker">
      <div className="ticker-label">
        <Zap size={10} /> Upcoming
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div className="ticker-track">
          {items.map((ev, i) => (
            <span key={`${ev._id}-${i}`} className="ticker-item">
              <span className="ticker-dot" />
              <strong>{ev.title}</strong>
              <span>·</span>
              <span>{ev.club}</span>
              <span>·</span>
              <span>{fmtDateShort(ev.event_date)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Card ──────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton" style={{ height: 140 }} />
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
        <div className="skeleton" style={{ height: 13, width: "30%" }} />
        <div className="skeleton" style={{ height: 17, width: "85%" }} />
        <div className="skeleton" style={{ height: 12, width: "60%" }} />
        <div className="skeleton" style={{ height: 12, width: "50%" }} />
      </div>
    </div>
  );
}

/* ── Sidebar ───────────────────────────────────── */
function Sidebar({ open, onClose, session, onLogout, onLoginClick, activeView, onNav }) {
  const { theme, toggle } = useTheme();

  const handleNav = (view) => {
    onNav(view);
    onClose();
  };

  return (
    <>
      <div className={`sidebar-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="topbar-logo">
            <span className="logo-dot" />
            <div className="logo-text">
              <span className="logo-main">SDC<span> Events</span></span>
              <span className="logo-sub">Hub</span>
            </div>
          </div>
          <button className="sidebar-close tap" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {session?.role !== "admin" && (
            <button
              className={`sidebar-link ${activeView === "events" ? "active" : ""}`}
              onClick={() => handleNav("events")}
            >
              <Home size={18} /> Events
            </button>
          )}

          {session?.role === "faculty" && (
            <>
              <button
                className={`sidebar-link ${activeView === "create" ? "active" : ""}`}
                onClick={() => handleNav("create")}
              >
                <PlusCircle size={18} /> Create Event
              </button>
              <button
                className={`sidebar-link ${activeView === "submissions" ? "active" : ""}`}
                onClick={() => handleNav("submissions")}
              >
                <ClipboardList size={18} /> My Submissions
              </button>
            </>
          )}

          {session?.role === "admin" && (
            <>
              <button
                className={`sidebar-link ${activeView === "admin-events" || activeView === "events" ? "active" : ""}`}
                onClick={() => handleNav("admin-events")}
              >
                <CalendarDays size={18} /> Manage Events
              </button>
              <button
                className={`sidebar-link ${activeView === "admin-faculty" ? "active" : ""}`}
                onClick={() => handleNav("admin-faculty")}
              >
                <Users size={18} /> Faculty
              </button>
            </>
          )}

          <div className="sidebar-divider" />

          {/* Theme toggle in sidebar */}
          <button className="sidebar-link" onClick={toggle}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {!session && (
            <button className="sidebar-link" onClick={() => { onLoginClick(); onClose(); }}>
              <BookOpen size={18} /> Faculty Login
            </button>
          )}
        </nav>

        {/* Footer — user info */}
        {session && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {session.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{session.name}</div>
                <div className="sidebar-user-role">{session.role}</div>
              </div>
              <button className="sidebar-logout tap" onClick={onLogout} title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

/* ── Top Bar ───────────────────────────────────── */
function TopBar({ onMenuClick, session, onLogout, onLoginClick }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger tap" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="topbar-logo">
          <span className="logo-dot" />
          <div className="logo-text">
            <span className="logo-main">SDC<span> Events</span></span>
            <span className="logo-sub">Hub</span>
          </div>
        </div>
      </div>
      <div className="topbar-right">
        {/* Theme Toggle */}
        <button className="theme-toggle tap" onClick={toggle} aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {session ? (
          <button
            className="btn btn-ghost btn-icon btn-sm tap"
            onClick={onLogout}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        ) : (
          <button className="btn btn-secondary btn-sm tap" onClick={onLoginClick}>
            <BookOpen size={14} /> Login
          </button>
        )}
      </div>
    </header>
  );
}

/* ── Public Student Feed ────────────────────────── */
function PublicFeed({ showToast }) {
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, upRes] = await Promise.all([
        axios.get(`${API}/api/events`),
        axios.get(`${API}/api/events/upcoming`),
      ]);
      setEvents(evRes.data);
      setUpcoming(upRes.data);
    } catch {
      showToast("Couldn't load events.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = events.filter(e => {
    const isUpcoming = new Date(e.event_date) >= today;
    if (!isUpcoming) return false;
    const mc = category === "All" || e.category === category;
    const q = search.toLowerCase();
    return mc && (!q
      || e.title.toLowerCase().includes(q)
      || e.club?.toLowerCase().includes(q)
      || e.organizer?.toLowerCase().includes(q)
      || e.location.toLowerCase().includes(q));
  });

  return (
    <div className="page">
      {/* Ticker */}
      <Ticker events={upcoming} />

      {/* Hero */}
      <section className="hero container">
        <div className="hero-eyebrow animate-in">
          <Zap size={11} /> Sathyabama Institute of Science &amp; Technology
        </div>
        <h1 className="hero-title animate-in" style={{ animationDelay: "0.08s" }}>
          SDC<br />Events Hub
        </h1>
        <p className="hero-sub animate-in" style={{ animationDelay: "0.14s" }}>
          📍Everything happening at <strong>Sathyabama</strong>, in one place
        </p>
        <div className="hero-cta animate-in" style={{ animationDelay: "0.18s" }}>
          <button className="btn btn-ghost btn-lg tap" onClick={fetchAll}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </section>

      {/* Main content */}
      <main className="container" style={{ paddingBottom: 48 }}>
        {/* Search */}
        <div className="search-wrapper">
          <span className="search-icon-wrap"><Search size={17} /></span>
          <input
            className="search-input"
            placeholder="Search events, clubs, venues…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="btn btn-ghost btn-icon search-clear tap"
              style={{ minHeight: 36, width: 36 }}
              onClick={() => setSearch("")}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="filter-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`chip tap ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}>
              {cat !== "All" && `${EMOJI[cat]} `}{cat}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div className="section-head">
          <h2 className="section-title">
            {category === "All" ? "All Events" : `${EMOJI[category]} ${category}`}
          </h2>
          {!loading && (
            <span className="text-muted text-sm">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="events-grid">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{search ? "🔍" : "📅"}</div>
            <p className="empty-title">
              {search ? "No results found" : "No events yet"}
            </p>
            <p className="empty-sub">
              {search ? "Try a different search term" : "Events will appear here once approved."}
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {filtered.map(ev => <EventCard key={ev._id} event={ev} showToast={showToast} />)}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Login Modal wrapper ────────────────────────── */
function LoginModal({ onClose, onLogin }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div
        style={{ width: "100%", maxWidth: 440, zIndex: 201 }}
        onClick={e => e.stopPropagation()}>
        <LoginPage onLogin={onLogin} onClose={onClose} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════ */
function AppContent() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sist_session") || "null"); }
    catch { return null; }
  });
  const [showLogin, setShowLogin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    try {
      const sess = JSON.parse(localStorage.getItem("sist_session") || "null");
      return sess?.role === "admin" ? "admin-events" : "events";
    } catch { return "events"; }
  });
  const { toasts, show: showToast } = useToast();

  const handleLogin = sess => {
    setSession(sess);
    setShowLogin(false);
    setActiveView(sess.role === "admin" ? "admin-events" : "events");
    showToast(`Welcome, ${sess.name}! 👋`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("sist_session");
    setSession(null);
    setActiveView("events");
    setSidebarOpen(false);
    showToast("Signed out.", "info");
  };

  const handleNav = (view) => {
    setActiveView(view);
  };

  // Determine what to render based on session + activeView
  const renderContent = () => {
    if (!session || session.role === "student") {
      return <PublicFeed showToast={showToast} />;
    }
    if (session.role === "admin") {
      return <AdminConsole session={session} activeView={activeView} onNav={setActiveView} />;
    }
    // Faculty
    return <FacultyDashboard session={session} showToast={showToast} activeView={activeView} onNav={setActiveView} />;
  };

  return (
    <>
      {/* Background */}
      <div className="bg-scene">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Toast notifications */}
      <ToastStack toasts={toasts} />

      {/* Login modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        session={session}
        onLogout={handleLogout}
        onLoginClick={() => setShowLogin(true)}
        activeView={activeView}
        onNav={handleNav}
      />

      {/* Top Bar */}
      <TopBar
        onMenuClick={() => setSidebarOpen(true)}
        session={session}
        onLogout={handleLogout}
        onLoginClick={() => setShowLogin(true)}
      />

      {/* Main Content */}
      <div className="main-content">
        {renderContent()}

        <footer className="footer">
          <p>
            SDC <strong style={{ color: "var(--accent)" }}>Events Hub</strong>
            {" "}· Sathyabama Institute of Science and Technology
          </p>
          <p style={{ marginTop: 3, fontSize: "0.7rem" }}>All campus events, one place. Made by Void Technologies</p>
        </footer>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}