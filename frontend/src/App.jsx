/**
 * SDC Club Events Hub — App.jsx v4
 * Students: public (no login needed)
 * Faculty/Admin: login required
 * Removed: FeaturedScroll horizontal section
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";
import {
  Search, X, Zap, LogOut, BookOpen, Shield,
  CalendarDays, MapPin, RefreshCw,
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
const fmtTime = d => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

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
  const items = [...events, ...events]; // duplicate for seamless loop
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

/* ── Navbar ─────────────────────────────────────── */
function Navbar({ session, onLogout, onLoginClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="nav-logo">
          <span className="nav-logo-dot" />
          <div className="nav-brand-text">
            <span className="nav-brand-main">
              SDC<span style={{ color: "var(--amber-500)" }}> Club</span>
            </span>
            <span className="nav-brand-sub">Events Hub</span>
          </div>
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {session ? (
            <>
              <div className="nav-user-pill hide-xs">
                {session.role === "faculty" ? <BookOpen size={12} /> : <Shield size={12} />}
                <span>{session.name}</span>
                <span style={{ fontSize: "0.62rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  · {session.role}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-icon btn-sm tap"
                onClick={onLogout}
                title="Sign out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button className="btn btn-secondary btn-sm tap" onClick={onLoginClick}>
              <BookOpen size={14} /> Faculty Login
            </button>
          )}
        </div>
      </div>
    </nav>
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

  const filtered = events.filter(e => {
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

      {/* Ticker — scrolling announcement bar */}
      <Ticker events={upcoming} />

      {/* Hero */}
      <section className="hero container">
        <div className="hero-eyebrow animate-in">
          <Zap size={11} /> Sathyabama Institute of Science &amp; Technology
        </div>
        <h1 className="hero-title animate-in" style={{ animationDelay: "0.08s" }}>
          SDC Club<br />Events Hub
        </h1>
        <p className="hero-sub animate-in" style={{ animationDelay: "0.14s" }}>
          All campus events — workshops, hackathons, fests and more — in one place.
        </p>
        <div className="hero-cta animate-in nav-desktop-only" style={{ animationDelay: "0.18s" }}>
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
            {filtered.map(ev => <EventCard key={ev._id} event={ev} />)}
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
export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sist_session") || "null"); }
    catch { return null; }
  });
  const [showLogin, setShowLogin] = useState(false);
  const { toasts, show: showToast } = useToast();

  const handleLogin = sess => {
    setSession(sess);
    setShowLogin(false);
    showToast(`Welcome, ${sess.name}! 👋`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("sist_session");
    setSession(null);
    showToast("Signed out.", "info");
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

      {/* Faculty / Admin login modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      )}

      {/* Top navbar — always visible */}
      <Navbar
        session={session}
        onLogout={handleLogout}
        onLoginClick={() => setShowLogin(true)}
      />

      {/* Route by role */}
      {!session || session.role === "student" ? (
        <PublicFeed showToast={showToast} />
      ) : session.role === "admin" ? (
        <AdminConsole session={session} />
      ) : (
        <FacultyDashboard session={session} showToast={showToast} />
      )}

      <footer className="footer">
        <p>
          SDC <strong style={{ color: "var(--amber-500)" }}>Club Events Hub</strong>
          {" "}· Sathyabama Institute of Science and Technology
        </p>
        <p style={{ marginTop: 3, fontSize: "0.7rem" }}>All campus events, one place. Made by Void Technologies</p>
      </footer>
    </>
  );
}