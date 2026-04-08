import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { Plus, Search, X, Zap, ChevronRight, RefreshCw } from "lucide-react";
import HostEvent        from "./HostEvent";
import TeacherDashboard from "./TeacherDashboard";
import EventCard        from "./components/EventCard";
import Navbar           from "./components/Navbar";
import BottomNav        from "./components/BottomNav";
import ToastStack       from "./components/Toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CATEGORIES = ["All","Technical","Cultural","Workshop","Sports","Seminar","Hackathon","Other"];
const CATEGORY_EMOJI = { Technical:"⚙️",Cultural:"🎭",Workshop:"🛠️",Sports:"🏆",Seminar:"📚",Hackathon:"💻",Other:"✨" };

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

/* ── Skeleton ───────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton" style={{ height: 140 }} />
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
        <div className="skeleton" style={{ height: 14, width: "30%" }} />
        <div className="skeleton" style={{ height: 18, width: "85%" }} />
        <div className="skeleton" style={{ height: 12, width: "60%" }} />
        <div className="skeleton" style={{ height: 12, width: "50%" }} />
      </div>
    </div>
  );
}

/* ── Guest login modal ──────────────────────────── */
function GuestLoginModal({ onClose, onLogin }) {
  const [name, setName] = useState("");
  const [err,  setErr]  = useState("");

  const submit = () => {
    const n = name.trim();
    if (n.length < 2) { setErr("Name must be at least 2 characters."); return; }
    localStorage.setItem("sist_guest_name", n);
    localStorage.setItem("sist_guest_id",   `guest_${Date.now()}`);
    onLogin(n); onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily: "var(--ff-display)" }}>Quick Sign In</h2>
          <button className="btn btn-ghost btn-icon tap" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <p className="text-muted text-sm">Enter your name to host or register for events. No password needed!</p>
          {err && <p className="form-error"><X size={12} /> {err}</p>}
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input className="form-input" placeholder="e.g. Arjun Krishnamurthy"
              value={name}
              onChange={e => { setName(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              autoFocus />
          </div>
          <button className="btn btn-primary btn-lg tap form-submit w-full" onClick={submit}>
            Continue <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Events feed ────────────────────────────────── */
function EventsFeed({ guestName, onRequestLogin, showToast, onHostClick }) {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("All");
  const [search,   setSearch]   = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try   { const res = await axios.get(`${API}/api/events`); setEvents(res.data); }
    catch { showToast("Couldn't load events.", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = events.filter(e => {
    const matchCat = category === "All" || e.category === category;
    const q = search.toLowerCase();
    return matchCat && (!q
      || e.title.toLowerCase().includes(q)
      || e.organizer.toLowerCase().includes(q)
      || e.location.toLowerCase().includes(q));
  });

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero container">
        <div className="hero-eyebrow animate-in" style={{ animationDelay: "0.05s" }}>
          <Zap size={11} /> Sathyabama Institute · Chennai
        </div>
        <h1 className="hero-title animate-in" style={{ animationDelay: "0.1s" }}>
          Campus Events Hub
        </h1>
        <p className="hero-sub animate-in" style={{ animationDelay: "0.15s" }}>
          Workshops, hackathons, fests and more — all in one place.
        </p>
        {/* Desktop only CTA — mobile uses bottom nav */}
        <div className="hero-cta animate-in nav-desktop-only" style={{ animationDelay: "0.2s" }}>
          <button className="btn btn-primary btn-lg tap" onClick={onHostClick}>
            <Plus size={18} /> Host an Event
          </button>
          <button className="btn btn-ghost btn-lg tap" onClick={fetchEvents}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      <main className="container" style={{ paddingBottom: 32 }}>
        {/* Search */}
        <div className="search-wrapper">
          <span className="search-icon-wrap"><Search size={17} /></span>
          <input className="search-input" placeholder="Search events, clubs, venues…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button className="btn btn-ghost btn-icon search-clear tap"
              style={{ minHeight: 36, width: 36 }} onClick={() => setSearch("")}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="filter-bar">
          {CATEGORIES.map(cat => (
            <button key={cat}
              className={`chip tap ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}>
              {cat !== "All" && `${CATEGORY_EMOJI[cat]} `}{cat}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div className="section-head">
          <h2 className="section-title">
            {category === "All" ? "All Events" : `${CATEGORY_EMOJI[category]} ${category}`}
          </h2>
          {!loading && (
            <span className="text-muted text-sm">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="events-grid">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{search ? "🔍" : events.length === 0 ? "📅" : "😶"}</div>
            <p className="empty-title">
              {search ? "No results found" : events.length === 0 ? "No events yet" : "Nothing here"}
            </p>
            <p className="empty-sub" style={{ marginBottom: 24 }}>
              {search ? "Try a different search term" : "Be the first to host one!"}
            </p>
            {!search && (
              <button className="btn btn-primary tap" onClick={onHostClick}>
                <Plus size={16} /> Host an Event
              </button>
            )}
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

/* ── Root App ───────────────────────────────────── */
export default function App() {
  const [guestName,      setGuestName]      = useState(() => localStorage.getItem("sist_guest_name") || null);
  const [view,           setView]           = useState("feed");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showHostModal,  setShowHostModal]  = useState(false);
  const { toasts, show: showToast } = useToast();

  const handleGuestLogout = () => {
    localStorage.removeItem("sist_guest_name");
    localStorage.removeItem("sist_guest_id");
    setGuestName(null);
    showToast("Signed out.", "info");
  };

  const handleHostClick = () => {
    if (!guestName) { setShowGuestModal(true); return; }
    setShowHostModal(true);
  };

  return (
    <>
      {/* Background */}
      <div className="bg-scene">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Toasts */}
      <ToastStack toasts={toasts} />

      {/* Modals */}
      {showGuestModal && (
        <GuestLoginModal
          onClose={() => setShowGuestModal(false)}
          onLogin={name => { setGuestName(name); showToast(`Welcome, ${name}! 👋`, "success"); }}
        />
      )}
      {showHostModal && (
        <HostEvent
          onClose={() => setShowHostModal(false)}
          guestName={guestName}
          onSuccess={() => showToast("Event submitted for review! 🎉", "success")}
        />
      )}

      {/* Top navbar */}
      <Navbar
        guestName={guestName}
        view={view}
        setView={setView}
        onGuestLogin={() => setShowGuestModal(true)}
        onGuestLogout={handleGuestLogout}
        onHostClick={handleHostClick}
      />

      {/* Page */}
      {view === "admin"
        ? <TeacherDashboard onLogout={() => setView("feed")} />
        : <EventsFeed
            guestName={guestName}
            onRequestLogin={() => setShowGuestModal(true)}
            showToast={showToast}
            onHostClick={handleHostClick}
          />
      }

      {/* Footer — desktop only */}
      <footer className="footer nav-desktop-only">
        <p>SIST<strong style={{ color: "var(--amber-500)" }}>EVENTS</strong> · Sathyabama Institute of Science and Technology</p>
        <p style={{ marginTop: 4, fontSize: "0.72rem" }}>Crafted for students, by students ✦</p>
      </footer>

      {/* Mobile bottom nav */}
      <BottomNav
        view={view}
        setView={setView}
        onHostClick={handleHostClick}
        guestName={guestName}
        onGuestLogin={() => setShowGuestModal(true)}
      />
    </>
  );
}
