/**
 * SDC Club Events Hub — App.jsx v4
 * Students: public (no login needed)
 * Faculty/Admin: login required
 * Removed: FeaturedScroll horizontal section
 */
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "./App.css";
import {
  Search, X, Zap, LogOut, BookOpen, Shield,
  CalendarDays, MapPin, RefreshCw, Filter, ChevronDown,
  ChevronLeft, ChevronRight, Sun, Moon, Monitor, Palette,
} from "lucide-react";

import LoginPage from "./pages/LoginPage";
import AdminConsole from "./pages/AdminConsole";
import FacultyDashboard from "./pages/FacultyDashboard";
import EventCard from "./components/EventCard";
import ToastStack from "./components/Toast";
import ThemeProvider, { useTheme, ACCENTS } from "./components/ThemeProvider";

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

/* ── Nav Theme Picker ───────────────────────────── */
function NavThemePicker() {
  const { accent, setAccent, mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [open]);

  const ModeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  const nextMode = mode === "dark" ? "light" : mode === "light" ? "system" : "dark";

  return (
    <div className="ntp-wrap" ref={ref}>
      {/* Desktop: all 8 dots inline */}
      <div className="ntp-dots">
        {ACCENTS.map(a => (
          <button key={a.id} className="ntp-dot" onClick={() => setAccent(a.id)} title={a.label}
            style={{
              background: a.hex, outline: accent === a.id ? `2px solid ${a.hex}` : "2px solid transparent",
              outlineOffset: 2, transform: accent === a.id ? "scale(1.2)" : "scale(1)"
            }} />
        ))}
      </div>
      {/* Mobile: palette icon opens popup */}
      <button className="ntp-palette-btn tap" onClick={() => setOpen(o => !o)} title="Theme colors" aria-expanded={open}>
        <Palette size={17} />
      </button>
      {/* Mode toggle (always visible) */}
      <button className="ntp-mode-btn tap" onClick={() => setMode(nextMode)} title={`Mode: ${mode} → ${nextMode}`}>
        <ModeIcon size={16} />
      </button>
      {/* Mobile popup */}
      {open && (
        <div className="ntp-popup">
          <p className="ntp-popup-label">Color Palette</p>
          <div className="ntp-popup-dots">
            {ACCENTS.map(a => (
              <button key={a.id} className="ntp-dot ntp-dot-lg" onClick={() => setAccent(a.id)} title={a.label}
                style={{ background: a.hex, outline: accent === a.id ? `2px solid ${a.hex}` : "2px solid transparent", outlineOffset: 2 }} />
            ))}
          </div>
          <p className="ntp-popup-label" style={{ marginTop: 12 }}>Mode</p>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ id: "light", icon: Sun, label: "Light" }, { id: "dark", icon: Moon, label: "Dark" }, { id: "system", icon: Monitor, label: "System" }].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setMode(id)} className={`ntp-mode-opt${mode === id ? " active" : ""}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────── */
function Navbar({ session, onLogout, onLoginClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="nav-logo">
          <span className="nav-logo-dot" />
          <div className="nav-brand-text">
            <span className="nav-brand-main">SDC<span style={{ color: "var(--amber-500)" }}> Club</span></span>
            <span className="nav-brand-sub">Events Hub</span>
          </div>
        </div>

        {/* Centre: theme picker */}
        <NavThemePicker />

        {/* Right: auth */}
        <div className="nav-actions">
          {session ? (
            <>
              <div className="nav-user-pill hide-xs">
                {session.role === "faculty" ? <BookOpen size={12} /> : <Shield size={12} />}
                <span>{session.name}</span>
                <span style={{ fontSize: "0.62rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.04em" }}>· {session.role}</span>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm tap" onClick={onLogout} title="Sign out">
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
const PER_PAGE = 15;

function PublicFeed({ showToast }) {
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [within5Days, setWithin5Days] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, upRes] = await Promise.all([
        axios.get(`${API}/api/events`),
        axios.get(`${API}/api/events/upcoming`),
      ]);
      // Filter out past events for students
      const now = new Date();
      const activeEvents = evRes.data.filter(e => new Date(e.event_date) >= now);
      setEvents(activeEvents);
      setUpcoming(upRes.data);
    } catch {
      showToast("Couldn't load events.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [category, search, within5Days]);

  const filtered = events.filter(e => {
    const mc = category === "All" || e.category === category;
    const q = search.toLowerCase();
    const matchesSearch = !q
      || e.title.toLowerCase().includes(q)
      || e.club?.toLowerCase().includes(q)
      || e.organizer?.toLowerCase().includes(q)
      || e.location.toLowerCase().includes(q);
    // Within 5 days filter
    let matchesTime = true;
    if (within5Days) {
      const evDate = new Date(e.event_date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 5);
      matchesTime = evDate <= cutoff;
    }
    return mc && matchesSearch && matchesTime;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="page">

      {/* Ticker — scrolling announcement bar */}
      <Ticker events={upcoming} />

      {/* Hero */}
      <section className="hero container">
        <div className="hero-eyebrow animate-in">
          <Zap size={11} /> Sathyabama Institute of Science &amp; Technology
        </div>
        <h1 className="hero-title animate-in" style={{ animationDelay: "0.08s", color: "var(--text-primary)", textShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
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

        {/* Filter toggle button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: filtersOpen ? 0 : 16 }}>
          <button
            className={`btn ${filtersOpen ? "btn-primary" : "btn-ghost"} tap`}
            onClick={() => setFiltersOpen(f => !f)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.84rem" }}>
            <Filter size={15} />
            Filters
            {(category !== "All" || within5Days) && (
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--accent)", flexShrink: 0,
              }} />
            )}
            <ChevronDown size={14} style={{
              transition: "transform 0.2s",
              transform: filtersOpen ? "rotate(180deg)" : "rotate(0)",
            }} />
          </button>
          {/* Active filter chips shown inline when panel is closed */}
          {!filtersOpen && category !== "All" && (
            <span className="chip active tap" onClick={() => setCategory("All")}
              style={{ fontSize: "0.76rem", padding: "4px 12px" }}>
              {EMOJI[category]} {category} <X size={11} />
            </span>
          )}
          {!filtersOpen && within5Days && (
            <span className="chip active tap" onClick={() => setWithin5Days(false)}
              style={{ fontSize: "0.76rem", padding: "4px 12px" }}>
              ⏰ Within 5 days <X size={11} />
            </span>
          )}
        </div>

        {/* Expandable filter panel */}
        {filtersOpen && (
          <div className="filter-bar" style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 16,
            animation: "fade-in 0.2s ease",
          }}>
            <p style={{ width: "100%", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Category</p>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`chip tap ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}>
                {cat !== "All" && `${EMOJI[cat]} `}{cat}
              </button>
            ))}
            <div style={{ width: "100%", height: 1, background: "var(--border-subtle)", margin: "10px 0" }} />
            <p style={{ width: "100%", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Time</p>
            <button
              className={`chip tap ${within5Days ? "active" : ""}`}
              onClick={() => setWithin5Days(w => !w)}>
              ⏰ Within 5 days
            </button>
          </div>
        )}

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
          <>
            <div className="events-grid">
              {paginated.map(ev => <EventCard key={ev._id} event={ev} />)}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, marginTop: 28, flexWrap: "wrap",
              }}>
                <button
                  className="btn btn-ghost btn-sm tap"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ minWidth: 40 }}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`btn btn-sm tap ${p === page ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setPage(p)}
                    style={{ minWidth: 40 }}>
                    {p}
                  </button>
                ))}
                <button
                  className="btn btn-ghost btn-sm tap"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ minWidth: 40 }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
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
    <ThemeProvider>
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
        <AdminConsole session={session} onLogout={handleLogout} />
      ) : (
        <FacultyDashboard session={session} showToast={showToast} />
      )}

      <footer className="footer">
        <p>
          SDC <strong style={{ color: "var(--amber-500)" }}>Club Events Hub</strong>
          {" "}· Sathyabama Institute of Science and Technology
        </p>
        <p style={{ marginTop: 3, fontSize: "0.7rem" }}>All campus events, one place ✦</p>
      </footer>

    </ThemeProvider>

  );
}