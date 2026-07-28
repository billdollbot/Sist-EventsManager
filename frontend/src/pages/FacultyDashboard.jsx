/**
 * pages/FacultyDashboard.jsx v5
 * Faculty can: view all approved events + create new events + track submissions + view registrations
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, CalendarDays, MapPin, Clock, CheckCircle, XCircle, Eye, Zap, Users, ClipboardList } from "lucide-react";
import EventCard from "../components/EventCard";
import HostEvent from "../HostEvent";
import RegistrationTracker from "../components/RegistrationTracker";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const BADGE = { Technical: "badge-technical", Cultural: "badge-cultural", Workshop: "badge-workshop", Sports: "badge-sports", Seminar: "badge-seminar", Hackathon: "badge-hackathon", Other: "badge-other" };
const CATEGORIES = ["All", "Technical", "Cultural", "Workshop", "Sports", "Seminar", "Hackathon", "Other"];
const EMOJI = { Technical: "⚙️", Cultural: "🎭", Workshop: "🛠️", Sports: "🏆", Seminar: "📚", Hackathon: "💻", Other: "✨" };

export default function FacultyDashboard({ session, showToast, activeView, onNav }) {
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [showHost, setShowHost] = useState(false);
  const [category, setCategory] = useState("All");
  const [trackingEvent, setTrackingEvent] = useState(null);

  // Map activeView to internal tab
  const tab = activeView === "submissions" ? "mine" : activeView === "create" ? "create" : "events";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/api/events`); setEvents(r.data); }
    catch { showToast("Failed to load events", "error"); }
    finally { setLoading(false); }
  }, []);

  const fetchMine = useCallback(async () => {
    setMyLoading(true);
    try { const r = await axios.get(`${API}/api/faculty/events/${session.id}`); setMyEvents(r.data); }
    catch { showToast("Failed to load your events", "error"); }
    finally { setMyLoading(false); }
  }, [session.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (tab === "mine") fetchMine(); }, [tab, fetchMine]);

  // If activeView is "create", open the modal
  useEffect(() => {
    if (activeView === "create") {
      setShowHost(true);
    }
  }, [activeView]);

  const filtered = events.filter(e => category === "All" || e.category === category);

  return (
    <div className="page">
      {showHost && (
        <HostEvent
          onClose={() => { setShowHost(false); if (activeView === "create") onNav("events"); }}
          session={session}
          onSuccess={() => { showToast("Event submitted for admin review! 🎉", "success"); fetchMine(); onNav("submissions"); }}
        />
      )}

      {/* Registration Tracker */}
      {trackingEvent && (
        <RegistrationTracker
          eventId={trackingEvent}
          onClose={() => setTrackingEvent(null)}
          showToast={showToast}
        />
      )}

      {/* Header */}
      <div className="container" style={{ paddingTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>Faculty Portal</p>
            <h2 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(1.2rem,4vw,1.7rem)", fontWeight: 800 }}>
              Welcome, {session.name}
            </h2>
            {session.department && <p className="text-xs text-muted" style={{ marginTop: 2 }}>{session.department}</p>}
          </div>
          <button className="btn btn-primary tap" onClick={() => setShowHost(true)}>
            <Plus size={16} /> Create Event
          </button>
        </div>


      </div>

      {/* ── ALL EVENTS ──────────────────────────── */}
      {tab === "events" && (
        <div className="container" style={{ paddingBottom: 60 }}>
          <div className="filter-bar" style={{ marginBottom: 18 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} className={`chip tap ${category === cat ? "active" : ""}`} onClick={() => setCategory(cat)}>
                {cat !== "All" && `${EMOJI[cat]} `}{cat}
              </button>
            ))}
          </div>
          <div className="section-head">
            <h2 className="section-title">Approved Events</h2>
            <span className="text-muted text-sm">{filtered.length} events</span>
          </div>
          {loading ? (
            <div className="events-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card"><div className="skeleton" style={{ height: 140 }} /><div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}><div className="skeleton" style={{ height: 14, width: "30%" }} /><div className="skeleton" style={{ height: 18, width: "85%" }} /></div></div>)}</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📅</div><p className="empty-title">No events yet</p></div>
          ) : (
            <div className="events-grid">{filtered.map(ev => <EventCard key={ev._id} event={ev} showToast={showToast} />)}</div>
          )}
        </div>
      )}

      {/* ── MY SUBMISSIONS ──────────────────────── */}
      {tab === "mine" && (
        <div className="container" style={{ paddingBottom: 60 }}>
          <div className="section-head" style={{ marginBottom: 16 }}>
            <h2 className="section-title">My Submissions</h2>
            <button className="btn btn-primary btn-sm tap" onClick={() => setShowHost(true)}>
              <Plus size={13} /> New Event
            </button>
          </div>

          {myLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: "var(--r-md)" }} />)}</div>
          ) : myEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✍️</div>
              <p className="empty-title">No submissions yet</p>
              <p className="empty-sub" style={{ marginBottom: 20 }}>Events you create will appear here.</p>
              <button className="btn btn-primary tap" onClick={() => setShowHost(true)}><Plus size={15} /> Create Event</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myEvents.map(ev => {
                const hasForm = ev.registration_fields && ev.registration_fields.length > 0;
                return (
                  <div key={ev._id} style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
                          <span className={`badge ${BADGE[ev.category] || "badge-other"}`}>{ev.category}</span>
                          <span className={`badge badge-${ev.status}`}>
                            {ev.status === "pending" && <Clock size={9} />}
                            {ev.status === "approved" && <CheckCircle size={9} />}
                            {ev.status === "rejected" && <XCircle size={9} />}
                            {" "}{ev.status}
                          </span>
                        </div>
                        <p className="fw-700" style={{ fontSize: "0.92rem", marginBottom: 5 }}>{ev.title}</p>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: hasForm ? 8 : 0 }}>
                          <span className="text-xs text-muted d-flex ai-center gap-4"><CalendarDays size={10} /> {fmtDate(ev.event_date)}</span>
                          <span className="text-xs text-muted d-flex ai-center gap-4"><MapPin size={10} /> {ev.location}</span>
                          {hasForm && (
                            <span className="text-xs d-flex ai-center gap-4" style={{ color: "var(--accent)" }}>
                              <Users size={10} /> {ev.registration_count || 0}
                              {ev.registration_limit > 0 ? `/${ev.registration_limit}` : ""} registered
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        {ev.status === "pending" && (
                          <span style={{ fontSize: "0.7rem", color: "var(--accent)", background: "var(--accent-glow)", border: "1px solid var(--accent-ring)", padding: "4px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
                            Awaiting Review
                          </span>
                        )}
                        {hasForm && ev.status === "approved" && (
                          <button
                            className="btn btn-secondary btn-sm tap"
                            onClick={() => setTrackingEvent(ev._id)}
                            style={{ fontSize: "0.72rem", padding: "5px 10px", minHeight: 32 }}
                          >
                            <ClipboardList size={12} /> Registrations
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}