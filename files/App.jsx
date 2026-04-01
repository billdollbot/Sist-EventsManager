/**
 * SIST-EVENTS — App.jsx
 * Main application: Events Feed, Guest Login, Routing, Toast system.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "./App.css";

// Lucide icons
import {
  CalendarDays,
  MapPin,
  User,
  Link2,
  Plus,
  Shield,
  LogOut,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  CheckCircle,
  X,
  Zap,
} from "lucide-react";

// Feature components (lazy-loaded via dynamic import to show splitting pattern)
import HostEvent from "./HostEvent";
import TeacherDashboard from "./TeacherDashboard";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const CATEGORIES = ["All", "Technical", "Cultural", "Workshop", "Sports", "Seminar", "Hackathon", "Other"];

const CATEGORY_COLOR = {
  Technical: "badge-technical",
  Cultural: "badge-cultural",
  Workshop: "badge-workshop",
  Sports: "badge-sports",
  Seminar: "badge-seminar",
  Hackathon: "badge-hackathon",
  Other: "badge-other",
};

const CATEGORY_EMOJI = {
  Technical: "⚙️", Cultural: "🎭", Workshop: "🛠️",
  Sports: "🏆", Seminar: "📚", Hackathon: "💻", Other: "✨",
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

const isUpcoming = (d) => new Date(d) >= new Date();

/* ─────────────────────────────────────────────
   TOAST HOOK
───────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

/* ─────────────────────────────────────────────
   GUEST LOGIN MODAL
───────────────────────────────────────────── */
function GuestLoginModal({ onClose, onLogin }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    const n = name.trim();
    if (n.length < 2) { setErr("Name must be at least 2 characters."); return; }
    localStorage.setItem("sist_guest_name", n);
    localStorage.setItem("sist_guest_id", `guest_${Date.now()}`);
    onLogin(n);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily: "var(--ff-display)" }}>
            Quick Sign In
          </h2>
          <button className="btn btn-ghost btn-icon touch-shrink" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p className="text-muted text-sm">
            Enter your name to host events or register for them. No password needed!
          </p>
          {err && (
            <p className="form-error"><X size={12} /> {err}</p>
          )}
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input
              className="form-input"
              placeholder="e.g. Arjun Krishnamurthy"
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />
          </div>
          <button className="btn btn-primary btn-lg touch-shrink" style={{ width: "100%" }} onClick={submit}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EVENT CARD
