/**
 * pages/LoginPage.jsx v4
 * Faculty + Admin login only (students have public access)
 */
import { useState } from "react";
import axios from "axios";
import { BookOpen, Shield, Eye, EyeOff, ChevronRight, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ROLES = [
  { key:"faculty", label:"Faculty", icon:BookOpen, color:"var(--amber-400)", bg:"var(--amber-glow)", border:"var(--amber-ring)" },
  { key:"admin",   label:"Admin",   icon:Shield,   color:"var(--rose-400)",  bg:"var(--rose-glow)",  border:"rgba(251,113,133,0.25)" },
];

export default function LoginPage({ onLogin, onClose }) {
  const [role,     setRole]     = useState("faculty");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const activeRole = ROLES.find(r => r.key === role);

  const submit = async () => {
    if (!username.trim() || !password) { setError("Both fields are required."); return; }
    setLoading(true); setError("");
    try {
      const endpoint = role === "admin" ? "/api/auth/admin-login" : "/api/auth/faculty-login";
      const res = await axios.post(`${API}${endpoint}`, { username: username.trim(), password });
      const session = { role: res.data.role, ...res.data.user };
      localStorage.setItem("sist_session", JSON.stringify(session));
      onLogin(session);
    } catch (e) {
      setError(e.response?.data?.message || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ width:"100%", maxWidth:420, margin:"0 auto" }}>
      <div className="login-card" style={{ position:"relative" }}>

        {/* Close button */}
        {onClose && (
          <button className="btn btn-ghost btn-icon tap"
            style={{ position:"absolute", top:14, right:14 }}
            onClick={onClose}>
            <X size={18}/>
          </button>
        )}

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--amber-500)", boxShadow:"0 0 10px var(--amber-500)", display:"inline-block" }}/>
            <span style={{ fontFamily:"var(--ff-display)", fontSize:"1.4rem", fontWeight:800, letterSpacing:"-0.04em" }}>
              SDC<span style={{ color:"var(--amber-500)" }}> Club</span>
            </span>
          </div>
          <p style={{ fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--text-muted)" }}>
            Events Hub · Staff Portal
          </p>
        </div>

        {/* Role tabs */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:22 }}>
          {ROLES.map(r => {
            const Icon = r.icon;
            const on   = role === r.key;
            return (
              <button key={r.key}
                onClick={() => { setRole(r.key); setError(""); }}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7,
                  padding:"13px 8px", borderRadius:"var(--r-md)", cursor:"pointer",
                  border:`1px solid ${on ? r.border : "var(--border-subtle)"}`,
                  background: on ? r.bg : "transparent",
                  transition:"all 0.18s" }}>
                <Icon size={20} color={on ? r.color : "var(--text-muted)"}/>
                <span style={{ fontSize:"0.78rem", fontWeight:700, color: on ? r.color : "var(--text-muted)" }}>
                  {r.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px",
            background:"var(--rose-glow)", border:"1px solid rgba(251,113,133,0.3)",
            borderRadius:"var(--r-sm)", marginBottom:16, fontSize:"0.8rem", color:"var(--rose-400)" }}>
            <X size={13}/> {error}
          </div>
        )}

        {/* Inputs */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" placeholder="Enter username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              autoComplete="username" autoCapitalize="none"/>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position:"relative" }}>
              <input className="form-input"
                type={showPass ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && submit()}
                autoComplete="current-password"
                style={{ paddingRight:48 }}/>
              <button onClick={() => setShowPass(s => !s)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)",
                  display:"flex", alignItems:"center", padding:4 }}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <button
            className={`btn btn-primary btn-lg tap w-full ${loading ? "btn-loading" : ""}`}
            style={{ marginTop:4,
              background:`linear-gradient(135deg,${activeRole.key==="admin" ? "#fb7185,#e11d48" : "#fbbf24,#d97706"})` }}
            onClick={submit} disabled={loading}>
            {!loading && <>Sign In <ChevronRight size={16}/></>}
          </button>
        </div>

        <p style={{ textAlign:"center", marginTop:14, fontSize:"0.7rem", color:"var(--text-muted)" }}>
          {role === "admin" ? "Default: admin / admin123" : "Use credentials provided by your admin."}
        </p>

        {/* Student note */}
        <div style={{ marginTop:18, padding:"10px 14px",
          background:"rgba(45,212,191,0.06)", border:"1px solid rgba(45,212,191,0.15)",
          borderRadius:"var(--r-sm)", textAlign:"center" }}>
          <p style={{ fontSize:"0.72rem", color:"var(--teal-400)", fontWeight:500 }}>
            🎓 Students can view events without logging in
          </p>
        </div>
      </div>
    </div>
  );
}