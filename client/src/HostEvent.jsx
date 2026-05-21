/**
 * HostEvent.jsx v4 — Club dropdown fetched from server
 */
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  X, Calendar, MapPin, User, Link2, Image,
  AlignLeft, Tag, CheckCircle, UploadCloud, Users,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CATEGORIES = ["Technical","Cultural","Workshop","Sports","Seminar","Hackathon","Other"];
const EMOJI = { Technical:"⚙️",Cultural:"🎭",Workshop:"🛠️",Sports:"🏆",Seminar:"📚",Hackathon:"💻",Other:"✨" };

function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{Icon && <Icon size={12}/>} {label}</label>
      {children}
      {error && <p className="form-error"><X size={11}/> {error}</p>}
    </div>
  );
}

export default function HostEvent({ onClose, session, onSuccess }) {
  const fileRef = useRef(null);
  const [clubs,  setClubs]  = useState([]);

  const [form, setForm] = useState({
    title:"", category:"", club:"", organizer: session?.name || "",
    event_date:"", location:"", registration_link:"", description:"",
  });
  const [brochure,        setBrochure]        = useState(null);
  const [brochurePreview, setBrochurePreview] = useState(null);
  const [dragging,        setDragging]        = useState(false);
  const [errors,          setErrors]          = useState({});
  const [submitting,      setSubmitting]      = useState(false);
  const [submitted,       setSubmitted]       = useState(false);

  /* Fetch clubs on mount */
  useEffect(() => {
    axios.get(`${API}/api/clubs`)
      .then(r => setClubs(r.data))
      .catch(() => {
        /* Fallback static list */
        setClubs([
          { _id:"1", name:"Software Development Club (SDC)" },
          { _id:"2", name:"IEEE Student Branch" },
          { _id:"3", name:"Google Developer Student Club" },
          { _id:"4", name:"CSI Student Chapter" },
          { _id:"5", name:"Coding Club" },
          { _id:"6", name:"Robotics Club" },
          { _id:"7", name:"Cultural Club" },
          { _id:"8", name:"Sports Committee" },
          { _id:"9", name:"Entrepreneurship Cell" },
          { _id:"10",name:"NSS Unit" },
          { _id:"11",name:"Department of CSE" },
          { _id:"12",name:"Department of IT" },
          { _id:"13",name:"Department of ECE" },
          { _id:"14",name:"Other" },
        ]);
      });
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = "Title is required.";
    if (!form.category)           e.category    = "Please select a category.";
    if (!form.club)               e.club        = "Please select a hosting club.";
    if (!form.organizer.trim())   e.organizer   = "Organizer name is required.";
    if (!form.event_date)         e.event_date  = "Event date is required.";
    else if (new Date(form.event_date) < new Date()) e.event_date = "Date must be in the future.";
    if (!form.location.trim())    e.location    = "Location is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (form.registration_link && !/^https?:\/\/.+/.test(form.registration_link))
      e.registration_link = "Must start with http:// or https://";
    return e;
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFile = file => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErrors(p => ({...p, brochure:"Images only."})); return; }
    if (file.size > 5*1024*1024)         { setErrors(p => ({...p, brochure:"Max 5 MB."})); return; }
    setBrochure(file);
    setBrochurePreview(URL.createObjectURL(file));
    setErrors(p => ({...p, brochure:null}));
  };

  const handleSubmit = async () => {
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    const data = new FormData();
    Object.entries(form).forEach(([k,v]) => { if (v) data.append(k,v); });
    data.append("faculty_id",   session?.id   || "");
    data.append("faculty_name", session?.name || "Faculty");
    if (brochure) data.append("brochure", brochure);
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/faculty/events`, data, {
        headers: { "Content-Type":"multipart/form-data" },
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
        <div className="modal" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
          <div className="drag-handle"/>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"52px 32px",textAlign:"center" }}>
            <div style={{ width:72,height:72,borderRadius:"50%",background:"var(--teal-glow)",border:"1px solid rgba(45,212,191,0.3)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <CheckCircle size={36} color="var(--teal-400)"/>
            </div>
            <div>
              <h3 style={{ fontFamily:"var(--ff-display)",fontSize:"1.3rem",marginBottom:8 }}>Event Submitted!</h3>
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
        <div className="drag-handle"/>
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily:"var(--ff-display)" }}>✦ Create Event</h2>
          <button className="btn btn-ghost btn-icon tap" onClick={onClose}><X size={18}/></button>
        </div>

        <div className="modal-body" style={{ display:"flex",flexDirection:"column",gap:16 }}>

          {errors.global && (
            <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 13px",background:"var(--rose-glow)",border:"1px solid rgba(251,113,133,0.3)",borderRadius:"var(--r-sm)",fontSize:"0.8rem",color:"var(--rose-400)" }}>
              <X size={13}/> {errors.global}
            </div>
          )}

          {/* Title */}
          <Field label="Event Title" icon={Tag} error={errors.title}>
            <input className="form-input" placeholder="e.g. Technovation 2025"
              value={form.title} onChange={set("title")} maxLength={120}/>
          </Field>

          {/* Category + Club — side by side on tablet+ */}
          <div className="form-row-2col" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <Field label="Category" icon={Tag} error={errors.category}>
              <select className="form-select" value={form.category} onChange={set("category")}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{EMOJI[c]} {c}</option>)}
              </select>
            </Field>

            {/* ── CLUB DROPDOWN ── */}
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
              value={form.organizer} onChange={set("organizer")}/>
          </Field>

          {/* Date + Venue */}
          <div className="form-row-2col" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <Field label="Event Date & Time" icon={Calendar} error={errors.event_date}>
              <input className="form-input" type="datetime-local"
                value={form.event_date} onChange={set("event_date")} style={{ colorScheme:"dark" }}/>
            </Field>
            <Field label="Venue" icon={MapPin} error={errors.location}>
              <input className="form-input" placeholder="Hall / Lab / Online"
                value={form.location} onChange={set("location")}/>
            </Field>
          </div>

          {/* Description */}
          <Field label="Description" icon={AlignLeft} error={errors.description}>
            <textarea className="form-textarea"
              placeholder="What to expect, who should attend…"
              value={form.description} onChange={set("description")} maxLength={1000}/>
            <span className="text-xs text-muted" style={{ textAlign:"right" }}>
              {form.description.length}/1000
            </span>
          </Field>

          {/* Registration link */}
          <Field label="Registration Link (optional)" icon={Link2} error={errors.registration_link}>
            <input className="form-input" type="url" placeholder="https://forms.google.com/…"
              value={form.registration_link} onChange={set("registration_link")}/>
          </Field>

          {/* Brochure upload */}
          <Field label="Brochure / Poster (optional)" icon={Image} error={errors.brochure}>
            {brochurePreview ? (
              <div style={{ position:"relative" }}>
                <img src={brochurePreview} alt="Preview"
                  style={{ width:"100%",height:150,objectFit:"cover",borderRadius:"var(--r-md)",border:"1px solid var(--border-subtle)" }}/>
                <button className="btn btn-danger btn-icon tap"
                  style={{ position:"absolute",top:8,right:8,borderRadius:"50%",width:32,height:32,minHeight:32 }}
                  onClick={() => { setBrochure(null); setBrochurePreview(null); }}>
                  <X size={14}/>
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
                  style={{ display:"none" }}
                  onChange={e => handleFile(e.target.files[0])}/>
                <UploadCloud size={28} color="var(--text-muted)"
                  style={{ display:"block",margin:"0 auto 10px" }}/>
                <p style={{ color:"var(--text-secondary)",fontSize:"0.86rem" }}>
                  Drag & drop or{" "}
                  <span style={{ color:"var(--amber-400)",fontWeight:600 }}>browse</span>
                </p>
                <p className="text-xs text-muted mt-8">JPEG, PNG, WebP · max 5 MB</p>
              </div>
            )}
          </Field>

          {/* Submit */}
          <button
            className={`btn btn-primary btn-lg tap w-full ${submitting ? "btn-loading" : ""}`}
            style={{ marginTop:4 }}
            onClick={handleSubmit} disabled={submitting}>
            {!submitting && "Submit for Review →"}
          </button>

          <p className="text-xs text-muted" style={{ textAlign:"center",marginTop:-6 }}>
            Event goes live after admin approval.
          </p>
        </div>
      </div>
    </div>
  );
}