───────────────────────────────────────────── */
function EventCard({ event }) {
  const upcoming = isUpcoming(event.event_date);

  return (
    <article className="card card-enter touch-shrink" style={{ cursor: "default" }}>
      {/* Brochure image */}
      {event.brochure_path ? (
        <img
          className="card-brochure"
          src={`${API}${event.brochure_path}`}
          alt={`${event.title} poster`}
          loading="lazy"
        />
      ) : (
        <div className="card-brochure-placeholder">
          {CATEGORY_EMOJI[event.category] || "📅"}
        </div>
      )}

      <div className="card-body">
        {/* Badges */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <span className={`badge ${CATEGORY_COLOR[event.category] || "badge-other"}`}>
            {event.category}
          </span>
          {upcoming && (
            <span className="badge badge-approved">
              <Zap size={9} /> Upcoming
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: "1.08rem",
            fontWeight: 700,
            marginBottom: 10,
            lineHeight: 1.25,
          }}
        >
          {event.title}
        </h3>

        {/* Meta info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="text-xs text-muted" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <User size={11} />
            {event.organizer}
          </span>
          <span className="text-xs text-muted" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <CalendarDays size={11} />
            {fmtDate(event.event_date)} · {fmtTime(event.event_date)}
          </span>
          <span className="text-xs text-muted" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin size={11} />
            {event.location}
          </span>
        </div>

        {/* Description excerpt */}
        {event.description && (
          <p
            style={{
              fontSize: "0.83rem",
              color: "var(--c-muted)",
              marginTop: 10,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.description}
          </p>
        )}
      </div>

      {/* Card footer */}
      {event.registration_link && (
        <div className="card-footer">
          <a
            href={event.registration_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm touch-shrink"
            style={{ width: "100%" }}
          >
            Register Now <ExternalLink size={13} />
          </a>
        </div>
      )}
    </article>
  );
}

/* ─────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton" style={{ height: 160 }} />
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="skeleton" style={{ height: 18, width: "35%" }} />
        <div className="skeleton" style={{ height: 22, width: "80%" }} />
        <div className="skeleton" style={{ height: 14, width: "55%" }} />
        <div className="skeleton" style={{ height: 14, width: "60%" }} />
        <div className="skeleton" style={{ height: 14, width: "45%" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────── */
function Navbar({ guestName, view, setView, onGuestLogin, onGuestLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <button
          className="nav-logo touch-shrink"
          style={{ background: "none", border: "none", cursor: "pointer" }}
          onClick={() => setView("feed")}
        >
          <span className="logo-dot" />
          SIST<span style={{ color: "var(--c-amber)" }}>EVENTS</span>
        </button>

        {/* Actions */}
        <div className="nav-actions">
          {guestName ? (
            <>
              <span
                className="text-xs text-muted hide-xs"
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <CheckCircle size={13} color="var(--c-teal)" />
                {guestName}
              </span>
              <button
                className="btn btn-ghost btn-icon btn-sm touch-shrink"
                onClick={onGuestLogout}
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              className="btn btn-ghost btn-sm touch-shrink"
              onClick={onGuestLogin}
            >
              <User size={15} /> Sign In
            </button>
          )}

          <button
            className={`btn btn-sm touch-shrink ${view === "admin" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setView(view === "admin" ? "feed" : "admin")}
          >
            <Shield size={15} />
            <span className="hide-xs">Faculty</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   EVENTS FEED PAGE
───────────────────────────────────────────── */
function EventsFeed({ guestName, onRequestLogin, showToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showHost, setShowHost] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/events`);
      setEvents(res.data);
    } catch {
      showToast("Couldn't load events. Please retry.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Filtering
  const filtered = events.filter((e) => {
    const matchCat = category === "All" || e.category === category;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleHostClick = () => {
    if (!guestName) { onRequestLogin(); return; }
    setShowHost(true);
  };

  return (
    <>
      {/* HostEvent modal */}
      {showHost && (
        <HostEvent
          onClose={() => setShowHost(false)}
          guestName={guestName}
          onSuccess={() => {
            showToast("Event submitted for review! 🎉", "success");
            fetchEvents();
          }}
        />
      )}

      {/* HERO */}
      <section className="hero container">
        <div
          className="hero-eyebrow animate-fade-in"
          style={{ animationDelay: "0.05s" }}
        >
          <Zap size={12} /> Sathyabama University
        </div>
        <h1
          className="hero-title animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          Campus Events
          <br />
          Hub
        </h1>
        <p
          className="hero-sub animate-fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          Discover workshops, fests, hackathons and more — all in one place.
        </p>
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            animationDelay: "0.2s",
          }}
        >
          <button
            className="btn btn-primary btn-lg touch-shrink"
            onClick={handleHostClick}
          >
            <Plus size={18} /> Host an Event
          </button>
          <button
            className="btn btn-secondary btn-lg touch-shrink"
            onClick={fetchEvents}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="container" style={{ paddingBottom: 60 }}>
        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search
            size={17}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--c-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            className="form-input"
            style={{ paddingLeft: 44 }}
            placeholder="Search events, clubs, venues…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="btn btn-ghost btn-icon"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                padding: "6px",
              }}
              onClick={() => setSearch("")}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category filter chips */}
        <div className="filter-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`chip touch-shrink ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat !== "All" && `${CATEGORY_EMOJI[cat]} `}{cat}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <h2 className="section-title">
              {category === "All" ? "All Events" : `${CATEGORY_EMOJI[category]} ${category}`}
            </h2>
            {!loading && (
              <span className="text-muted text-sm">
                {filtered.length} event{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="events-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {search ? "🔍" : events.length === 0 ? "📅" : "😶"}
            </div>
            <p className="empty-title">
              {search
                ? "No results found"
                : events.length === 0
                ? "No events yet"
                : "No events in this category"}
            </p>
            <p className="empty-sub" style={{ marginBottom: 24 }}>
              {search
                ? `Try a different search term`
                : "Be the first to host one!"}
            </p>
            {!search && (
              <button
                className="btn btn-primary touch-shrink"
                onClick={handleHostClick}
              >
                <Plus size={16} /> Host an Event
              </button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {filtered.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function App() {
  // Restore guest session from localStorage
  const [guestName, setGuestName] = useState(
    () => localStorage.getItem("sist_guest_name") || null
  );
  const [view, setView] = useState("feed"); // "feed" | "admin"
  const [showGuestModal, setShowGuestModal] = useState(false);
  const { toasts, show: showToast } = useToast();

  const handleGuestLogout = () => {
    localStorage.removeItem("sist_guest_name");
    localStorage.removeItem("sist_guest_id");
    setGuestName(null);
    showToast("Signed out.", "info");
  };

  return (
    <>
      {/* Animated background mesh */}
      <div className="mesh-bg" />

      {/* Toast stack */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" && <CheckCircle size={15} />}
            {t.type === "error" && <X size={15} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Guest login modal */}
      {showGuestModal && (
        <GuestLoginModal
          onClose={() => setShowGuestModal(false)}
          onLogin={(name) => {
            setGuestName(name);
            showToast(`Welcome, ${name}! 👋`, "success");
          }}
        />
      )}

      {/* Navbar — always visible */}
      <Navbar
        guestName={guestName}
        view={view}
        setView={setView}
        onGuestLogin={() => setShowGuestModal(true)}
        onGuestLogout={handleGuestLogout}
      />

      {/* Page body */}
      {view === "admin" ? (
        <TeacherDashboard onLogout={() => setView("feed")} />
      ) : (
        <EventsFeed
          guestName={guestName}
          onRequestLogin={() => setShowGuestModal(true)}
          showToast={showToast}
        />
      )}

      {/* Footer */}
      <footer className="footer">
        <p>
          SIST<strong style={{ color: "var(--c-amber)" }}>EVENTS</strong> ·
          Sathyabama Institute of Science and Technology
        </p>
        <p style={{ marginTop: 4, fontSize: "0.74rem" }}>
          Crafted for students, by students ✦
        </p>
      </footer>
    </>
  );
}
