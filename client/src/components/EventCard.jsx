import { CalendarDays, MapPin, User, ExternalLink, Zap } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BADGE = {
  Technical:"badge-technical", Cultural:"badge-cultural", Workshop:"badge-workshop",
  Sports:"badge-sports", Seminar:"badge-seminar", Hackathon:"badge-hackathon", Other:"badge-other",
};
const EMOJI = {
  Technical:"⚙️", Cultural:"🎭", Workshop:"🛠️",
  Sports:"🏆", Seminar:"📚", Hackathon:"💻", Other:"✨",
};
const GRAD = {
  Technical:"grad-tech", Cultural:"grad-culture", Workshop:"grad-workshop",
  Sports:"grad-sports",  Seminar:"grad-seminar",  Hackathon:"grad-hackathon", Other:"grad-other",
};

const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{
  weekday:"short", day:"numeric", month:"short", year:"numeric",
});
const fmtTime = d => new Date(d).toLocaleTimeString("en-IN",{
  hour:"2-digit", minute:"2-digit", hour12:true,
});

export default function EventCard({ event }) {
  const upcoming = new Date(event.event_date) >= new Date();

  return (
    <article className="event-card card-enter tap">

      {/* Image / placeholder */}
      <div className="card-img-wrap">
        {event.brochure_path ? (
          <img className="card-img"
            src={`${API}${event.brochure_path}`}
            alt={`${event.title} poster`}
            loading="lazy" />
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

        {/* Title */}
        <h3 className="card-title">{event.title}</h3>

        {/* Meta */}
        <div className="card-meta">
          <div className="card-meta-row"><User size={12} /><span className="truncate">{event.organizer}</span></div>
          <div className="card-meta-row"><CalendarDays size={12} /><span>{fmtDate(event.event_date)} · {fmtTime(event.event_date)}</span></div>
          <div className="card-meta-row"><MapPin size={12} /><span className="truncate">{event.location}</span></div>
        </div>

        {/* Description */}
        {event.description && <p className="card-desc">{event.description}</p>}
      </div>

      {/* Register CTA */}
      {event.registration_link && (
        <div className="card-footer">
          <a href={event.registration_link} target="_blank"
            rel="noopener noreferrer" className="register-btn">
            Register Now <ExternalLink size={13} />
          </a>
        </div>
      )}
    </article>
  );
}