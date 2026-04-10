/**
 * pages/LoginPage.jsx
 * Unified login — Student | Faculty | Admin
 */
import { useState } from "react";
import axios from "axios";
import { GraduationCap, BookOpen, Shield, Eye, EyeOff, ChevronRight, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ROLES = [
  { key: "student", label: "Student",   icon: GraduationCap, color: "var(--teal-400)",  bg: "var(--teal-glow)",  border: "rgba(45,212,191,0.25)" },
  { key: "faculty", label: "Faculty",   icon: BookOpen,       color: "var(--amber-400)", bg: "var(--amber-glow)", border: "var(--amber-ring)" },
  { key: "admin",   label: "Admin",     icon: Shield,         color: "var(--rose-400)",  bg: "var(--rose-glow)",  border: "rgba(251,113,133,0.25)" },
];

export default function LoginPage({ onLogin }) {
  const [role,     setRole]     = useState("student");
  const [fields,   setFields]   = useState({ identifier: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const activeRole = ROLES.find(r => r.key === role);

  const set = key => e => { setFields(f => ({ ...f, [key]: e.target.value })); setError(""); };

  const submit = async () => {
    if (!fields.identifier || !fields.password) { setError("All fields are required."); return; }
    setLoading(true); setError("");
    try {
      let res;
      if (role === "student") {
        res = await axios.post(`${API}/api/auth/student-login`, {
          register_number: fields.identifier.trim().toUpperCase(),
          password: fields.password,
        });
      } else if (role === "faculty") {
        res = await axios.post(`${API}/api/auth/faculty-login`, {
          username: fields.identifier.trim(),
          password: fields.password,
        });
      } else {
        res = await axios.post(`${API}/api/auth/admin-login`, {
          username: fields.identifier.trim(),
          password: fields.password,
        });
      }
      const session = { role: res.data.role, ...res.data.user };
      localStorage.setItem("sist_session", JSON.stringify(session));
      onLogin(session);
    } catch (e) {
      setError(e.response?.data?.message || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", position: "relative", zIndex: 1,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--amber-500)", boxShadow: "0 0 12px var(--amber-500)", display: "inline-block" }} />
            <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.04em" }}>
              SIST<span style={{ color: "var(--amber-500)" }}>EVENTS</span>
            </h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Sathyabama Institute of Science and Technology
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--navy-800)", border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-xl)", padding: "28px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}>

          {/* Role selector */}
          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 10 }}>
            Sign in as
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 24 }}>
            {ROLES.map(r => {
              const Icon = r.icon;
              const active = role === r.key;
              return (
                <button key={r.key}
                  onClick={() => { setRole(r.key); setFields({ identifier: "", password: "" }); setError(""); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "12px 8px", borderRadius: "var(--radius-md)", cursor: "pointer",
                    border: `1px solid ${active ? r.border : "var(--border-subtle)"}`,
                    background: active ? r.bg : "transparent",
                    transition: "all 0.18s ease",
                  }}>
                  <Icon size={20} color={active ? r.color : "var(--text-muted)"} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: active ? r.color : "var(--text-muted)" }}>
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {activeRole.label} Login
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
              background: "var(--rose-glow)", border: "1px solid rgba(251,113,133,0.3)",
              borderRadius: "var(--radius-sm)", marginBottom: 16,
              fontSize: "0.82rem", color: "var(--rose-400)",
            }}>
              <X size={14} /> {error}
            </div>
          )}

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Identifier */}
            <div className="form-group">
              <label className="form-label">
                {role === "student" ? "Register Number" : "Username"}
              </label>
              <input className="form-input"
                placeholder={role === "student" ? "e.g. 41234567" : "Enter username"}
                value={fields.identifier}
                onChange={set("identifier")}
                onKeyDown={e => e.key === "Enter" && submit()}
                autoComplete={role === "student" ? "username" : "username"}
                autoCapitalize={role === "student" ? "characters" : "none"}
                style={{ textTransform: role === "student" ? "uppercase" : "none" }}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input className="form-input"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password"
                  value={fields.password}
                  onChange={set("password")}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  autoComplete="current-password"
                  style={{ paddingRight: 48 }}
                />
                <button
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                    display: "flex", alignItems: "center", padding: 4,
                  }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              className={`btn btn-primary btn-lg tap ${loading ? "btn-loading" : ""}`}
              style={{
                width: "100%", marginTop: 4,
                background: `linear-gradient(135deg, ${activeRole.color === "var(--teal-400)" ? "#2dd4bf, #0f9385" : activeRole.color === "var(--rose-400)" ? "#fb7185, #e11d48" : "#fbbf24, #d97706"})`,
              }}
              onClick={submit} disabled={loading}>
              {!loading && <>Sign In <ChevronRight size={16} /></>}
            </button>
          </div>

          {/* Hint */}
          <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            {role === "student" && "Use your register number and the password set by your admin."}
            {role === "faculty" && "Use the username and password provided by the admin."}
            {role === "admin"   && "Default: admin / admin123"}
          </p>
        </div>
      </div>
    </div>
  );
}