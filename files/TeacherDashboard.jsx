/**
 * SIST-EVENTS — TeacherDashboard.jsx
 * Faculty admin panel: login, review queue, approve / reject / delete.
 */

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Trash2,
  LogOut,
  RefreshCw,
  Clock,
  Eye,
  Shield,
  CalendarDays,
  MapPin,
  User,
  Tag,
  Link2,
  ChevronRight,
  Inbox,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── Helpers ──────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const CATEGORY_COLOR = {
  Technical: "badge-technical",
  Cultural: "badge-cultural",
  Workshop: "badge-workshop",
  Sports: "badge-sports",
  Seminar: "badge-seminar",
  Hackathon: "badge-hackathon",
  Other: "badge-other",
};

/* ── Toast Hook ───────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

/* ── Event Detail Modal ───────────────────────── */
function EventDetailModal({ event, onClose, onApprove, onReject, actionLoading }) {
  if (!event) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 600 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily: "var(--ff-display)" }}>
            Event Details
          </h2>
          <button
            className="btn btn-ghost btn-icon touch-shrink"
            onClick={onClose}
          >
            <XCircle size={18} />
          </button>
        </div>

        {event.brochure_path && (
          <img
            src={`${API}${event.brochure_path}`}
            alt="Brochure"
            style={{ width: "100%", maxHeight: 220, objectFit: "cover" }}
          />
        )}

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}
          >
            <h3
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: "1.3rem",
                fontWeight: 800,
                flex: 1,
              }}
            >
              {event.title}
            </h3>
            <span className={`badge ${CATEGORY_COLOR[event.category] || "badge-other"}`}>
              {event.category}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {[
              { icon: User, label: "Organizer", val: event.organizer },
              { icon: MapPin, label: "Location", val: event.location },
              { icon: CalendarDays, label: "Date", val: fmtDate(event.event_date) },
              { icon: User, label: "Submitted by", val: event.created_by },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label}>
                <p
                  className="text-xs text-muted"
                  style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}
                >
                  <Icon size={11} /> {label}
                </p>
                <p style={{ fontSize: "0.88rem", fontWeight: 500 }}>{val}</p>
              </div>
            ))}
          </div>

          <div>
            <p
              className="text-xs text-muted"
              style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}
            >
              <Tag size={11} /> Description
            </p>
            <p style={{ fontSize: "0.88rem", color: "var(--c-text)", lineHeight: 1.7 }}>
              {event.description}
            </p>
          </div>

          {event.registration_link && (
            <a
              href={event.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary touch-shrink"
              style={{ width: "100%" }}
            >
              <Link2 size={15} /> View Registration Link
            </a>
          )}

          {event.status === "pending" && (
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                className={`btn btn-success touch-shrink ${actionLoading === event._id + "approved" ? "btn-loading" : ""}`}
                style={{ flex: 1 }}
                onClick={() => onApprove(event._id)}
                disabled={!!actionLoading}
              >
                {!actionLoading && <><CheckCircle size={16} /> Approve</>}
              </button>
              <button
                className={`btn btn-danger touch-shrink ${actionLoading === event._id + "rejected" ? "btn-loading" : ""}`}
                style={{ flex: 1 }}
                onClick={() => onReject(event._id)}
                disabled={!!actionLoading}
              >
                {!actionLoading && <><XCircle size={16} /> Reject</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Faculty Login Form ───────────────────────── */
function FacultyLogin({ onLogin }) {
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!creds.username || !creds.password) {
      setError("Both fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/api/auth/faculty-login`, creds);
      onLogin(res.data.faculty);
    } catch (e) {
      setError(e.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="login-card animate-fade-scale">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "var(--r-md)",
              background: "var(--c-amber-glow)",
              border: "1px solid rgba(245,158,11,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Shield size={28} color="var(--c-amber)" />
          </div>
          <h1
            className="login-logo"
            style={{ fontSize: "1.5rem", marginBottom: 6 }}
          >
            Faculty Portal
          </h1>
          <p className="text-muted text-sm">
            Sign in to review and manage event submissions.
          </p>
        </div>

        {error && (
          <div
            className="toast toast-error"
            style={{ position: "static", animation: "none", maxWidth: "100%", marginBottom: 16 }}
          >
            <XCircle size={15} /> {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              placeholder="Enter username"
              value={creds.username}
              onChange={(e) => setCreds((c) => ({ ...c, username: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={creds.password}
              onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoComplete="current-password"
            />
          </div>
          <button
            className={`btn btn-primary btn-lg touch-shrink ${loading ? "btn-loading" : ""}`}
            style={{ width: "100%", marginTop: 8 }}
            onClick={submit}
            disabled={loading}
          >
            {!loading && <>Sign In <ChevronRight size={17} /></>}
          </button>
        </div>

        <p
          className="text-xs text-muted"
          style={{ textAlign: "center", marginTop: 20 }}
        >
          Default: <strong style={{ color: "var(--c-amber)" }}>admin</strong> /{" "}
          <strong style={{ color: "var(--c-amber)" }}>sist2024</strong>
        </p>
      </div>
    </div>
  );
}

/* ── Queue Item Card ──────────────────────────── */
function QueueCard({ event, onApprove, onReject, onDelete, onView, actionLoading }) {
  const isActing = actionLoading?.startsWith(event._id);
  return (
    <div className="queue-item animate-fade-in">
      <div style={{ minWidth: 0 }}>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <span className={`badge ${CATEGORY_COLOR[event.category] || "badge-other"}`}>
            {event.category}
          </span>
          <span className={`badge badge-${event.status}`}>
            {event.status === "pending" && <Clock size={10} />}
            {event.status === "approved" && <CheckCircle size={10} />}
            {event.status === "rejected" && <XCircle size={10} />}
            {event.status}
          </span>
        </div>

        {/* Title */}
        <h3
          className="truncate"
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          {event.title}
        </h3>

        {/* Meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            className="text-xs text-muted"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <User size={11} /> {event.organizer} · {event.created_by}
          </span>
          <span
            className="text-xs text-muted"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <CalendarDays size={11} /> {fmtDate(event.event_date)}
          </span>
          <span
            className="text-xs text-muted"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <MapPin size={11} /> {event.location}
          </span>
        </div>
      </div>

      {/* Action column */}
      <div className="queue-actions">
        <button
          className="btn btn-ghost btn-icon btn-sm touch-shrink"
          onClick={() => onView(event)}
          title="View Details"
        >
          <Eye size={16} />
        </button>

        {event.status === "pending" && (
          <>
            <button
              className={`btn btn-success btn-icon btn-sm touch-shrink ${actionLoading === event._id + "approved" ? "btn-loading" : ""}`}
              onClick={() => onApprove(event._id)}
              disabled={isActing}
              title="Approve"
            >
              {actionLoading !== event._id + "approved" && <CheckCircle size={16} />}
            </button>
            <button
              className={`btn btn-danger btn-icon btn-sm touch-shrink ${actionLoading === event._id + "rejected" ? "btn-loading" : ""}`}
              onClick={() => onReject(event._id)}
              disabled={isActing}
              title="Reject"
            >
              {actionLoading !== event._id + "rejected" && <XCircle size={16} />}
            </button>
          </>
        )}

        <button
          className={`btn btn-danger btn-icon btn-sm touch-shrink ${actionLoading === event._id + "delete" ? "btn-loading" : ""}`}
          onClick={() => onDelete(event._id)}
          disabled={isActing}
          title="Delete"
        >
          {actionLoading !== event._id + "delete" && <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
══════════════════════════════════════════════════ */
export default function TeacherDashboard({ onLogout: parentLogout }) {
  const [faculty, setFaculty] = useState(null);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("pending"); // pending | approved | rejected | all
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const { toasts, show } = useToast();

  // ── Fetch events ─────────────────────────────────
  const fetchEvents = useCallback(
    async (statusFilter = tab) => {
      setLoading(true);
      try {
        const param = statusFilter === "all" ? "" : `?status=${statusFilter}`;
        const res = await axios.get(`${API}/api/admin/events${param}`);
        setEvents(res.data);
      } catch {
        show("Failed to fetch events.", "error");
      } finally {
        setLoading(false);
      }
    },
    [tab, show]
  );

  useEffect(() => {
    if (faculty) fetchEvents(tab);
  }, [faculty, tab]);

  // ── Actions ──────────────────────────────────────
  const updateStatus = async (id, status) => {
    setActionLoading(id + status);
    try {
      await axios.patch(`${API}/api/admin/events/${id}/status`, { status });
      show(
        status === "approved" ? "Event approved! 🎉" : "Event rejected.",
        status === "approved" ? "success" : "error"
      );
      setDetailEvent(null);
      fetchEvents(tab);
    } catch {
      show("Action failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteEvent = async (id) => {
    if (!confirm("Permanently delete this event?")) return;
    setActionLoading(id + "delete");
    try {
      await axios.delete(`${API}/api/admin/events/${id}`);
      show("Event deleted.", "info");
      if (detailEvent?._id === id) setDetailEvent(null);
      fetchEvents(tab);
    } catch {
      show("Delete failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Tab counts ───────────────────────────────────
  const pending = events.filter((e) => e.status === "pending").length;

  const TABS = [
    { key: "pending",  label: "Queue",    icon: Clock },
    { key: "approved", label: "Live",     icon: CheckCircle },
    { key: "rejected", label: "Rejected", icon: XCircle },
    { key: "all",      label: "All",      icon: Inbox },
  ];

  // ── Render: Login ────────────────────────────────
  if (!faculty) return <FacultyLogin onLogin={setFaculty} />;

  // ── Render: Dashboard ────────────────────────────
  return (
    <div className="page" style={{ position: "relative", zIndex: 1 }}>
      {/* Toast stack */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" && <CheckCircle size={16} />}
            {t.type === "error" && <XCircle size={16} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onApprove={(id) => updateStatus(id, "approved")}
          onReject={(id) => updateStatus(id, "rejected")}
          actionLoading={actionLoading}
        />
      )}

      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <Shield size={18} color="var(--c-amber)" />
              <span className="text-xs text-amber" style={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Admin Panel
              </span>
            </div>
            <h1
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: "clamp(1.4rem, 4vw, 2rem)",
                fontWeight: 800,
              }}
            >
              Welcome, {faculty.name || faculty.username}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-icon touch-shrink"
              onClick={() => fetchEvents(tab)}
              title="Refresh"
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>
            <button
              className="btn btn-secondary touch-shrink"
              onClick={() => { setFaculty(null); parentLogout?.(); }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            { label: "Pending Review", val: pending, color: "var(--c-amber)" },
            {
              label: "Approved",
              val: events.filter((e) => e.status === "approved").length,
              color: "var(--c-teal)",
            },
            {
              label: "Rejected",
              val: events.filter((e) => e.status === "rejected").length,
              color: "var(--c-rose)",
            },
          ].map(({ label, val, color }) => (
            <div
              key={label}
              style={{
                background: "var(--c-navy-card)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--r-md)",
                padding: "14px 18px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  color,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {val}
              </p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="dashboard-tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`dashboard-tab touch-shrink ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              <Icon size={14} />
              <span className="hide-xs">{label}</span>
              {key === "pending" && pending > 0 && (
                <span className="count-bubble">{pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* Events list */}
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 110, borderRadius: "var(--r-md)" }}
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {tab === "pending" ? "📥" : tab === "approved" ? "✅" : tab === "rejected" ? "❌" : "📋"}
            </div>
            <p className="empty-title">Nothing here yet</p>
            <p className="empty-sub">
              {tab === "pending"
                ? "No events awaiting review."
                : `No ${tab} events found.`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map((ev) => (
              <QueueCard
                key={ev._id}
                event={ev}
                onApprove={(id) => updateStatus(id, "approved")}
                onReject={(id) => updateStatus(id, "rejected")}
                onDelete={deleteEvent}
                onView={setDetailEvent}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Spin animation for refresh icon */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
