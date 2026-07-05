/**
 * pages/AdminConsole.jsx
 * Admin panel: Events approval, Faculty management, Student management
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Shield, Users, GraduationCap, CalendarDays, Plus, Trash2,
  CheckCircle, XCircle, Clock, Eye, X, RefreshCw,
  UserPlus, Edit2, ToggleLeft, ToggleRight, ChevronDown,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* ── Local toast ────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return { toasts, show };
}

/* ── Confirm dialog ─────────────────────────────── */
function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div className="modal-body" style={{ textAlign: "center", padding: "32px 24px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--rose-glow)", border: "1px solid rgba(251,113,133,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Trash2 size={24} color="var(--rose-400)" />
          </div>
          <p style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "1rem", marginBottom: 8 }}>Are you sure?</p>
          <p className="text-muted text-sm" style={{ marginBottom: 24 }}>{msg}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost tap w-full" onClick={onCancel}>Cancel</button>
            <button className="btn btn-danger tap w-full" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Add/Edit Modal ─────────────────────────────── */
function AddModal({ type, onClose, onSave }) {
  const isFaculty = type === "faculty";
  const [form, setForm] = useState({
    name: "", username: "", register_number: "",
    password: "", department: "", year: "1",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErr(""); };

  const save = async () => {
    const required = isFaculty
      ? [form.name, form.username, form.password]
      : [form.name, form.register_number, form.password];
    if (required.some(v => !v?.trim())) { setErr("Please fill all required fields."); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { setErr(e.response?.data?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily: "var(--ff-display)" }}>
            <UserPlus size={16} style={{ display: "inline", marginRight: 8 }} />
            Add {isFaculty ? "Faculty" : "Student"}
          </h2>
          <button className="btn btn-ghost btn-icon tap" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {err && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--rose-glow)", border: "1px solid rgba(251,113,133,0.3)", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", color: "var(--rose-400)" }}>
              <X size={13} /> {err}
            </div>
          )}

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="e.g. Dr. Ramesh Kumar" value={form.name} onChange={set("name")} />
          </div>

          {/* Identifier */}
          {isFaculty ? (
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-input" placeholder="e.g. ramesh.kumar" value={form.username} onChange={set("username")} />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Register Number *</label>
              <input className="form-input" placeholder="e.g. 41234567" value={form.register_number}
                onChange={set("register_number")} style={{ textTransform: "uppercase" }} />
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" placeholder="Set a password" value={form.password} onChange={set("password")} />
          </div>

          {/* Department */}
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-input" placeholder="e.g. Computer Science" value={form.department} onChange={set("department")} />
          </div>

          {/* Year (students only) */}
          {!isFaculty && (
            <div className="form-group">
              <label className="form-label">Year</label>
              <select className="form-select" value={form.year} onChange={set("year")}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="PG">PG</option>
              </select>
            </div>
          )}

          <button
            className={`btn btn-primary btn-lg tap w-full ${saving ? "btn-loading" : ""}`}
            style={{ marginTop: 4 }} onClick={save} disabled={saving}>
            {!saving && `Add ${isFaculty ? "Faculty" : "Student"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Event Detail modal ─────────────────────────── */
function EventDetailModal({ event, onClose, onApprove, onReject, acting }) {
  if (!event) return null;
  const BADGE = { Technical:"badge-technical",Cultural:"badge-cultural",Workshop:"badge-workshop",Sports:"badge-sports",Seminar:"badge-seminar",Hackathon:"badge-hackathon",Other:"badge-other" };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily: "var(--ff-display)" }}>Event Details</h2>
          <button className="btn btn-ghost btn-icon tap" onClick={onClose}><X size={18} /></button>
        </div>
        {event.brochure_path && <img src={`${API}${event.brochure_path}`} alt="brochure" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />}
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h3 style={{ fontFamily: "var(--ff-display)", fontSize: "1.15rem", fontWeight: 800, flex: 1 }}>{event.title}</h3>
            <span className={`badge ${BADGE[event.category] || "badge-other"}`}>{event.category}</span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{event.description}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Organizer", event.organizer],["Location", event.location],["Date", fmtDate(event.event_date)],["Posted by", event.created_by]].map(([k,v])=>(
              <div key={k}><p className="text-xs text-muted mb-4">{k}</p><p className="text-sm fw-600">{v}</p></div>
            ))}
          </div>
          {event.status === "pending" && (
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className={`btn btn-teal tap ${acting === event._id+"approved" ? "btn-loading" : ""}`} style={{ flex: 1 }} onClick={() => onApprove(event._id)} disabled={!!acting}>
                {!acting && <><CheckCircle size={15} /> Approve</>}
              </button>
              <button className={`btn btn-danger tap ${acting === event._id+"rejected" ? "btn-loading" : ""}`} style={{ flex: 1 }} onClick={() => onReject(event._id)} disabled={!!acting}>
                {!acting && <><XCircle size={15} /> Reject</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN ADMIN CONSOLE
══════════════════════════════════════════════════ */
export default function AdminConsole({ session }) {
  const [tab, setTab] = useState("events");

  /* events */
  const [events,      setEvents]      = useState([]);
  const [evFilter,    setEvFilter]    = useState("pending");
  const [evLoading,   setEvLoading]   = useState(false);
  const [acting,      setActing]      = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);

  /* faculty */
  const [faculty,    setFaculty]    = useState([]);
  const [facLoading, setFacLoading] = useState(false);
  const [showAddFac, setShowAddFac] = useState(false);
  const [deleteFac,  setDeleteFac]  = useState(null);

  /* students */
  const [students,   setStudents]   = useState([]);
  const [stuLoading, setStuLoading] = useState(false);
  const [showAddStu, setShowAddStu] = useState(false);
  const [deleteStu,  setDeleteStu]  = useState(null);
  const [stuSearch,  setStuSearch]  = useState("");
  const [facSearch,  setFacSearch]  = useState("");

  const { toasts, show } = useToast();

  /* ── Fetch ────────────────────────────────────── */
  const fetchEvents = useCallback(async (filter = evFilter) => {
    setEvLoading(true);
    try { const r = await axios.get(`${API}/api/admin/events?status=${filter}`); setEvents(r.data); }
    catch { show("Failed to load events","error"); }
    finally { setEvLoading(false); }
  }, [evFilter]);

  const fetchFaculty = useCallback(async () => {
    setFacLoading(true);
    try { const r = await axios.get(`${API}/api/admin/faculty`); setFaculty(r.data); }
    catch { show("Failed to load faculty","error"); }
    finally { setFacLoading(false); }
  }, []);

  const fetchStudents = useCallback(async () => {
    setStuLoading(true);
    try { const r = await axios.get(`${API}/api/admin/students`); setStudents(r.data); }
    catch { show("Failed to load students","error"); }
    finally { setStuLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(evFilter); }, [evFilter]);
  useEffect(() => { if (tab === "faculty")  fetchFaculty();  }, [tab]);
  useEffect(() => { if (tab === "students") fetchStudents(); }, [tab]);

  /* ── Event actions ────────────────────────────── */
  const updateEventStatus = async (id, status) => {
    setActing(id+status);
    try {
      await axios.patch(`${API}/api/admin/events/${id}/status`, { status });
      show(status === "approved" ? "Event approved! ✅" : "Event rejected.", status === "approved" ? "success" : "error");
      setDetailEvent(null); fetchEvents(evFilter);
    } catch { show("Action failed","error"); }
    finally { setActing(null); }
  };

  const deleteEvent = async id => {
    try { await axios.delete(`${API}/api/admin/events/${id}`); show("Event deleted.","info"); fetchEvents(evFilter); }
    catch { show("Delete failed","error"); }
  };

  /* ── Faculty actions ──────────────────────────── */
  const addFaculty = async form => {
    await axios.post(`${API}/api/admin/faculty`, {
      username: form.username.trim(), password: form.password,
      name: form.name.trim(), department: form.department,
    });
    show("Faculty added! 🎉","success"); fetchFaculty();
  };

  const toggleFaculty = async (id, current) => {
    try { await axios.patch(`${API}/api/admin/faculty/${id}`, { isActive: !current }); fetchFaculty(); }
    catch { show("Failed","error"); }
  };

  const deleteFaculty = async id => {
    try { await axios.delete(`${API}/api/admin/faculty/${id}`); show("Faculty removed.","info"); fetchFaculty(); setDeleteFac(null); }
    catch { show("Delete failed","error"); }
  };

  /* ── Student actions ──────────────────────────── */
  const addStudent = async form => {
    await axios.post(`${API}/api/admin/students`, {
      register_number: form.register_number.trim().toUpperCase(),
      password: form.password, name: form.name.trim(),
      department: form.department, year: form.year,
    });
    show("Student added! 🎉","success"); fetchStudents();
  };

  const toggleStudent = async (id, current) => {
    try { await axios.patch(`${API}/api/admin/students/${id}`, { isActive: !current }); fetchStudents(); }
    catch { show("Failed","error"); }
  };

  const deleteStudent = async id => {
    try { await axios.delete(`${API}/api/admin/students/${id}`); show("Student removed.","info"); fetchStudents(); setDeleteStu(null); }
    catch { show("Delete failed","error"); }
  };

  /* ── Derived ──────────────────────────────────── */
  const pendingCount  = events.filter(e => e.status === "pending").length;
  const filteredFac   = faculty.filter(f  => f.name.toLowerCase().includes(facSearch.toLowerCase()) || f.username.toLowerCase().includes(facSearch.toLowerCase()));
  const filteredStu   = students.filter(s => s.name.toLowerCase().includes(stuSearch.toLowerCase()) || s.register_number.toLowerCase().includes(stuSearch.toLowerCase()));

  const TABS = [
    { key: "events",   label: "Events",   icon: CalendarDays, count: pendingCount },
    { key: "faculty",  label: "Faculty",  icon: Users,        count: faculty.length },
    { key: "students", label: "Students", icon: GraduationCap,count: students.length },
  ];

  const BADGE_MAP = { Technical:"badge-technical",Cultural:"badge-cultural",Workshop:"badge-workshop",Sports:"badge-sports",Seminar:"badge-seminar",Hackathon:"badge-hackathon",Other:"badge-other" };

  return (
    <div className="page" style={{ position: "relative", zIndex: 1 }}>
      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type==="success"&&<CheckCircle size={14}/>}{t.type==="error"&&<XCircle size={14}/>}
            {" "}{t.msg}
          </div>
        ))}
      </div>

      {/* Modals */}
      {showAddFac  && <AddModal type="faculty" onClose={()=>setShowAddFac(false)} onSave={addFaculty}  />}
      {showAddStu  && <AddModal type="student" onClose={()=>setShowAddStu(false)} onSave={addStudent}  />}
      {deleteFac   && <ConfirmModal msg={`Remove faculty "${deleteFac.name}"? Their events will remain.`} onConfirm={()=>deleteFaculty(deleteFac._id)} onCancel={()=>setDeleteFac(null)} />}
      {deleteStu   && <ConfirmModal msg={`Remove student "${deleteStu.name}" (${deleteStu.register_number})?`} onConfirm={()=>deleteStudent(deleteStu._id)} onCancel={()=>setDeleteStu(null)} />}
      {detailEvent && <EventDetailModal event={detailEvent} onClose={()=>setDetailEvent(null)} onApprove={id=>updateEventStatus(id,"approved")} onReject={id=>updateEventStatus(id,"rejected")} acting={acting} />}

      <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <Shield size={16} color="var(--rose-400)" />
              <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rose-400)" }}>Admin Console</span>
            </div>
            <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(1.3rem,4vw,1.9rem)", fontWeight: 800 }}>
              Welcome, {session.name}
            </h1>
          </div>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 10 }}>
            {[["Faculty", faculty.length,"var(--amber-400)"],["Students",students.length,"var(--teal-400)"],["Pending",pendingCount,"var(--rose-400)"]].map(([l,v,c])=>(
              <div key={l} style={{ background:"var(--navy-800)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-sm)",padding:"8px 14px",textAlign:"center",minWidth:70 }}>
                <div style={{ fontFamily:"var(--ff-display)",fontSize:"1.3rem",fontWeight:800,color:c,lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:"0.62rem",color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.05em",marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs" style={{ marginBottom: 20 }}>
          {TABS.map(({ key, label, icon: Icon, count }) => (
            <button key={key} className={`dash-tab tap ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              <Icon size={15} />
              <span>{label}</span>
              {count > 0 && <span className="count-badge" style={{ background: tab === key ? "var(--amber-500)" : "var(--navy-700)", color: tab === key ? "#000" : "var(--text-secondary)" }}>{count}</span>}
            </button>
          ))}
        </div>

        {/* ── EVENTS TAB ────────────────────────── */}
        {tab === "events" && (
          <div>
            {/* Filter */}
            <div className="filter-bar" style={{ marginBottom: 16 }}>
              {["pending","approved","rejected","all"].map(f => (
                <button key={f} className={`chip tap ${evFilter===f?"active":""}`} onClick={()=>setEvFilter(f)} style={{ textTransform: "capitalize" }}>{f}</button>
              ))}
              <button className="btn btn-ghost btn-sm tap" style={{ marginLeft: "auto", flexShrink: 0 }} onClick={()=>fetchEvents(evFilter)}>
                <RefreshCw size={14}/>
              </button>
            </div>

            {evLoading ? (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:100,borderRadius:"var(--radius-md)"}}/>)}
              </div>
            ) : events.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><p className="empty-title">No {evFilter} events</p></div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {events.map(ev => (
                  <div key={ev._id} className="queue-item">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:7 }}>
                        <span className={`badge ${BADGE_MAP[ev.category]||"badge-other"}`}>{ev.category}</span>
                        <span className={`badge badge-${ev.status}`}>{ev.status}</span>
                      </div>
                      <p className="fw-700 truncate" style={{ fontSize:"0.9rem",marginBottom:4 }}>{ev.title}</p>
                      <p className="text-xs text-muted">{ev.organizer} · {ev.created_by} · {fmtDate(ev.event_date)}</p>
                    </div>
                    <div className="queue-actions">
                      <button className="action-btn tap" onClick={()=>setDetailEvent(ev)} title="View" style={{ borderColor:"var(--border-light)",color:"var(--text-secondary)" }}><Eye size={15}/></button>
                      {ev.status==="pending"&&<>
                        <button className={`action-btn action-approve tap ${acting===ev._id+"approved"?"btn-loading":""}`} onClick={()=>updateEventStatus(ev._id,"approved")} disabled={!!acting} title="Approve">{acting!==ev._id+"approved"&&<CheckCircle size={15}/>}</button>
                        <button className={`action-btn action-reject tap ${acting===ev._id+"rejected"?"btn-loading":""}`} onClick={()=>updateEventStatus(ev._id,"rejected")} disabled={!!acting} title="Reject">{acting!==ev._id+"rejected"&&<XCircle size={15}/>}</button>
                      </>}
                      <button className="action-btn action-delete tap" onClick={()=>deleteEvent(ev._id)} title="Delete"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FACULTY TAB ───────────────────────── */}
        {tab === "faculty" && (
          <div>
            <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" }}>
              <input className="search-input" style={{ flex:1,minWidth:200 }}
                placeholder="Search faculty name or username…"
                value={facSearch} onChange={e=>setFacSearch(e.target.value)} />
              <button className="btn btn-primary tap" onClick={()=>setShowAddFac(true)}>
                <UserPlus size={16}/> Add Faculty
              </button>
            </div>

            {facLoading ? (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:80,borderRadius:"var(--radius-md)"}}/>)}</div>
            ) : filteredFac.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">👨‍🏫</div><p className="empty-title">{facSearch ? "No results" : "No faculty added yet"}</p><p className="empty-sub">Use the button above to add faculty members.</p></div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {filteredFac.map(f => (
                  <div key={f._id} style={{ background:"var(--navy-800)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-md)",padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"center" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                        <div style={{ width:36,height:36,borderRadius:"50%",background:"var(--amber-glow)",border:"1px solid var(--amber-ring)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",fontWeight:700,color:"var(--amber-400)",flexShrink:0 }}>
                          {f.name.slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p className="fw-700 truncate" style={{ fontSize:"0.9rem" }}>{f.name}</p>
                          <p className="text-xs text-muted">@{f.username}{f.department && ` · ${f.department}`}</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                      <span style={{ fontSize:"0.68rem",fontWeight:700,padding:"3px 8px",borderRadius:99,background:f.isActive?"rgba(52,211,153,0.12)":"rgba(148,163,184,0.1)",color:f.isActive?"#34d399":"#94a3b8",border:`1px solid ${f.isActive?"rgba(52,211,153,0.25)":"rgba(148,163,184,0.15)"}` }}>
                        {f.isActive?"Active":"Inactive"}
                      </span>
                      <button className="action-btn tap" title={f.isActive?"Deactivate":"Activate"}
                        style={{ borderColor:"var(--border-light)",color:f.isActive?"var(--teal-400)":"var(--text-muted)" }}
                        onClick={()=>toggleFaculty(f._id,f.isActive)}>
                        {f.isActive?<ToggleRight size={16}/>:<ToggleLeft size={16}/>}
                      </button>
                      <button className="action-btn action-delete tap" onClick={()=>setDeleteFac(f)} title="Remove">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STUDENTS TAB ──────────────────────── */}
        {tab === "students" && (
          <div>
            <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" }}>
              <input className="search-input" style={{ flex:1,minWidth:200 }}
                placeholder="Search name or register number…"
                value={stuSearch} onChange={e=>setStuSearch(e.target.value)} />
              <button className="btn btn-primary tap" onClick={()=>setShowAddStu(true)}>
                <UserPlus size={16}/> Add Student
              </button>
            </div>

            {stuLoading ? (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:72,borderRadius:"var(--radius-md)"}}/>)}</div>
            ) : filteredStu.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🎓</div><p className="empty-title">{stuSearch ? "No results" : "No students added yet"}</p><p className="empty-sub">Use the button above to add students.</p></div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {filteredStu.map(s => (
                  <div key={s._id} style={{ background:"var(--navy-800)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-md)",padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"center" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:0 }}>
                      <div style={{ width:36,height:36,borderRadius:"50%",background:"var(--teal-glow)",border:"1px solid rgba(45,212,191,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:700,color:"var(--teal-400)",flexShrink:0 }}>
                        {s.name.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p className="fw-700 truncate" style={{ fontSize:"0.88rem" }}>{s.name}</p>
                        <p className="text-xs text-muted">{s.register_number}{s.department&&` · ${s.department}`} · Year {s.year}</p>
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                      <span style={{ fontSize:"0.68rem",fontWeight:700,padding:"3px 8px",borderRadius:99,background:s.isActive?"rgba(52,211,153,0.12)":"rgba(148,163,184,0.1)",color:s.isActive?"#34d399":"#94a3b8",border:`1px solid ${s.isActive?"rgba(52,211,153,0.25)":"rgba(148,163,184,0.15)"}` }}>
                        {s.isActive?"Active":"Inactive"}
                      </span>
                      <button className="action-btn tap"
                        style={{ borderColor:"var(--border-light)",color:s.isActive?"var(--teal-400)":"var(--text-muted)" }}
                        onClick={()=>toggleStudent(s._id,s.isActive)}>
                        {s.isActive?<ToggleRight size={16}/>:<ToggleLeft size={16}/>}
                      </button>
                      <button className="action-btn action-delete tap" onClick={()=>setDeleteStu(s)} title="Remove">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}