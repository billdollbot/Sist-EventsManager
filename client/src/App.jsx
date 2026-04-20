/**
 * SIST-EVENTS — App.jsx v3
 * Role-based: admin | faculty | student
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { Search, X, Zap, LogOut, GraduationCap, BookOpen, Shield } from "lucide-react";

import LoginPage       from "./pages/LoginPage";
import AdminConsole    from "./pages/AdminConsole";
import FacultyDashboard from "./pages/FacultyDashboard";
import EventCard       from "./components/EventCard";
import ToastStack      from "./components/Toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CATEGORIES = ["All","Technical","Cultural","Workshop","Sports","Seminar","Hackathon","Other"];
const EMOJI = { Technical:"⚙️",Cultural:"🎭",Workshop:"🛠️",Sports:"🏆",Seminar:"📚",Hackathon:"💻",Other:"✨" };

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

/* ── Navbar ─────────────────────────────────────── */
function Navbar({ session, onLogout }) {
  const ROLE_CONFIG = {
    student: { icon: GraduationCap, color: "var(--teal-400)",  bg: "var(--teal-glow)",  border: "rgba(45,212,191,0.2)" },
    faculty: { icon: BookOpen,       color: "var(--amber-400)", bg: "var(--amber-glow)", border: "var(--amber-ring)" },
    admin:   { icon: Shield,         color: "var(--rose-400)",  bg: "var(--rose-glow)",  border: "rgba(251,113,133,0.25)" },
  };
  const rc = ROLE_CONFIG[session.role] || ROLE_CONFIG.student;
  const Icon = rc.icon;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="nav-logo" style={{ cursor: "default" }}>
          <span className="nav-logo-dot" />
          SIST<span style={{ color: "var(--amber-500)" }}>EVENTS</span>
        </div>
        <div className="nav-actions">
          <div style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:rc.bg,border:`1px solid ${rc.border}`,borderRadius:"var(--radius-pill)",fontSize:"0.78rem",fontWeight:600,color:rc.color }}>
            <Icon size={13}/>
            <span className="hide-xs">{session.name}</span>
            <span style={{ fontSize:"0.65rem",opacity:0.8,textTransform:"uppercase",letterSpacing:"0.05em" }}>· {session.role}</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm tap" onClick={onLogout} title="Sign out">
            <LogOut size={16}/>
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ── Student Feed ───────────────────────────────── */
function StudentFeed({ session, showToast }) {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("All");
  const [search,   setSearch]   = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try   { const r = await axios.get(`${API}/api/events`); setEvents(r.data); }
    catch { showToast("Couldn't load events.", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = events.filter(e => {
    const mc = category === "All" || e.category === category;
    const q  = search.toLowerCase();
    return mc && (!q || e.title.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
  });

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero container">
        <div className="hero-eyebrow animate-in">
          <Zap size={11}/> Sathyabama Institute · Chennai
        </div>
        <h1 className="hero-title animate-in" style={{ animationDelay: "0.1s" }}>
          Campus Events Hub
        </h1>
        <p className="hero-sub animate-in" style={{ animationDelay:"0.14s" }}>
          Hi {session.name.split(" ")[0]}! Discover upcoming workshops, hackathons and fests.
        </p>
      </section>

      <main className="container" style={{ paddingBottom: 40 }}>
        {/* Search */}
        <div className="search-wrapper">
          <span className="search-icon-wrap"><Search size={17}/></span>
          <input className="search-input" placeholder="Search events, clubs, venues…"
            value={search} onChange={e => setSearch(e.target.value)}/>
          {search && (
            <button className="btn btn-ghost btn-icon search-clear tap"
              style={{ minHeight:36,width:36 }} onClick={()=>setSearch("")}>
              <X size={15}/>
            </button>
          )}
        </div>

        {/* Chips */}
        <div className="filter-bar">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`chip tap ${category===cat?"active":""}`} onClick={()=>setCategory(cat)}>
              {cat!=="All"&&`${EMOJI[cat]} `}{cat}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="section-head">
          <h2 className="section-title">
            {category === "All" ? "All Events" : `${EMOJI[category]} ${category}`}
          </h2>
          {!loading && <span className="text-muted text-sm">{filtered.length} event{filtered.length!==1?"s":""}</span>}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="events-grid">{[1,2,3,4].map(i=><SkeletonCard key={i}/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{search?"🔍":"📅"}</div>
            <p className="empty-title">{search?"No results found":"No events yet"}</p>
            <p className="empty-sub">{search?"Try a different search term":"Check back later!"}</p>
          </div>
        ) : (
          <div className="events-grid">
            {filtered.map(ev=><EventCard key={ev._id} event={ev}/>)}
          </div>
        )}
      </main>
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
  const { toasts, show: showToast } = useToast();

  const handleLogin = sess => setSession(sess);

  const handleLogout = () => {
    localStorage.removeItem("sist_session");
    setSession(null);
    showToast("Signed out successfully.", "info");
  };

  /* Not logged in → Login page */
  if (!session) {
    return (
      <>
        <div className="bg-scene">
          <div className="bg-orb bg-orb-1"/><div className="bg-orb bg-orb-2"/><div className="bg-orb bg-orb-3"/>
        </div>
        <ToastStack toasts={toasts}/>
        <LoginPage onLogin={handleLogin}/>
      </>
    );
  }

  return (
    <>
      <div className="bg-scene">
        <div className="bg-orb bg-orb-1"/><div className="bg-orb bg-orb-2"/><div className="bg-orb bg-orb-3"/>
      </div>
      <ToastStack toasts={toasts}/>
      <Navbar session={session} onLogout={handleLogout}/>

      {session.role === "admin"   && <AdminConsole     session={session}/>}
      {session.role === "faculty" && <FacultyDashboard session={session} showToast={showToast}/>}
      {session.role === "student" && <StudentFeed      session={session} showToast={showToast}/>}

      <footer className="footer">
        <p>SIST<strong style={{ color:"var(--amber-500)" }}>EVENTS</strong> · Sathyabama Institute of Science and Technology</p>
        <p style={{ marginTop:4,fontSize:"0.72rem" }}>Crafted for students, by students ✦</p>
      </footer>
    </>
  );
}