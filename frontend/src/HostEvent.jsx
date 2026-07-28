/**
 * HostEvent.jsx v5 — Form builder for custom registration fields
 */
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  X, Calendar, MapPin, User, Link2, Image,
  AlignLeft, Tag, CheckCircle, UploadCloud, Users,
  Plus, Trash2, GripVertical, Hash,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CATEGORIES = ["Technical", "Cultural", "Workshop", "Sports", "Seminar", "Hackathon", "Other"];
const EMOJI = { Technical: "⚙️", Cultural: "🎭", Workshop: "🛠️", Sports: "🏆", Seminar: "📚", Hackathon: "💻", Other: "✨" };
const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "tel", label: "Phone" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
];

function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{Icon && <Icon size={12} />} {label}</label>
      {children}
      {error && <p className="form-error"><X size={11} /> {error}</p>}
    </div>
  );
}

/* ── Form Field Builder ────────────────────────── */
function FieldBuilder({ fields, onChange }) {
  const addField = () => {
    onChange([...fields, { label: "", type: "text", required: true, placeholder: "", options: [] }]);
  };

  const updateField = (index, key, value) => {
    const updated = fields.map((f, i) => i === index ? { ...f, [key]: value } : f);
    onChange(updated);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addOption = (index) => {
    const updated = fields.map((f, i) => {
      if (i !== index) return f;
      return { ...f, options: [...(f.options || []), ""] };
    });
    onChange(updated);
  };

  const updateOption = (fieldIndex, optIndex, value) => {
    const updated = fields.map((f, i) => {
      if (i !== fieldIndex) return f;
      const opts = [...(f.options || [])];
      opts[optIndex] = value;
      return { ...f, options: opts };
    });
    onChange(updated);
  };

  const removeOption = (fieldIndex, optIndex) => {
    const updated = fields.map((f, i) => {
      if (i !== fieldIndex) return f;
      return { ...f, options: (f.options || []).filter((_, j) => j !== optIndex) };
    });
    onChange(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {fields.map((field, i) => (
        <div className="field-builder-item" key={i}>
          <div className="field-builder-row">
            <input
              className="form-input"
              style={{ flex: 2 }}
              placeholder="Field label (e.g. Full Name)"
              value={field.label}
              onChange={e => updateField(i, "label", e.target.value)}
            />
            <select
              className="form-select"
              style={{ flex: 1, minWidth: 110 }}
              value={field.type}
              onChange={e => updateField(i, "type", e.target.value)}
            >
              {FIELD_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button
              className="action-btn action-delete tap"
              onClick={() => removeField(i)}
              title="Remove field"
              style={{ flexShrink: 0 }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="field-builder-row">
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Placeholder text (optional)"
              value={field.placeholder}
              onChange={e => updateField(i, "placeholder", e.target.value)}
            />
            <label className="req-toggle">
              <input
                type="checkbox"
                checked={field.required}
                onChange={e => updateField(i, "required", e.target.checked)}
              />
              Required
            </label>
          </div>

          {/* Options for select type */}
          {field.type === "select" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 4 }}>
              <span className="text-xs text-muted" style={{ fontWeight: 600 }}>Dropdown Options:</span>
              <div className="field-builder-options">
                {(field.options || []).map((opt, j) => (
                  <div key={j} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <input
                      className="form-input"
                      style={{ minHeight: 34, padding: "4px 10px", fontSize: "0.82rem", width: 140 }}
                      placeholder={`Option ${j + 1}`}
                      value={opt}
                      onChange={e => updateOption(i, j, e.target.value)}
                    />
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 2 }}
                      onClick={() => removeOption(i, j)}
                      title="Remove option"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-ghost btn-sm tap"
                style={{ alignSelf: "flex-start" }}
                onClick={() => addOption(i)}
              >
                <Plus size={12} /> Add Option
              </button>
            </div>
          )}
        </div>
      ))}

      <button className="btn btn-secondary tap" onClick={addField} style={{ alignSelf: "flex-start" }}>
        <Plus size={14} /> Add Field
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════ */
export default function HostEvent({ onClose, session, onSuccess }) {
  const fileRef = useRef(null);
  const [clubs, setClubs] = useState([]);

  const [form, setForm] = useState({
    title: "", category: "", club: "", organizer: session?.name || "",
    event_date: "", location: "", description: "",
  });
  const [regMode, setRegMode] = useState("form"); // "form" | "link"
  const [registrationLink, setRegistrationLink] = useState("");
  const [registrationFields, setRegistrationFields] = useState([
    { label: "Full Name", type: "text", required: true, placeholder: "Enter your full name", options: [] },
    { label: "Email", type: "email", required: true, placeholder: "your@email.com", options: [] },
    { label: "Register Number", type: "text", required: true, placeholder: "e.g. 41234567", options: [] },
  ]);
  const [registrationLimit, setRegistrationLimit] = useState("");

  const [brochure, setBrochure] = useState(null);
  const [brochurePreview, setBrochurePreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* Fetch clubs on mount */
  useEffect(() => {
    axios.get(`${API}/api/clubs`)
      .then(() => {
        setClubs([
          { _id: "1", name: "AI WIZARDS CLUB" },
          { _id: "2", name: "ANTI-HUMAN TRAFFICKING CLUB" },
          { _id: "3", name: "ART CLUB" },
          { _id: "4", name: "AERO CLUB" },
          { _id: "5", name: "AUTO CLUB" },
          { _id: "6", name: "BOOK CLUB" },
          { _id: "7", name: "CATALYST CLUB" },
          { _id: "8", name: "CHESS CLUB" },
          { _id: "9", name: "CODING CLUB" },
          { _id: "10", name: "COGNITIVE CLUB" },
          { _id: "11", name: "COMMUNITY DEVELOPMENT CLUB" },
          { _id: "12", name: "COMPUTER SCIENCE CLUB" },
          { _id: "13", name: "COMPILEX CLUB" },
          { _id: "14", name: "CYBER SECURITY CLUB" },
          { _id: "15", name: "DANCE CLUB" },
          { _id: "16", name: "DATA SCIENCE AND ANALYTICS CLUB" },
          { _id: "17", name: "DEBATE CLUB" },
          { _id: "18", name: "DESIGN CLUB" },
          { _id: "19", name: "Dr. KALAM CLUB" },
          { _id: "20", name: "ECO CLUB" },
          { _id: "21", name: "ENGLISH LITERARY CLUB" },
          { _id: "22", name: "ENTREPRENEURSHIP DEVELOPMENT CLUB" },
          { _id: "23", name: "NEXUS CLUB" },
          { _id: "24", name: "FASHION CLUB" },
          { _id: "25", name: "FINANCIAL MANAGEMENT AND ECONOMIC ANALYSIS CLUB" },
          { _id: "26", name: "FITNESS AND NUTRITION CLUB" },
          { _id: "27", name: "GAMING CLUB" },
          { _id: "28", name: "DEVELOPER STUDENT CLUB" },
          { _id: "29", name: "HACK CLUB" },
          { _id: "30", name: "HARDWARE CLUB" },
          { _id: "31", name: "IIOT CLUB" },
          { _id: "32", name: "INNOVATION CLUB" },
          { _id: "33", name: "MATHEMATICS CLUB" },
          { _id: "34", name: "MECHATRONICS CLUB" },
          { _id: "35", name: "MEDIA CLUB" },
          { _id: "36", name: "MOVIE AND DRAMATICS CLUB" },
          { _id: "37", name: "MICROSOFT CLUB" },
          { _id: "38", name: "MUSIC CLUB" },
          { _id: "39", name: "NDLI SIST CLUB" },
          { _id: "40", name: "POETRY CLUB" },
          { _id: "41", name: "PHARMACY JOURNAL CLUB" },
          { _id: "42", name: "PHILOSOPHY CLUB" },
          { _id: "43", name: "ROBOTICS CLUB" },
          { _id: "44", name: "ROTARACT CLUB" },
          { _id: "45", name: "SCIENCE CLUB" },
          { _id: "46", name: "SOFT SKILLS CLUB" },
          { _id: "47", name: "SPORTS CLUB" },
          { _id: "48", name: "Silambam Club" },
          { _id: "49", name: "TOURISM CLUB" },
          { _id: "50", name: "Wings of Welfare Club" },
          { _id: "51", name: "TAMIL CLUB" },
          { _id: "52", name: "T&T - Trace and Test club, Forensic and Chemistry Club" },
          { _id: "53", name: "Beyond Barriers Club" },
          { _id: "54", name: "Market Masters - Brand Sphere Club" },
          { _id: "55", name: "Software Development Club" },
          { _id: "56", name: "XR - XPLoR" },
          { _id: "57", name: "Startup Spark Club" },
          { _id: "58", name: "Campus CareConnect Club" },
          { _id: "59", name: "Smile Squad Outreach Club" },
          { _id: "60", name: "MATLAB student Lounge Club" },
          { _id: "61", name: "EV Club" },
          { _id: "62", name: "Breath and Balance (Yoga), Yoga and Holistic Science Club" },
          { _id: "63", name: "Sustainable Development Club" },
          { _id: "64", name: "Disaster Management Club" },
          { _id: "65", name: "RISE Club" },
          { _id: "66", name: "Visual Art Club" },
          { _id: "67", name: "Public Speaking Club" },
          { _id: "68", name: "Podcast Club" }
        ]);
      })
      .catch(() => console.log("Error fetching clubs"));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.category) e.category = "Please select a category.";
    if (!form.club) e.club = "Please select a hosting club.";
    if (!form.organizer.trim()) e.organizer = "Organizer name is required.";
    if (!form.event_date) e.event_date = "Event date is required.";
    else if (new Date(form.event_date) < new Date()) e.event_date = "Date must be in the future.";
    if (!form.location.trim()) e.location = "Location is required.";
    if (!form.description.trim()) e.description = "Description is required.";

    // Registration validation
    if (regMode === "link") {
      if (!registrationLink.trim()) {
        e.registration_link = "Registration link is required.";
      } else if (!/^https?:\/\/.+/.test(registrationLink)) {
        e.registration_link = "Must start with http:// or https://";
      }
    } else {
      // Form mode — must have at least one field
      if (registrationFields.length === 0) {
        e.registration_fields = "Add at least one registration field.";
      } else {
        const emptyLabels = registrationFields.some(f => !f.label.trim());
        if (emptyLabels) e.registration_fields = "All fields must have a label.";
        const selectWithoutOptions = registrationFields.some(
          f => f.type === "select" && (!f.options || f.options.filter(o => o.trim()).length < 2)
        );
        if (selectWithoutOptions) e.registration_fields = "Dropdown fields need at least 2 options.";
      }
    }
    return e;
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFile = file => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErrors(p => ({ ...p, brochure: "Images only." })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, brochure: "Max 5 MB." })); return; }
    setBrochure(file);
    setBrochurePreview(URL.createObjectURL(file));
    setErrors(p => ({ ...p, brochure: null }));
  };

  const handleSubmit = async () => {
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) data.append(k, v); });
    data.append("faculty_id", session?.id || "");
    data.append("faculty_name", session?.name || "Faculty");

    if (regMode === "link") {
      data.append("registration_link", registrationLink);
    } else {
      // Clean options — remove empty strings
      const cleanFields = registrationFields.map(f => ({
        ...f,
        options: f.type === "select" ? (f.options || []).filter(o => o.trim()) : [],
      }));
      data.append("registration_fields", JSON.stringify(cleanFields));
      if (registrationLimit) {
        data.append("registration_limit", registrationLimit);
      }
    }

    if (brochure) data.append("brochure", brochure);
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/faculty/events`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 2200);
    } catch (err) {
      setErrors({ global: err.response?.data?.message || "Submission failed." });
    } finally { setSubmitting(false); }
  };

  /* Success screen */
  if (submitted) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="drag-handle" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "52px 32px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--teal-glow)", border: "1px solid rgba(45,212,191,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={36} color="var(--teal)" />
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--ff-display)", fontSize: "1.3rem", marginBottom: 8 }}>Event Submitted!</h3>
              <p className="text-muted text-sm">Pending admin review. It'll go live once approved.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily: "var(--ff-display)" }}>✦ Create Event</h2>
          <button className="btn btn-ghost btn-icon tap" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {errors.global && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", background: "var(--rose-glow)", border: "1px solid rgba(251,113,133,0.3)", borderRadius: "var(--r-sm)", fontSize: "0.8rem", color: "var(--rose)" }}>
              <X size={13} /> {errors.global}
            </div>
          )}

          {/* Title */}
          <Field label="Event Title" icon={Tag} error={errors.title}>
            <input className="form-input" placeholder="e.g. Technovation 2025"
              value={form.title} onChange={set("title")} maxLength={120} />
          </Field>

          {/* Category + Club */}
          <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Category" icon={Tag} error={errors.category}>
              <select className="form-select" value={form.category} onChange={set("category")}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{EMOJI[c]} {c}</option>)}
              </select>
            </Field>
            <Field label="Hosting Club / Dept" icon={Users} error={errors.club}>
              <select className="form-select" value={form.club} onChange={set("club")}>
                <option value="">Select club…</option>
                {clubs.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Organizer */}
          <Field label="Organizer / Coordinator" icon={User} error={errors.organizer}>
            <input className="form-input" placeholder="Faculty / student coordinator name"
              value={form.organizer} onChange={set("organizer")} />
          </Field>

          {/* Date + Venue */}
          <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Event Date & Time" icon={Calendar} error={errors.event_date}>
              <input className="form-input" type="datetime-local"
                value={form.event_date} onChange={set("event_date")}
                style={{ colorScheme: "inherit" }} />
            </Field>
            <Field label="Venue" icon={MapPin} error={errors.location}>
              <input className="form-input" placeholder="Hall / Lab / Online"
                value={form.location} onChange={set("location")} />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description" icon={AlignLeft} error={errors.description}>
            <textarea className="form-textarea"
              placeholder="What to expect, who should attend…"
              value={form.description} onChange={set("description")} maxLength={1000} />
            <span className="text-xs text-muted" style={{ textAlign: "right" }}>
              {form.description.length}/1000
            </span>
          </Field>

          {/* ── Registration Section ──────────────── */}
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: "var(--r-md)", padding: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <label className="form-label" style={{ margin: 0 }}>
                <Users size={12} /> Registration Method
              </label>
            </div>

            {/* Mode toggle */}
            <div className="dash-tabs" style={{ marginBottom: 16 }}>
              <button
                className={`dash-tab tap ${regMode === "form" ? "active" : ""}`}
                onClick={() => setRegMode("form")}
                type="button"
              >
                📝 Build Form
              </button>
              <button
                className={`dash-tab tap ${regMode === "link" ? "active" : ""}`}
                onClick={() => setRegMode("link")}
                type="button"
              >
                🔗 External Link
              </button>
            </div>

            {regMode === "link" ? (
              /* External link mode */
              <Field label="Registration Link" icon={Link2} error={errors.registration_link}>
                <input className="form-input" type="url" placeholder="https://forms.google.com/…"
                  value={registrationLink} onChange={e => setRegistrationLink(e.target.value)} />
              </Field>
            ) : (
              /* Form builder mode */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                  Build a custom registration form. Students will fill this out directly in the app — no external links needed.
                </p>

                {errors.registration_fields && (
                  <p className="form-error"><X size={11} /> {errors.registration_fields}</p>
                )}

                <FieldBuilder
                  fields={registrationFields}
                  onChange={setRegistrationFields}
                />

                {/* Registration limit */}
                <Field label="Registration Limit (optional)" icon={Hash}>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 200 (leave empty for unlimited)"
                    value={registrationLimit}
                    onChange={e => setRegistrationLimit(e.target.value)}
                    min="0"
                  />
                  <span className="text-xs text-muted">Set to 0 or leave empty for unlimited registrations</span>
                </Field>
              </div>
            )}
          </div>

          {/* Brochure upload */}
          <Field label="Brochure / Poster (optional)" icon={Image} error={errors.brochure}>
            {brochurePreview ? (
              <div style={{ position: "relative" }}>
                <img src={brochurePreview} alt="Preview"
                  style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: "var(--r-md)", border: "1px solid var(--border-subtle)" }} />
                <button className="btn btn-danger btn-icon tap"
                  style={{ position: "absolute", top: 8, right: 8, borderRadius: "50%", width: 32, height: 32, minHeight: 32 }}
                  onClick={() => { setBrochure(null); setBrochurePreview(null); }}>
                  <X size={14} />
                </button>
                <p className="text-xs text-muted mt-8">📎 {brochure?.name}</p>
              </div>
            ) : (
              <div className={`upload-zone ${dragging ? "drag-over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*"
                  style={{ display: "none" }}
                  onChange={e => handleFile(e.target.files[0])} />
                <UploadCloud size={28} color="var(--text-muted)"
                  style={{ display: "block", margin: "0 auto 10px" }} />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.86rem" }}>
                  Drag & drop or{" "}
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>browse</span>
                </p>
                <p className="text-xs text-muted mt-8">JPEG, PNG, WebP · max 5 MB</p>
              </div>
            )}
          </Field>

          {/* Submit */}
          <button
            className={`btn btn-primary btn-lg tap w-full ${submitting ? "btn-loading" : ""}`}
            style={{ marginTop: 4 }}
            onClick={handleSubmit} disabled={submitting}>
            {!submitting && "Submit for Review →"}
          </button>

          <p className="text-xs text-muted" style={{ textAlign: "center", marginTop: -6 }}>
            Event goes live after admin approval.
          </p>
        </div>
      </div>
    </div>
  );
}