/**
 * RegistrationModal.jsx
 * Student-facing dynamic registration form modal
 */
import { useState } from "react";
import axios from "axios";
import { X, CheckCircle, Users, AlertCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RegistrationModal({ event, onClose, onSuccess }) {
  const [formData, setFormData] = useState(() => {
    const init = {};
    (event.registration_fields || []).forEach(f => { init[f.label] = ""; });
    return init;
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const limit = event.registration_limit || 0;
  const count = event.registration_count || 0;
  const isFull = limit > 0 && count >= limit;

  const handleChange = (label, value) => {
    setFormData(prev => ({ ...prev, [label]: value }));
    setErrors(prev => ({ ...prev, [label]: "" }));
    setGlobalError("");
  };

  const validate = () => {
    const errs = {};
    (event.registration_fields || []).forEach(f => {
      const val = formData[f.label];
      if (f.required && (!val || String(val).trim() === "")) {
        errs[f.label] = `${f.label} is required`;
      }
      if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errs[f.label] = "Enter a valid email";
      }
      if (f.type === "number" && val && isNaN(Number(val))) {
        errs[f.label] = "Must be a number";
      }
      if (f.type === "tel" && val && !/^\+?[\d\s-]{7,15}$/.test(val)) {
        errs[f.label] = "Enter a valid phone number";
      }
    });
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setGlobalError("");
    try {
      await axios.post(`${API}/api/events/${event._id}/register`, { formData });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success Screen ──────────────────────────── */
  if (submitted) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="drag-handle" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "52px 32px", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "var(--green-glow)", border: "1px solid rgba(52,211,153,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle size={36} color="var(--green)" />
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--ff-display)", fontSize: "1.3rem", marginBottom: 8 }}>
                Registered Successfully!
              </h3>
              <p className="text-muted text-sm">
                You're registered for <strong style={{ color: "var(--text-primary)" }}>{event.title}</strong>.
                See you there! 🎉
              </p>
            </div>
            <button className="btn btn-primary tap" onClick={onClose} style={{ marginTop: 8 }}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Registration Full Screen ────────────────── */
  if (isFull) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="drag-handle" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "52px 32px", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "var(--rose-glow)", border: "1px solid rgba(251,113,133,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertCircle size={36} color="var(--rose)" />
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--ff-display)", fontSize: "1.3rem", marginBottom: 8 }}>
                Registration Full
              </h3>
              <p className="text-muted text-sm">
                This event has reached its maximum capacity of <strong style={{ color: "var(--text-primary)" }}>{limit}</strong> registrations.
              </p>
            </div>
            <button className="btn btn-ghost tap" onClick={onClose} style={{ marginTop: 8 }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ────────────────────────────────────── */
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily: "var(--ff-display)" }}>
            📝 Register — {event.title}
          </h2>
          <button className="btn btn-ghost btn-icon tap" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Capacity info */}
          {limit > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: "var(--accent-glow)", border: "1px solid var(--accent-ring)",
              borderRadius: "var(--r-sm)", fontSize: "0.82rem",
            }}>
              <Users size={15} color="var(--accent)" />
              <span style={{ color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--accent)" }}>{count}</strong> / {limit} registered
              </span>
              <div style={{
                flex: 1, height: 4, borderRadius: 2,
                background: "var(--border-subtle)", overflow: "hidden", marginLeft: 8,
              }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: "var(--accent)",
                  width: `${Math.min((count / limit) * 100, 100)}%`,
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          )}

          {/* Global error */}
          {globalError && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 13px",
              background: "var(--rose-glow)", border: "1px solid rgba(251,113,133,0.3)",
              borderRadius: "var(--r-sm)", fontSize: "0.8rem", color: "var(--rose)",
            }}>
              <AlertCircle size={14} /> {globalError}
            </div>
          )}

          {/* Dynamic fields */}
          {(event.registration_fields || []).map(field => (
            <div className="form-group" key={field._id || field.label}>
              <label className="form-label">
                {field.label} {field.required && <span style={{ color: "var(--rose)" }}>*</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  className="form-textarea"
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  value={formData[field.label] || ""}
                  onChange={e => handleChange(field.label, e.target.value)}
                  style={{ minHeight: 80 }}
                />
              ) : field.type === "select" ? (
                <select
                  className="form-select"
                  value={formData[field.label] || ""}
                  onChange={e => handleChange(field.label, e.target.value)}
                >
                  <option value="">Select {field.label.toLowerCase()}…</option>
                  {(field.options || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="form-input"
                  type={field.type === "tel" ? "tel" : field.type || "text"}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  value={formData[field.label] || ""}
                  onChange={e => handleChange(field.label, e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              )}

              {errors[field.label] && (
                <p className="form-error"><X size={11} /> {errors[field.label]}</p>
              )}
            </div>
          ))}

          {/* Submit */}
          <button
            className={`btn btn-primary btn-lg tap w-full ${submitting ? "btn-loading" : ""}`}
            style={{ marginTop: 4 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {!submitting && "Register Now →"}
          </button>
        </div>
      </div>
    </div>
  );
}
