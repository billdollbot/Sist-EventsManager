/**
 * RegistrationTracker.jsx
 * Faculty view to see all registrations for an event
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { X, Download, Trash2, Users, Search, RefreshCw, ArrowLeft } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RegistrationTracker({ eventId, onClose, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/faculty/events/${eventId}/registrations`);
      setData(res.data);
    } catch {
      showToast?.("Failed to load registrations", "error");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (regId) => {
    setDeleting(regId);
    try {
      await axios.delete(`${API}/api/faculty/events/${eventId}/registrations/${regId}`);
      showToast?.("Registration removed", "info");
      fetchData();
    } catch {
      showToast?.("Failed to remove registration", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = () => {
    window.open(`${API}/api/faculty/events/${eventId}/registrations/export`, "_blank");
  };

  if (loading) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
          <div className="drag-handle" />
          <div className="modal-body" style={{ padding: "40px 20px", textAlign: "center" }}>
            <div className="skeleton" style={{ height: 20, width: "60%", margin: "0 auto 16px" }} />
            <div className="skeleton" style={{ height: 200, borderRadius: "var(--r-md)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { event, registrations } = data;
  const fields = (event.registration_fields || []).map(f => f.label);
  const limit = event.registration_limit || 0;
  const count = event.registration_count || 0;

  // Filter registrations by search
  const filtered = registrations.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return Object.values(r.formData || {}).some(v =>
      String(v).toLowerCase().includes(q)
    );
  });

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button className="btn btn-ghost btn-icon btn-sm tap" onClick={onClose}>
              <ArrowLeft size={16} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h2 className="modal-title truncate" style={{ fontFamily: "var(--ff-display)", fontSize: "0.95rem" }}>
                {event.title}
              </h2>
              <p className="text-xs text-muted" style={{ marginTop: 2 }}>
                Registrations
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon tap" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{
              flex: 1, minWidth: 120, background: "var(--accent-glow)",
              border: "1px solid var(--accent-ring)", borderRadius: "var(--r-md)",
              padding: "14px 16px", textAlign: "center",
            }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
                {count}
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                Registered
              </div>
            </div>
            {limit > 0 && (
              <div style={{
                flex: 1, minWidth: 120, background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)", borderRadius: "var(--r-md)",
                padding: "14px 16px", textAlign: "center",
              }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                  {limit}
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                  Limit
                </div>
              </div>
            )}
            {limit > 0 && (
              <div style={{
                flex: 1, minWidth: 120, background: count >= limit ? "var(--rose-glow)" : "var(--green-glow)",
                border: `1px solid ${count >= limit ? "rgba(251,113,133,0.25)" : "rgba(52,211,153,0.25)"}`,
                borderRadius: "var(--r-md)", padding: "14px 16px", textAlign: "center",
              }}>
                <div style={{
                  fontFamily: "var(--ff-display)", fontSize: "1.6rem", fontWeight: 800,
                  color: count >= limit ? "var(--rose)" : "var(--green)", lineHeight: 1,
                }}>
                  {limit - count > 0 ? limit - count : 0}
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                  Remaining
                </div>
              </div>
            )}
          </div>

          {/* Search + Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                <Search size={15} />
              </span>
              <input
                className="form-input"
                style={{ paddingLeft: 36, minHeight: 40 }}
                placeholder="Search registrations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-ghost btn-sm tap" onClick={fetchData}>
              <RefreshCw size={14} />
            </button>
            {registrations.length > 0 && (
              <button className="btn btn-secondary btn-sm tap" onClick={handleExport}>
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <div className="empty-icon">{search ? "🔍" : "📋"}</div>
              <p className="empty-title">{search ? "No results" : "No registrations yet"}</p>
              <p className="empty-sub">{search ? "Try a different search" : "Students will appear here once they register."}</p>
            </div>
          ) : (
            <div className="reg-table-wrap">
              <table className="reg-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {fields.map(f => <th key={f}>{f}</th>)}
                    <th>Registered</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r._id}>
                      <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</td>
                      {fields.map(f => (
                        <td key={f} title={String(r.formData?.[f] ?? "")}>
                          {String(r.formData?.[f] ?? "—")}
                        </td>
                      ))}
                      <td style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                        {new Date(r.registeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <button
                          className="action-btn action-delete tap"
                          title="Remove registration"
                          onClick={() => handleDelete(r._id)}
                          disabled={deleting === r._id}
                          style={{ width: 30, height: 30 }}
                        >
                          {deleting === r._id ? (
                            <div style={{ width: 12, height: 12, border: "2px solid var(--border-subtle)", borderTopColor: "var(--rose)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
