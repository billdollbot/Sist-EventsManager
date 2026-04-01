/**
 * SIST-EVENTS — HostEvent.jsx
 * Event proposal form with brochure image upload.
 */

import { useState, useRef } from "react";
import axios from "axios";
import {
  X,
  Calendar,
  MapPin,
  User,
  Link2,
  Image,
  AlignLeft,
  Tag,
  ChevronDown,
  CheckCircle,
  UploadCloud,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORIES = [
  "Technical",
  "Cultural",
  "Workshop",
  "Sports",
  "Seminar",
  "Hackathon",
  "Other",
];

const CATEGORY_EMOJI = {
  Technical: "⚙️",
  Cultural: "🎭",
  Workshop: "🛠️",
  Sports: "🏆",
  Seminar: "📚",
  Hackathon: "💻",
  Other: "✨",
};

// ── Small helper components ───────────────────────

const FieldRow = ({ label, icon: Icon, children, error }) => (
  <div className="form-group">
    <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {Icon && <Icon size={13} />}
      {label}
    </label>
    {children}
    {error && (
      <p className="form-error">
        <X size={12} /> {error}
      </p>
    )}
  </div>
);

// ── Main Component ────────────────────────────────

export default function HostEvent({ onClose, guestName, onSuccess }) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    category: "",
    organizer: guestName || "",
    event_date: "",
    location: "",
    registration_link: "",
    description: "",
  });

  const [brochure, setBrochure] = useState(null);
  const [brochurePreview, setBrochurePreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Validation ──────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.category) e.category = "Please pick a category.";
    if (!form.organizer.trim()) e.organizer = "Organizer name required.";
    if (!form.event_date) e.event_date = "Event date is required.";
    else if (new Date(form.event_date) < new Date())
      e.event_date = "Date must be in the future.";
    if (!form.location.trim()) e.location = "Location is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (
      form.registration_link &&
      !/^https?:\/\/.+/.test(form.registration_link)
    )
      e.registration_link = "Must start with http:// or https://";
    return e;
  };

  // ── Handlers ────────────────────────────────────
  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        brochure: "Only image files allowed (JPEG, PNG, GIF, WebP).",
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, brochure: "Max file size is 5 MB." }));
      return;
    }
    setBrochure(file);
    setBrochurePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, brochure: null }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setBrochure(null);
    if (brochurePreview) URL.revokeObjectURL(brochurePreview);
    setBrochurePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) data.append(k, v);
    });
    data.append("created_by", guestName || "Anonymous");
    if (brochure) data.append("brochure", brochure);

    setSubmitting(true);
    try {
      await axios.post(`${API}/api/events`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 2200);
    } catch (err) {
      setErrors({
        global: err.response?.data?.message || "Submission failed. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ───────────────────────────────
  if (submitted) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="drag-handle" />
          <div
            className="flex-center"
            style={{ flexDirection: "column", gap: 16, padding: "52px 32px" }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(52,211,153,0.14)",
                border: "1px solid rgba(52,211,153,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pop-in 0.5s cubic-bezier(0.34,1.7,0.64,1)",
              }}
            >
              <CheckCircle size={36} color="var(--c-teal)" />
            </div>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--ff-display)", fontSize: "1.3rem", marginBottom: 8 }}>
                Event Submitted!
              </h3>
              <p className="text-muted text-sm">
                Your event is now in the review queue. Faculty will approve it
                shortly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ────────────────────────────────────
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="drag-handle" />

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily: "var(--ff-display)" }}>
            ✦ Host an Event
          </h2>
          <button
            className="btn btn-ghost btn-icon touch-shrink"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Global error */}
          {errors.global && (
            <div
              className="toast toast-error"
              style={{ position: "static", animation: "none", maxWidth: "100%" }}
            >
              <X size={16} /> {errors.global}
            </div>
          )}

          {/* Title */}
          <FieldRow label="Event Title" icon={Tag} error={errors.title}>
            <input
              className="form-input"
              placeholder="e.g. Technovation 2025"
              value={form.title}
              onChange={set("title")}
              maxLength={120}
            />
          </FieldRow>

          {/* Category */}
          <FieldRow label="Category" icon={Tag} error={errors.category}>
            <div style={{ position: "relative" }}>
              <select
                className="form-select"
                value={form.category}
                onChange={set("category")}
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_EMOJI[c]} {c}
                  </option>
                ))}
              </select>
            </div>
          </FieldRow>

          {/* Organizer */}
          <FieldRow label="Organizer / Club" icon={User} error={errors.organizer}>
            <input
              className="form-input"
              placeholder="Department or club name"
              value={form.organizer}
              onChange={set("organizer")}
            />
          </FieldRow>

          {/* Date + Location — side-by-side on wider screens */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <FieldRow label="Event Date" icon={Calendar} error={errors.event_date}>
              <input
                className="form-input"
                type="datetime-local"
                value={form.event_date}
                onChange={set("event_date")}
                style={{ colorScheme: "dark" }}
              />
            </FieldRow>

            <FieldRow label="Location / Venue" icon={MapPin} error={errors.location}>
              <input
                className="form-input"
                placeholder="Hall / Lab / Online"
                value={form.location}
                onChange={set("location")}
              />
            </FieldRow>
          </div>

          {/* Description */}
          <FieldRow label="Description" icon={AlignLeft} error={errors.description}>
            <textarea
              className="form-textarea"
              placeholder="Tell us about the event — what to expect, who should attend…"
              value={form.description}
              onChange={set("description")}
              maxLength={1000}
            />
            <span
              className="text-xs text-muted"
              style={{ textAlign: "right" }}
            >
              {form.description.length}/1000
            </span>
          </FieldRow>

          {/* Registration Link */}
          <FieldRow
            label="Registration Link (optional)"
            icon={Link2}
            error={errors.registration_link}
          >
            <input
              className="form-input"
              type="url"
              placeholder="https://forms.google.com/…"
              value={form.registration_link}
              onChange={set("registration_link")}
            />
          </FieldRow>

          {/* Brochure / Poster Upload */}
          <FieldRow
            label="Brochure / Poster Image (optional)"
            icon={Image}
            error={errors.brochure}
          >
            {brochurePreview ? (
              <div style={{ position: "relative" }}>
                <img
                  src={brochurePreview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--c-border)",
                  }}
                />
                <button
                  className="btn btn-danger btn-icon touch-shrink"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    borderRadius: "50%",
                  }}
                  onClick={removeFile}
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
                <p className="text-xs text-muted mt-8">
                  📎 {brochure?.name}
                </p>
              </div>
            ) : (
              <div
                className={`upload-zone ${dragging ? "drag-over" : ""}`}
                style={{ position: "relative" }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <UploadCloud
                  size={32}
                  color="var(--c-muted)"
                  style={{ margin: "0 auto 10px" }}
                />
                <p style={{ color: "var(--c-muted)", fontSize: "0.88rem" }}>
                  Drag & drop or{" "}
                  <span style={{ color: "var(--c-amber)", fontWeight: 600 }}>
                    browse
                  </span>
                </p>
                <p className="text-xs text-muted mt-8">
                  JPEG, PNG, GIF, WebP — max 5 MB
                </p>
              </div>
            )}
          </FieldRow>

          {/* Submit */}
          <button
            className={`btn btn-primary btn-lg touch-shrink ${
              submitting ? "btn-loading" : ""
            }`}
            style={{ width: "100%", marginTop: 4 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {!submitting && "Submit for Review →"}
          </button>

          <p
            className="text-xs text-muted"
            style={{ textAlign: "center", marginTop: -8 }}
          >
            Your event will be visible after faculty approval.
          </p>
        </div>
      </div>
    </div>
  );
}
