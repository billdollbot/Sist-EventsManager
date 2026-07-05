import { Shield, LogOut, User, CheckCircle, Plus } from "lucide-react";

export default function Navbar({ guestName, view, setView, onGuestLogin, onGuestLogout, onHostClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <button className="nav-logo tap" onClick={() => setView("feed")}>
          <span className="nav-logo-dot" />
          SIST<span style={{ color: "var(--amber-500)" }}>EVENTS</span>
        </button>

        {/* Desktop actions — hidden on mobile via .nav-desktop-only */}
        <div className="nav-actions nav-desktop-only">
          <button className="btn btn-secondary btn-sm tap" onClick={onHostClick}>
            <Plus size={14} /> Host Event
          </button>

          {guestName ? (
            <>
              <div className="nav-user-pill">
                <CheckCircle size={12} /> {guestName}
              </div>
              <button className="btn btn-ghost btn-icon btn-sm tap"
                onClick={onGuestLogout} title="Sign out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm tap" onClick={onGuestLogin}>
              <User size={15} /> Sign In
            </button>
          )}

          <button
            className={`btn btn-sm tap ${view === "admin" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView(view === "admin" ? "feed" : "admin")}>
            <Shield size={15} /> Faculty
          </button>
        </div>

        {/* Mobile: show Faculty button only */}
        <div className="nav-actions" style={{ display: "none" }}
          /* hidden — bottom nav handles everything on mobile */ />

      </div>
    </nav>
  );
}
