import { Home, Search, Plus, CalendarDays, User } from "lucide-react";

export default function BottomNav({ view, setView, onHostClick, guestName, onGuestLogin }) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">

      {/* Events */}
      <button className={`bn-item ${view === "feed" ? "active" : ""}`}
        onClick={() => setView("feed")} aria-label="Events">
        <span className="bn-icon"><Home size={20} /></span>
        <span className="bn-label">Events</span>
      </button>

      {/* Explore */}
      <button className="bn-item" onClick={() => setView("feed")} aria-label="Explore">
        <span className="bn-icon"><Search size={20} /></span>
        <span className="bn-label">Explore</span>
      </button>

      {/* HOST — raised centre */}
      <button className="bn-host" onClick={onHostClick} aria-label="Host an event">
        <div className="bn-host-circle">
          <Plus size={22} color="#000" strokeWidth={2.5} />
        </div>
        <span className="bn-host-label">Host</span>
      </button>

      {/* My Events */}
      <button className={`bn-item ${view === "my" ? "active" : ""}`}
        onClick={() => setView("feed")} aria-label="My Events">
        <span className="bn-icon"><CalendarDays size={20} /></span>
        <span className="bn-label">My Events</span>
      </button>

      {/* Profile / Sign In */}
      <button className={`bn-item ${view === "profile" ? "active" : ""}`}
        onClick={() => { if (!guestName) onGuestLogin(); }}
        aria-label={guestName ? "Profile" : "Sign In"}>
        <span className="bn-icon">
          {guestName ? (
            <span style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "var(--teal-glow)",
              border: "1px solid rgba(45,212,191,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.55rem", fontWeight: 700, color: "var(--teal-400)",
            }}>
              {guestName.slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <User size={20} />
          )}
        </span>
        <span className="bn-label">
          {guestName ? guestName.split(" ")[0] : "Sign In"}
        </span>
      </button>

    </nav>
  );
}
