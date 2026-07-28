import { useState } from "react";
import { CalendarDays, MapPin, User, ExternalLink, Zap, X, ZoomIn, Users } from "lucide-react";
import RegistrationModal from "./RegistrationModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BADGE = {
  Technical: "badge-technical", Cultural: "badge-cultural", Workshop: "badge-workshop",
  Sports: "badge-sports", Seminar: "badge-seminar", Hackathon: "badge-hackathon", Other: "badge-other",
};
const EMOJI = {
  Technical: "⚙️", Cultural: "🎭", Workshop: "🛠️",
  Sports: "🏆", Seminar: "📚", Hackathon: "💻", Other: "✨",
};
const GRAD = {
  Technical: "grad-tech", Cultural: "grad-culture", Workshop: "grad-workshop",
  Sports: "grad-sports", Seminar: "grad-seminar", Hackathon: "grad-hackathon", Other: "grad-other",
};

const fmtDate = d => new Date(d).toLocaleDateString("en-IN", {
  weekday: "short", day: "numeric", month: "short", year: "numeric",
});
const fmtTime = d => new Date(d).toLocaleTimeString("en-IN", {
  hour: "2-digit", minute: "2-digit", hour12: true,
});

/* ── Brochure Lightbox ──────────────────────────── */
function BrochureLightbox({ src, title, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "fade-in 0.2s ease",
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 720,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12, gap: 12,
        }}>
        <p style={{
          fontFamily: "var(--ff-display)", fontWeight: 700,
          fontSize: "0.95rem", color: "var(--text-primary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {title}
        </p>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <a href={src} target="_blank" rel="noopener noreferrer"
            className="btn btn-secondary btn-sm tap" style={{ textDecoration: "none" }}>
            <ExternalLink size={14} /> Open
          </a>
          <button className="btn btn-ghost btn-icon btn-sm tap" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 720, maxHeight: "80dvh",
          borderRadius: "var(--r-lg)", overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
        <img src={src} alt={title}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
      <p style={{ marginTop: 14, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
        Click anywhere outside to close
      </p>
    </div>
  );
}

/* ── Event Card ─────────────────────────────────── */
export default function EventCard({ event, showToast }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [regModalOpen, setRegModalOpen] = useState(false);

  const upcoming = new Date(event.event_date) >= new Date();
  const brochureSrc = event.brochure_path
    ? event.brochure_path.startsWith("http") ? event.brochure_path : `${API}${event.brochure_path}`
    : null;

  const hasInAppForm = event.registration_fields && event.registration_fields.length > 0;
  const hasExternalLink = event.registration_link && event.registration_link.trim();
  const limit = event.registration_limit || 0;
  const count = event.registration_count || 0;
  const isFull = limit > 0 && count >= limit;

  return (
    <>
      {/* Lightbox */}
      {lightboxOpen && brochureSrc && (
        <BrochureLightbox
          src={brochureSrc}
          title={event.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Registration Modal */}
      {regModalOpen && hasInAppForm && (
        <RegistrationModal
          event={event}
          onClose={() => setRegModalOpen(false)}
          onSuccess={() => {
            showToast?.("Registration successful! 🎉", "success");
          }}
        />
      )}

      <article className="event-card card-enter">
        {/* Image / placeholder */}
        <div
          className="card-img-wrap"
          style={{ position: "relative", cursor: brochureSrc ? "zoom-in" : "default" }}
          onClick={() => brochureSrc && setLightboxOpen(true)}
          role={brochureSrc ? "button" : undefined}
          aria-label={brochureSrc ? `View brochure for ${event.title}` : undefined}
          tabIndex={brochureSrc ? 0 : undefined}
          onKeyDown={e => e.key === "Enter" && brochureSrc && setLightboxOpen(true)}>
          {brochureSrc ? (
            <>
              <img
                className="card-img"
                src={brochureSrc}
                alt={`${event.title} poster`}
                loading="lazy"
                onError={e => {
                  e.currentTarget.style.display = "none";
                  const wrap = e.currentTarget.closest(".card-img-wrap");
                  if (wrap) {
                    wrap.style.cursor = "default";
                    const ph = document.createElement("div");
                    ph.className = `card-placeholder ${GRAD[event.category] || "grad-other"}`;
                    ph.textContent = EMOJI[event.category] || "📅";
                    wrap.appendChild(ph);
                  }
                }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0)", display: "flex",
                alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }} className="card-img-overlay">
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0, transition: "opacity 0.2s", backdropFilter: "blur(4px)",
                }} className="card-img-zoom-icon">
                  <ZoomIn size={18} color="#fff" />
                </div>
              </div>
            </>
          ) : (
            <div className={`card-placeholder ${GRAD[event.category] || "grad-other"}`}>
              {EMOJI[event.category] || "📅"}
            </div>
          )}
        </div>

        <div className="card-body">
          {/* Badges */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className={`badge ${BADGE[event.category] || "badge-other"}`}>
              {event.category}
            </span>
            {upcoming && (
              <span className="badge badge-upcoming">
                <Zap size={9} /> Upcoming
              </span>
            )}
          </div>

          {/* Club name */}
          {event.club && (
            <p className="card-club">🏛 {event.club}</p>
          )}

          {/* Title */}
          <h3 className="card-title">{event.title}</h3>

          {/* Meta */}
          <div className="card-meta">
            <div className="card-meta-row">
              <User size={12} />
              <span className="truncate">{event.organizer}</span>
            </div>
            <div className="card-meta-row">
              <CalendarDays size={12} />
              <span>{fmtDate(event.event_date)} · {fmtTime(event.event_date)}</span>
            </div>
            <div className="card-meta-row">
              <MapPin size={12} />
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="card-desc">{event.description}</p>
          )}

          {/* Registration info bar */}
          {hasInAppForm && limit > 0 && (
            <div className={`card-reg-info ${isFull ? "card-reg-full" : ""}`}>
              <Users size={12} />
              <span>{count}/{limit}</span>
              <div className="card-reg-bar">
                <div
                  className="card-reg-fill"
                  style={{ width: `${Math.min((count / limit) * 100, 100)}%` }}
                />
              </div>
              {isFull && <span style={{ color: "var(--rose)", fontWeight: 600, fontSize: "0.7rem" }}>FULL</span>}
            </div>
          )}
        </div>

        {/* Register CTA */}
        <div className="card-footer">
          {hasInAppForm ? (
            <button
              className={`register-btn ${isFull ? "full" : ""}`}
              onClick={() => !isFull && setRegModalOpen(true)}
              disabled={isFull}
            >
              {isFull ? (
                <>Registration Full</>
              ) : (
                <>Register Now <Users size={13} /></>
              )}
            </button>
          ) : hasExternalLink ? (
            <a
              href={event.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="register-btn">
              Register Now <ExternalLink size={13} />
            </a>
          ) : null}
        </div>
      </article>

      {/* Hover styles */}
      <style>{`
        .card-img-wrap:hover .card-img-overlay {
          background: rgba(0,0,0,0.3) !important;
        }
        .card-img-wrap:hover .card-img-zoom-icon {
          opacity: 1 !important;
        }
        .card-img-wrap:active .card-img-zoom-icon {
          transform: scale(0.9);
        }
      `}</style>
    </>
  );
}