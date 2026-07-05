import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Trash2, LogOut, RefreshCw, Clock, Eye, Shield, CalendarDays, MapPin, User, Link2, ChevronRight, Inbox, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{
  day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",
});

const BADGE = {
  Technical:"badge-technical",Cultural:"badge-cultural",Workshop:"badge-workshop",
  Sports:"badge-sports",Seminar:"badge-seminar",Hackathon:"badge-hackathon",Other:"badge-other",
};

function useLocalToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

/* ── Detail Modal ───────────────────────────────── */
function DetailModal({ event, onClose, onApprove, onReject, acting }) {
  if (!event) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:600 }} onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily:"var(--ff-display)" }}>Event Details</h2>
          <button className="btn btn-ghost btn-icon tap" onClick={onClose}><X size={18} /></button>
        </div>
        {event.brochure_path && (
          <img src={`${API}${event.brochure_path}`} alt="brochure"
            style={{ width:"100%",maxHeight:220,objectFit:"cover" }} />
        )}
        <div className="modal-body" style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12 }}>
            <h3 style={{ fontFamily:"var(--ff-display)",fontSize:"1.2rem",fontWeight:800,flex:1 }}>{event.title}</h3>
            <span className={`badge ${BADGE[event.category] || "badge-other"}`}>{event.category}</span>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            {[
              {icon:User,        label:"Organizer",    val:event.organizer},
              {icon:MapPin,      label:"Location",     val:event.location},
              {icon:CalendarDays,label:"Date",         val:fmtDate(event.event_date)},
              {icon:User,        label:"Submitted by", val:event.created_by},
            ].map(({icon:Icon,label,val}) => (
              <div key={label}>
                <p className="text-xs text-muted d-flex ai-center gap-4" style={{marginBottom:3}}><Icon size={11}/> {label}</p>
                <p className="text-sm fw-600">{val}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted mb-8">Description</p>
            <p className="text-sm" style={{color:"var(--text-secondary)",lineHeight:1.7}}>{event.description}</p>
          </div>
          {event.registration_link && (
            <a href={event.registration_link} target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost tap w-full"><Link2 size={15}/> View Registration Link</a>
          )}
          {event.status === "pending" && (
            <div style={{display:"flex",gap:10,marginTop:4}}>
              <button className={`btn btn-teal tap ${acting===event._id+"approved"?"btn-loading":""}`}
                style={{flex:1}} onClick={()=>onApprove(event._id)} disabled={!!acting}>
                {!acting && <><CheckCircle size={16}/> Approve</>}
              </button>
              <button className={`btn btn-danger tap ${acting===event._id+"rejected"?"btn-loading":""}`}
                style={{flex:1}} onClick={()=>onReject(event._id)} disabled={!!acting}>
                {!acting && <><XCircle size={16}/> Reject</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Faculty Login ──────────────────────────────── */
function FacultyLogin({ onLogin }) {
  const [creds,   setCreds]   = useState({ username:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const submit = async () => {
    if (!creds.username || !creds.password) { setError("Both fields are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API}/api/auth/faculty-login`, creds);
      onLogin(res.data.faculty);
    } catch (e) { setError(e.response?.data?.message || "Invalid credentials."); }
    finally { setLoading(false); }
  };

  return (
    <div className="page" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",minHeight:"70dvh"}}>
      <div className="login-card animate-in">
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:64,height:64,borderRadius:"var(--radius-md)",background:"var(--amber-glow)",border:"1px solid var(--amber-ring)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <Shield size={28} color="var(--amber-400)" />
          </div>
          <h2 style={{fontFamily:"var(--ff-display)",fontSize:"1.5rem",fontWeight:800,marginBottom:6}}>Faculty Portal</h2>
          <p className="text-muted text-sm">Sign in to review and manage event submissions.</p>
        </div>
        {error && (
          <div className="toast toast-error" style={{position:"static",animation:"none",maxWidth:"100%",marginBottom:16,pointerEvents:"all"}}>
            <XCircle size={15}/> {error}
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" placeholder="admin"
              value={creds.username}
              onChange={e=>setCreds(c=>({...c,username:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&submit()} autoComplete="username" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={creds.password}
              onChange={e=>setCreds(c=>({...c,password:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&submit()} autoComplete="current-password" />
          </div>
          <button className={`btn btn-primary btn-lg tap form-submit ${loading?"btn-loading":""}`}
            style={{width:"100%",marginTop:8}} onClick={submit} disabled={loading}>
            {!loading && <>Sign In <ChevronRight size={17}/></>}
          </button>
        </div>
        <p className="text-xs text-muted" style={{textAlign:"center",marginTop:20}}>
          Default: <strong className="text-amber">admin</strong> / <strong className="text-amber">sist2024</strong>
        </p>
      </div>
    </div>
  );
}

/* ── Queue Card ─────────────────────────────────── */
function QueueCard({ event, onApprove, onReject, onDelete, onView, acting }) {
  const isActing = acting?.startsWith(event._id);
  return (
    <div className="queue-item">
      <div style={{minWidth:0}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          <span className={`badge ${BADGE[event.category]||"badge-other"}`}>{event.category}</span>
          <span className={`badge badge-${event.status}`}>
            {event.status==="pending"&&<Clock size={9}/>}
            {event.status==="approved"&&<CheckCircle size={9}/>}
            {event.status==="rejected"&&<XCircle size={9}/>}
            {" "}{event.status}
          </span>
        </div>
        <p className="fw-700 truncate" style={{fontSize:"0.92rem",marginBottom:6}}>{event.title}</p>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <span className="text-xs text-muted d-flex ai-center gap-4"><User size={10}/> {event.organizer} · {event.created_by}</span>
          <span className="text-xs text-muted d-flex ai-center gap-4"><CalendarDays size={10}/> {fmtDate(event.event_date)}</span>
          <span className="text-xs text-muted d-flex ai-center gap-4"><MapPin size={10}/> {event.location}</span>
        </div>
      </div>
      <div className="queue-actions">
        <button className="action-btn tap" onClick={()=>onView(event)} title="View"
          style={{borderColor:"var(--border-light)",color:"var(--text-secondary)"}}>
          <Eye size={15}/>
        </button>
        {event.status==="pending"&&(
          <>
            <button className={`action-btn action-approve tap ${acting===event._id+"approved"?"btn-loading":""}`}
              onClick={()=>onApprove(event._id)} disabled={isActing} title="Approve">
              {acting!==event._id+"approved"&&<CheckCircle size={15}/>}
            </button>
            <button className={`action-btn action-reject tap ${acting===event._id+"rejected"?"btn-loading":""}`}
              onClick={()=>onReject(event._id)} disabled={isActing} title="Reject">
              {acting!==event._id+"rejected"&&<XCircle size={15}/>}
            </button>
          </>
        )}
        <button className={`action-btn action-delete tap ${acting===event._id+"delete"?"btn-loading":""}`}
          onClick={()=>onDelete(event._id)} disabled={isActing} title="Delete">
          {acting!==event._id+"delete"&&<Trash2 size={14}/>}
        </button>
      </div>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────── */
export default function TeacherDashboard({ onLogout: parentLogout }) {
  const [faculty,      setFaculty]      = useState(null);
  const [events,       setEvents]       = useState([]);
  const [tab,          setTab]          = useState("pending");
  const [loading,      setLoading]      = useState(false);
  const [acting,       setActing]       = useState(null);
  const [detailEvent,  setDetailEvent]  = useState(null);
  const { toasts, show } = useLocalToast();

  const fetchEvents = useCallback(async (statusFilter = tab) => {
    setLoading(true);
    try {
      const param = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      const res = await axios.get(`${API}/api/admin/events${param}`);
      setEvents(res.data);
    } catch { show("Failed to fetch events.", "error"); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { if (faculty) fetchEvents(tab); }, [faculty, tab]);

  const updateStatus = async (id, status) => {
    setActing(id+status);
    try {
      await axios.patch(`${API}/api/admin/events/${id}/status`, { status });
      show(status==="approved" ? "Event approved! 🎉" : "Event rejected.", status==="approved"?"success":"error");
      setDetailEvent(null); fetchEvents(tab);
    } catch { show("Action failed.","error"); }
    finally { setActing(null); }
  };

  const deleteEvent = async id => {
    if (!confirm("Permanently delete this event?")) return;
    setActing(id+"delete");
    try {
      await axios.delete(`${API}/api/admin/events/${id}`);
      show("Event deleted.","info");
      if (detailEvent?._id===id) setDetailEvent(null);
      fetchEvents(tab);
    } catch { show("Delete failed.","error"); }
    finally { setActing(null); }
  };

  const pending = events.filter(e=>e.status==="pending").length;

  const TABS = [
    {key:"pending", label:"Queue",   icon:Clock},
    {key:"approved",label:"Live",    icon:CheckCircle},
    {key:"rejected",label:"Rejected",icon:XCircle},
    {key:"all",     label:"All",     icon:Inbox},
  ];

  if (!faculty) return <FacultyLogin onLogin={setFaculty} />;

  return (
    <div className="page" style={{position:"relative",zIndex:1}}>
      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map(t=>(
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type==="success"&&<CheckCircle size={15}/>}
            {t.type==="error"&&<XCircle size={15}/>}
            {t.msg}
          </div>
        ))}
      </div>

      {detailEvent && (
        <DetailModal event={detailEvent} onClose={()=>setDetailEvent(null)}
          onApprove={id=>updateStatus(id,"approved")}
          onReject={id=>updateStatus(id,"rejected")}
          acting={acting} />
      )}

      <div className="container" style={{paddingTop:32,paddingBottom:60}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,gap:12,flexWrap:"wrap"}}>
          <div>
            <div className="d-flex ai-center gap-6 mb-4">
              <Shield size={16} color="var(--amber-400)" />
              <span className="text-xs text-amber fw-700" style={{letterSpacing:"0.1em",textTransform:"uppercase"}}>Admin Panel</span>
            </div>
            <h1 style={{fontFamily:"var(--ff-display)",fontSize:"clamp(1.3rem,4vw,1.9rem)",fontWeight:800}}>
              Welcome, {faculty.name || faculty.username}
            </h1>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost btn-icon tap" onClick={()=>fetchEvents(tab)} title="Refresh">
              <RefreshCw size={17} style={{animation:loading?"spin 0.8s linear infinite":"none"}}/>
            </button>
            <button className="btn btn-ghost tap" onClick={()=>{setFaculty(null);parentLogout?.();}}>
              <LogOut size={16}/> Sign Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
          <div className="stat-card">
            <div className="stat-val" style={{color:"var(--amber-400)"}}>{pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{color:"var(--teal-400)"}}>{events.filter(e=>e.status==="approved").length}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{color:"var(--rose-400)"}}>{events.filter(e=>e.status==="rejected").length}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {TABS.map(({key,label,icon:Icon})=>(
            <button key={key} className={`dash-tab tap ${tab===key?"active":""}`} onClick={()=>setTab(key)}>
              <Icon size={14}/> <span className="hide-xs">{label}</span>
              {key==="pending"&&pending>0&&<span className="count-badge">{pending}</span>}
            </button>
          ))}
        </div>

        {/* Queue list */}
        {loading ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:110,borderRadius:"var(--radius-md)"}}/>)}
          </div>
        ) : events.length===0 ? (
          <div className="empty-state">
            <div className="empty-icon">{tab==="pending"?"📥":tab==="approved"?"✅":tab==="rejected"?"❌":"📋"}</div>
            <p className="empty-title">Nothing here yet</p>
            <p className="empty-sub">{tab==="pending"?"No events awaiting review.":`No ${tab} events found.`}</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {events.map(ev=>(
              <QueueCard key={ev._id} event={ev}
                onApprove={id=>updateStatus(id,"approved")}
                onReject={id=>updateStatus(id,"rejected")}
                onDelete={deleteEvent}
                onView={setDetailEvent}
                acting={acting}/>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
