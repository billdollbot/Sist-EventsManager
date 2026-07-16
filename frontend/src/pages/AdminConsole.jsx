/**
 * pages/AdminConsole.jsx â€” v6
 * Hamburger side-nav | Events + Faculty | Global Theme (via FloatingThemeButton)
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Shield, Users, CalendarDays, Plus, Trash2,
  CheckCircle, XCircle, Clock, Eye, X, RefreshCw,
  UserPlus, ToggleLeft, ToggleRight, Menu, ChevronRight,
  ChevronDown, ChevronLeft, LogOut,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* (Theme is now global â€” see components/ThemeProvider.jsx + FloatingThemeButton.jsx)

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TOAST hook
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return { toasts, show };
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   CONFIRM MODAL
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div className="ac-overlay" onClick={onCancel}>
      <div className="ac-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="ac-modal-body" style={{ textAlign: "center", padding: "32px 24px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Trash2 size={24} color="#f43f5e" />
          </div>
          <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 8, color: "var(--text-main)" }}>Are you sure?</p>
          <p style={{ color: "var(--text-sub)", fontSize: "0.84rem", marginBottom: 24 }}>{msg}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="ac-btn ac-btn-ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
            <button className="ac-btn ac-btn-danger" onClick={onConfirm} style={{ flex: 1 }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ADD FACULTY MODAL
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AddFacultyModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", username: "", password: "", department: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErr(""); };

  const save = async () => {
    if (!form.name.trim() || !form.username.trim() || !form.password) { setErr("Name, username and password are required."); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { setErr(e.response?.data?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div className="ac-overlay" onClick={onClose}>
      <div className="ac-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="ac-modal-header">
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={16} color="var(--accent)" /> Add Faculty
          </span>
          <button className="ac-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ac-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {err && <div style={{ padding: "10px 14px", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 8, fontSize: "0.82rem", color: "#f43f5e" }}>{err}</div>}
          {[["Full Name", "name", "Dr. Ramesh Kumar"], ["Username", "username", "ramesh.kumar"], ["Password", "password", ""], ["Department", "department", "Computer Science"]].map(([label, key, ph]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-sub)" }}>{label} {["name", "username", "password"].includes(key) ? "*" : ""}</label>
              <input
                className="ac-input"
                type={key === "password" ? "password" : "text"}
                placeholder={ph}
                value={form[key]}
                onChange={set(key)}
              />
            </div>
          ))}
          <button
            className={`ac-btn ac-btn-primary ${saving ? "ac-btn-loading" : ""}`}
            style={{ marginTop: 4 }} onClick={save} disabled={saving}>
            {!saving && "Add Faculty"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   EVENT DETAIL MODAL
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function EventDetailModal({ event, onClose, onApprove, onReject, acting }) {
  if (!event) return null;
  const BADGE_MAP = { Technical: "badge-technical", Cultural: "badge-cultural", Workshop: "badge-workshop", Sports: "badge-sports", Seminar: "badge-seminar", Hackathon: "badge-hackathon", Other: "badge-other" };
  const brochureSrc = event.brochure_path
    ? (event.brochure_path.startsWith("http") ? event.brochure_path : `${API}${event.brochure_path}`)
    : null;

  return (
    <div className="ac-overlay" onClick={onClose}>
      <div className="ac-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="ac-modal-header">
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>Event Details</span>
          <button className="ac-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        {brochureSrc && (
          <img src={brochureSrc} alt="brochure"
            style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />
        )}
        <div className="ac-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h3 style={{ fontFamily: "var(--ff-display)", fontSize: "1.1rem", fontWeight: 800, flex: 1, color: "var(--text-main)" }}>{event.title}</h3>
            <span className={`badge ${BADGE_MAP[event.category] || "badge-other"}`}>{event.category}</span>
          </div>
          <p style={{ fontSize: "0.84rem", color: "var(--text-sub)", lineHeight: 1.7 }}>{event.description}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Organizer", event.organizer], ["Location", event.location], ["Date", fmtDate(event.event_date)], ["Posted by", event.created_by]].map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: "0.68rem", color: "var(--text-sub)", marginBottom: 3, fontWeight: 600 }}>{k}</p>
                <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text-main)" }}>{v}</p>
              </div>
            ))}
          </div>
          {event.registration_link && (
            <a href={event.registration_link} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", border: "1px solid var(--border-col)", borderRadius: 10, color: "var(--accent)", fontSize: "0.84rem", fontWeight: 600, textDecoration: "none", background: "var(--accent-glow)" }}>
              Registration Link â†’
            </a>
          )}
          {event.status === "pending" && (
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className={`ac-btn ac-btn-approve ${acting === event._id + "approved" ? "ac-btn-loading" : ""}`}
                style={{ flex: 1 }} onClick={() => onApprove(event._id)} disabled={!!acting}>
                {!acting && <><CheckCircle size={15} /> Approve</>}
              </button>
              <button
                className={`ac-btn ac-btn-danger ${acting === event._id + "rejected" ? "ac-btn-loading" : ""}`}
                style={{ flex: 1 }} onClick={() => onReject(event._id)} disabled={!!acting}>
                {!acting && <><XCircle size={15} /> Reject</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   EVENTS PANEL
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function EventsPanel() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toasts, show } = useToast();

  const BADGE_MAP = { Technical: "badge-technical", Cultural: "badge-cultural", Workshop: "badge-workshop", Sports: "badge-sports", Seminar: "badge-seminar", Hackathon: "badge-hackathon", Other: "badge-other" };

  const fetchEvents = useCallback(async (f = filter) => {
    setLoading(true);
    try {
      const param = f === "all" ? "" : `?status=${f}`;
      const r = await axios.get(`${API}/api/admin/events${param}`);
      setEvents(r.data);
    } catch { show("Failed to load events", "error"); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchEvents(filter); }, [filter]);

  const updateStatus = async (id, status) => {
    setActing(id + status);
    try {
      await axios.patch(`${API}/api/admin/events/${id}/status`, { status });
      show(status === "approved" ? "Event approved! âœ…" : "Event rejected.", status === "approved" ? "success" : "error");
      setDetailEvent(null); fetchEvents(filter);
    } catch { show("Action failed", "error"); }
    finally { setActing(null); }
  };

  const deleteEvent = async id => {
    try { await axios.delete(`${API}/api/admin/events/${id}`); show("Event deleted.", "info"); fetchEvents(filter); setDeleteTarget(null); }
    catch { show("Delete failed", "error"); }
  };

  const FILTERS = [
    { key: "pending", label: "Pending", icon: Clock },
    { key: "approved", label: "Live", icon: CheckCircle },
    { key: "rejected", label: "Rejected", icon: XCircle },
    { key: "all", label: "All", icon: CalendarDays },
  ];

  return (
    <div className="ac-panel">
      {/* Toasts */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} className={`ac-toast ac-toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>

      {detailEvent && (
        <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)}
          onApprove={id => updateStatus(id, "approved")}
          onReject={id => updateStatus(id, "rejected")}
          acting={acting} />
      )}
      {deleteTarget && (
        <ConfirmModal
          msg={`Permanently delete "${deleteTarget.title}"?`}
          onConfirm={() => deleteEvent(deleteTarget._id)}
          onCancel={() => setDeleteTarget(null)} />
      )}

      <div className="ac-panel-header">
        <div>
          <h2 className="ac-panel-title">Events</h2>
          <p className="ac-panel-sub">Review and manage event submissions</p>
        </div>
        <button className="ac-icon-btn" onClick={() => fetchEvents(filter)} title="Refresh">
          <RefreshCw size={16} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="ac-filter-row">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`ac-chip ${filter === key ? "ac-chip-active" : ""}`}
            onClick={() => setFilter(key)}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="ac-stats-row">
        {[
          { label: "Pending", val: events.filter(e => e.status === "pending").length, color: "var(--accent)" },
          { label: "Approved", val: events.filter(e => e.status === "approved").length, color: "#22c55e" },
          { label: "Rejected", val: events.filter(e => e.status === "rejected").length, color: "#f43f5e" },
        ].map(({ label, val, color }) => (
          <div key={label} className="ac-stat-pill">
            <span style={{ fontFamily: "var(--ff-display)", fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1 }}>{val}</span>
            <span style={{ fontSize: "0.65rem", color: "var(--text-sub)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Event list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} className="ac-skeleton" style={{ height: 90, borderRadius: 12 }} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="ac-empty">
          <div style={{ fontSize: "2.5rem", marginBottom: 12, opacity: 0.3 }}>ðŸ“‹</div>
          <p style={{ fontWeight: 700, color: "var(--text-main)" }}>No {filter} events</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map(ev => (
            <div key={ev._id} className="ac-row-item">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  <span className={`badge ${BADGE_MAP[ev.category] || "badge-other"}`}>{ev.category}</span>
                  <span className={`badge badge-${ev.status}`}>{ev.status}</span>
                </div>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{ev.title}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginTop: 3 }}>{ev.organizer} Â· {ev.created_by} Â· {fmtDate(ev.event_date)}</p>
              </div>
              <div className="ac-row-actions">
                <button className="ac-icon-btn" onClick={() => setDetailEvent(ev)} title="View"><Eye size={15} /></button>
                {ev.status === "pending" && <>
                  <button className={`ac-icon-btn ac-icon-approve ${acting === ev._id + "approved" ? "ac-btn-loading" : ""}`}
                    onClick={() => updateStatus(ev._id, "approved")} disabled={!!acting} title="Approve">
                    {acting !== ev._id + "approved" && <CheckCircle size={15} />}
                  </button>
                  <button className={`ac-icon-btn ac-icon-reject ${acting === ev._id + "rejected" ? "ac-btn-loading" : ""}`}
                    onClick={() => updateStatus(ev._id, "rejected")} disabled={!!acting} title="Reject">
                    {acting !== ev._id + "rejected" && <XCircle size={15} />}
                  </button>
                </>}
                <button className="ac-icon-btn ac-icon-delete" onClick={() => setDeleteTarget(ev)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   FACULTY PANEL
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FacultyPanel() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const { toasts, show } = useToast();

  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/api/admin/faculty`); setFaculty(r.data); }
    catch { show("Failed to load faculty", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFaculty(); }, []);

  const addFaculty = async form => {
    await axios.post(`${API}/api/admin/faculty`, { username: form.username.trim(), password: form.password, name: form.name.trim(), department: form.department });
    show("Faculty added! ðŸŽ‰", "success"); fetchFaculty();
  };
  const toggleFaculty = async (id, current) => {
    try { await axios.patch(`${API}/api/admin/faculty/${id}`, { isActive: !current }); fetchFaculty(); }
    catch { show("Failed", "error"); }
  };
  const deleteFaculty = async id => {
    try { await axios.delete(`${API}/api/admin/faculty/${id}`); show("Faculty removed.", "info"); fetchFaculty(); setDeleteTarget(null); }
    catch { show("Delete failed", "error"); }
  };

  const filtered = faculty.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ac-panel">
      {/* Toasts */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map(t => <div key={t.id} className={`ac-toast ac-toast-${t.type}`}>{t.msg}</div>)}
      </div>

      {showAdd && <AddFacultyModal onClose={() => setShowAdd(false)} onSave={addFaculty} />}
      {deleteTarget && (
        <ConfirmModal msg={`Remove "${deleteTarget.name}"? Their events will remain.`}
          onConfirm={() => deleteFaculty(deleteTarget._id)}
          onCancel={() => setDeleteTarget(null)} />
      )}

      <div className="ac-panel-header">
        <div>
          <h2 className="ac-panel-title">Faculty</h2>
          <p className="ac-panel-sub">Manage faculty accounts and access</p>
        </div>
        <button className="ac-btn ac-btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Faculty
        </button>
      </div>

      {/* Search + stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <input className="ac-input" placeholder="Search by name or usernameâ€¦"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 14 }} />
        </div>
        <div className="ac-stat-pill">
          <span style={{ fontFamily: "var(--ff-display)", fontSize: "1.3rem", fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{faculty.length}</span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-sub)", textTransform: "uppercase", fontWeight: 600 }}>Total</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} className="ac-skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ac-empty">
          <div style={{ fontSize: "2.5rem", marginBottom: 12, opacity: 0.3 }}>ðŸ‘¨â€ðŸ«</div>
          <p style={{ fontWeight: 700, color: "var(--text-main)" }}>{search ? "No results" : "No faculty yet"}</p>
          <p style={{ fontSize: "0.84rem", color: "var(--text-sub)", marginTop: 4 }}>Use the "Add Faculty" button to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(f => (
            <div key={f._id} className="ac-row-item">
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: "var(--accent-glow)", border: "1px solid var(--accent-ring)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.78rem", fontWeight: 800, color: "var(--accent)",
                }}>{f.name.slice(0, 2).toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-sub)" }}>@{f.username}{f.department && ` Â· ${f.department}`}</p>
                </div>
              </div>
              <div className="ac-row-actions">
                <span style={{
                  fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                  background: f.isActive ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.1)",
                  color: f.isActive ? "#22c55e" : "#94a3b8",
                  border: `1px solid ${f.isActive ? "rgba(34,197,94,0.3)" : "rgba(148,163,184,0.2)"}`,
                }}>{f.isActive ? "Active" : "Inactive"}</span>
                <button className="ac-icon-btn" title={f.isActive ? "Deactivate" : "Activate"}
                  style={{ color: f.isActive ? "#22c55e" : "var(--text-sub)" }}
                  onClick={() => toggleFaculty(f._id, f.isActive)}>
                  {f.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                </button>
                <button className="ac-icon-btn ac-icon-delete" onClick={() => setDeleteTarget(f)} title="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MAIN ADMIN CONSOLE
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function AdminConsole({ session, onLogout }) {
  const [tab, setTab] = useState("events");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("ac_collapsed") === "true"; } catch { return false; }
  });

  const NAV_ITEMS = [
    { key: "events", label: "Events", icon: CalendarDays, desc: "Manage submissions" },
    { key: "faculty", label: "Faculty", icon: Users, desc: "Manage accounts" },
  ];

  const toggleCollapsed = () => {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem("ac_collapsed", String(next)); } catch { }
      return next;
    });
  };

  const handleTabChange = (key) => {
    setTab(key);
    setSidebarOpen(false);
  };

  // Escape closes mobile sidebar
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // Lock body scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <>
      <style>{`
        /* â”€â”€ Admin Console Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        .ac-layout { display: flex; flex: 1; min-height: 0; background: var(--bg-page); }

        /* â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        .ac-sidebar {
          width: 240px; flex-shrink: 0;
          background: var(--bg-card);
          border-right: 1px solid var(--border-subtle);
          display: flex; flex-direction: column;
          overflow: hidden; z-index: 50;
          transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .ac-sidebar.collapsed { width: 64px; }
        @media(max-width: 767px) {
          .ac-sidebar {
            position: fixed; top: 60px; left: 0; bottom: 0;
            width: min(260px, 82vw) !important;
            transform: translateX(-100%);
            box-shadow: 4px 0 32px rgba(0,0,0,0.25);
            transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
          }
          .ac-sidebar.open { transform: translateX(0); }
          .ac-sidebar-backdrop { position: fixed; inset: 0; top: 60px; background: rgba(0,0,0,0.45); z-index: 49; backdrop-filter: blur(3px); }
        }
        @media(min-width: 768px) { .ac-sidebar-backdrop { display: none !important; } }

        /* Sidebar header */
        .ac-sidebar-header {
          padding: 16px 14px 12px; flex-shrink: 0;
          border-bottom: 1px solid var(--border-subtle);
          display: flex; align-items: center; gap: 8px;
        }
        .ac-sidebar-brand { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; overflow: hidden; }
        .ac-brand-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: var(--accent-light); border: 1px solid var(--accent-ring);
          display: flex; align-items: center; justify-content: center;
        }
        .ac-brand-text { min-width: 0; transition: opacity 0.2s; }
        .ac-brand-name { font-size: 0.88rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; line-height: 1.2; }
        .ac-brand-sub { font-size: 0.62rem; color: var(--text-muted); white-space: nowrap; }
        .ac-collapse-btn {
          width: 28px; height: 28px; flex-shrink: 0;
          background: transparent; border: 1px solid var(--border-subtle); border-radius: 8px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: var(--text-muted); transition: all 0.15s;
        }
        .ac-collapse-btn:hover { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border-light); }
        @media(max-width: 767px) { .ac-collapse-btn { display: none !important; } }
        .ac-sidebar.collapsed .ac-brand-text { opacity: 0; width: 0; overflow: hidden; }
        .ac-sidebar.collapsed .ac-sidebar-header { padding: 16px 8px 12px; justify-content: center; }
        .ac-sidebar.collapsed .ac-sidebar-brand { justify-content: center; }

        .ac-signed-in { padding: 8px 16px 4px; font-size: 0.68rem; color: var(--text-muted); flex-shrink: 0; }
        .ac-signed-in strong { color: var(--text-secondary); font-weight: 700; }
        .ac-sidebar.collapsed .ac-signed-in { display: none; }

        /* Nav items */
        .ac-sidebar-nav { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
        .ac-nav-item {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 12px; border-radius: 10px;
          cursor: pointer; border: none; border-left: 3px solid transparent;
          background: transparent; width: 100%; text-align: left;
          color: var(--text-secondary);
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .ac-nav-item:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .ac-nav-item.active { background: var(--accent-light); color: var(--accent); border-left-color: var(--accent); font-weight: 700; }
        .ac-nav-label { font-size: 0.88rem; font-weight: 600; line-height: 1; }
        .ac-nav-desc { font-size: 0.67rem; color: var(--text-muted); margin-top: 2px; }
        .ac-nav-icon { flex-shrink: 0; }
        .ac-sidebar.collapsed .ac-sidebar-nav { padding: 10px 8px; }
        .ac-sidebar.collapsed .ac-nav-item { padding: 12px; justify-content: center; border-left-color: transparent !important; }
        .ac-sidebar.collapsed .ac-nav-item.active { background: var(--accent-light); color: var(--accent); }

        /* Sidebar footer */
        .ac-sidebar-footer { padding: 10px; border-top: 1px solid var(--border-subtle); flex-shrink: 0; }
        .ac-signout { color: #ef4444 !important; }
        .ac-signout:hover { background: rgba(239,68,68,0.08) !important; color: #f87171 !important; }

        /* â”€â”€ MOBILE TOPBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        .ac-topbar {
          display: none; align-items: center;
          height: 52px; gap: 0; flex-shrink: 0;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-subtle);
          padding: 0 8px;
        }
        @media(max-width: 767px) { .ac-topbar { display: flex; } }
        .ac-hamburger {
          width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; border-radius: 10px;
          color: var(--text-primary); flex-shrink: 0; margin-right: 4px;
          transition: background 0.15s;
        }
        .ac-hamburger:hover { background: var(--bg-elevated); }
        .ac-topbar-tabs { flex: 1; display: flex; gap: 6px; justify-content: center; }
        .ac-topbar-tab {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 16px; border-radius: 8px; min-height: 44px;
          font-size: 0.8rem; font-weight: 600;
          border: 1px solid transparent; background: transparent;
          color: var(--text-secondary); cursor: pointer; white-space: nowrap;
          transition: all 0.15s;
        }
        .ac-topbar-tab.active { border-color: var(--accent-ring); background: var(--accent-light); color: var(--accent); }
        .ac-topbar-tab:hover:not(.active) { background: var(--bg-elevated); color: var(--text-primary); }

        /* â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        .ac-main { flex: 1; overflow-y: auto; min-width: 0; display: flex; flex-direction: column; overscroll-behavior: contain; }
        .ac-panel { padding: 28px; max-width: 900px; flex: 1; }
        @media(max-width: 767px) { .ac-panel { padding: 16px 14px; } }
        .ac-panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .ac-panel-title { font-family: var(--ff-display); font-size: 1.5rem; font-weight: 800; color: var(--text-main); line-height: 1.2; }
        @media(max-width: 767px) { .ac-panel-title { font-size: 1.2rem; } }
        .ac-panel-sub { font-size: 0.82rem; color: var(--text-sub); margin-top: 3px; }

        /* ROW ITEMS */
        .ac-row-item {
          display: flex; align-items: center;
          background: var(--bg-card); border: 1px solid var(--border-col);
          border-radius: 12px; padding: 14px 16px;
          gap: 12px; transition: border-color 0.2s, box-shadow 0.2s;
        }
        @media(max-width: 767px) { .ac-row-item { flex-direction: column; align-items: stretch; padding: 12px; gap: 10px; } }
        .ac-row-item:hover { border-color: var(--accent-ring); box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .ac-row-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
        @media(max-width: 767px) { .ac-row-actions { justify-content: flex-start; } }

        /* BUTTONS */
        .ac-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          font-family: var(--ff-body); font-size: 0.86rem; font-weight: 600;
          padding: 10px 18px; min-height: 40px; border-radius: 10px;
          border: 1px solid transparent; cursor: pointer;
          transition: all 0.15s ease; position: relative; white-space: nowrap;
        }
        @media(max-width: 767px) { .ac-btn { font-size: 0.8rem; padding: 8px 14px; min-height: 38px; } }
        .ac-btn:disabled { opacity: 0.4; pointer-events: none; }
        .ac-btn-primary { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
        .ac-btn-primary:hover { opacity: 0.9; }
        .ac-btn-ghost { background: transparent; border-color: var(--border-col); color: var(--text-sub); }
        .ac-btn-ghost:hover { background: var(--accent-light); color: var(--accent); border-color: var(--accent-ring); }
        .ac-btn-danger { background: rgba(244,63,94,0.12); border-color: rgba(244,63,94,0.25); color: #f43f5e; }
        .ac-btn-danger:hover { background: rgba(244,63,94,0.2); }
        .ac-btn-approve { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.25); color: #22c55e; }
        .ac-btn-approve:hover { background: rgba(34,197,94,0.2); }
        .ac-btn-loading { color: transparent !important; }
        .ac-btn-loading::before { content: ''; position: absolute; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.65s linear infinite; }
        .ac-icon-btn {
          width: 36px; height: 36px; border-radius: 8px;
          border: 1px solid var(--border-col); background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-sub); transition: all 0.15s ease;
        }
        .ac-icon-btn:hover { background: var(--accent-light); color: var(--accent); border-color: var(--accent-ring); }
        .ac-icon-approve { border-color: rgba(34,197,94,0.3) !important; color: #22c55e !important; }
        .ac-icon-approve:hover { background: rgba(34,197,94,0.12) !important; }
        .ac-icon-reject { border-color: rgba(244,63,94,0.3) !important; color: #f43f5e !important; }
        .ac-icon-reject:hover { background: rgba(244,63,94,0.12) !important; }
        .ac-icon-delete:hover { background: rgba(244,63,94,0.12) !important; color: #f43f5e !important; border-color: rgba(244,63,94,0.3) !important; }

        /* INPUT */
        .ac-input {
          width: 100%; min-height: 44px; padding: 10px 14px;
          background: var(--bg-page); border: 1px solid var(--border-col);
          border-radius: 10px; color: var(--text-main);
          font-family: var(--ff-body); font-size: 0.92rem; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ac-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
        .ac-input::placeholder { color: var(--text-sub); opacity: 0.6; }

        /* FILTER / CHIPS */
        .ac-filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        @media(max-width: 767px) { .ac-filter-row { gap: 6px; margin-bottom: 12px; } }
        .ac-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 999px;
          font-size: 0.78rem; font-weight: 600;
          border: 1px solid var(--border-col); background: transparent; color: var(--text-sub);
          cursor: pointer; white-space: nowrap; transition: all 0.15s ease;
        }
        .ac-chip:hover { border-color: var(--accent-ring); color: var(--text-main); }
        .ac-chip-active { background: var(--accent-light) !important; border-color: var(--accent-ring) !important; color: var(--accent) !important; font-weight: 700 !important; }

        /* STATS */
        .ac-stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        @media(max-width: 767px) { .ac-stats-row { gap: 8px; } }
        .ac-stat-pill {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-card); border: 1px solid var(--border-col);
          border-radius: 10px; padding: 10px 16px;
        }
        @media(max-width: 767px) { .ac-stat-pill { padding: 8px 12px; flex: 1; min-width: 0; justify-content: center; } }

        /* MODAL */
        .ac-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
          display: flex; align-items: flex-end; justify-content: center;
          animation: fade-in 0.2s ease; padding: 0;
        }
        @media(min-width: 640px) { .ac-overlay { align-items: center; padding: 24px; } }
        .ac-modal {
          background: var(--bg-card); border: 1px solid var(--border-col);
          border-radius: 20px 20px 0 0; width: 100%;
          max-height: 92dvh; overflow-y: auto;
          animation: slide-up 0.3s cubic-bezier(0.34,1.2,0.64,1);
          padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
        }
        @media(min-width: 640px) { .ac-modal { border-radius: 16px; animation: pop-in 0.25s ease both; padding-bottom: 20px; } }
        .ac-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px 14px; border-bottom: 1px solid var(--border-col);
          position: sticky; top: 0; background: var(--bg-card); z-index: 10;
        }
        .ac-modal-body { padding: 18px 20px; }

        /* SKELETON */
        .ac-skeleton {
          background: linear-gradient(90deg, var(--skeleton-bg) 25%, var(--skeleton-hl) 50%, var(--skeleton-bg) 75%);
          background-size: 200% 100%; animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* TOAST */
        .ac-toast { padding: 10px 16px; border-radius: 10px; font-size: 0.82rem; font-weight: 500; animation: toast-in 0.3s ease both; pointer-events: all; backdrop-filter: blur(12px); }
        .ac-toast-success { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; }
        .ac-toast-error   { background: rgba(244,63,94,0.1);  border: 1px solid rgba(244,63,94,0.3);  color: #f87171; }
        .ac-toast-info    { background: var(--accent-light);  border: 1px solid var(--accent-ring);   color: var(--accent); }

        /* EMPTY */
        .ac-empty { text-align: center; padding: 60px 24px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ac-layout">
        {/* Backdrop (mobile) */}
        {sidebarOpen && (
          <div className="ac-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        {/* â”€â”€ SIDEBAR â”€â”€ */}
        <aside className={`ac-sidebar${sidebarOpen ? " open" : ""}${collapsed ? " collapsed" : ""}`}>
          <div className="ac-sidebar-header">
            <div className="ac-sidebar-brand">
              <div className="ac-brand-icon">
                <Shield size={16} color="var(--accent)" />
              </div>
              <div className="ac-brand-text">
                <p className="ac-brand-name">Admin Console</p>
                <p className="ac-brand-sub">SIST Events Hub</p>
              </div>
            </div>
            <button className="ac-collapse-btn" onClick={toggleCollapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <ChevronLeft size={15} style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
          </div>

          {!collapsed && (
            <p className="ac-signed-in">Signed in as <strong>{session?.name}</strong></p>
          )}

          <nav className="ac-sidebar-nav">
            {NAV_ITEMS.map(({ key, label, icon: Icon, desc }) => (
              <button key={key}
                className={`ac-nav-item${tab === key ? " active" : ""}`}
                onClick={() => handleTabChange(key)}
                title={collapsed ? label : undefined}>
                <Icon size={18} className="ac-nav-icon" />
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="ac-nav-label">{label}</p>
                    <p className="ac-nav-desc">{desc}</p>
                  </div>
                )}
              </button>
            ))}
          </nav>

          <div className="ac-sidebar-footer">
            {onLogout && (
              <button className="ac-nav-item ac-signout" onClick={onLogout}
                title={collapsed ? "Sign Out" : undefined}>
                <LogOut size={17} />
                {!collapsed && <span className="ac-nav-label">Sign Out</span>}
              </button>
            )}
          </div>
        </aside>

        {/* â”€â”€ MOBILE TOPBAR â”€â”€ */}
        <div className="ac-topbar">
          <button className="ac-hamburger" onClick={() => setSidebarOpen(p => !p)} aria-label="Toggle menu">
            <Menu size={22} />
          </button>
          <div className="ac-topbar-tabs">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button key={key} className={`ac-topbar-tab${tab === key ? " active" : ""}`}
                onClick={() => setTab(key)}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* â”€â”€ MAIN CONTENT â”€â”€ */}
        <main className="ac-main">
          {tab === "events" && <EventsPanel />}
          {tab === "faculty" && <FacultyPanel />}
        </main>
      </div>

    </>
  );
}
