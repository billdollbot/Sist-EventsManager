# SIST-EVENTS 🎓

> **Centralized Campus Event Portal** — Sathyabama Institute of Science and Technology

A full-stack MERN application that lets students discover campus events and faculty manage approvals through a clean digital workflow.

---

## ✦ Features

| Feature | Details |
|---|---|
| **Mobile-First UI** | Responsive grid (1→2→3 cols), 44px touch targets, haptic scale feedback, safe-area padding |
| **Digital Approval Workflow** | New events land in a "Pending" queue; faculty approve or reject with one tap |
| **Guest Access** | Students enter their name (no password) — stored in LocalStorage |
| **Faculty Login** | Username + password → Admin dashboard with review queue and stats |
| **Brochure Upload** | Drag-and-drop or tap to upload poster images (JPEG/PNG/GIF/WebP, max 5 MB) |
| **Category Filters** | Filter chips for Technical, Cultural, Workshop, Sports, Seminar, Hackathon |
| **Auto Cleanup** | Cron job deletes events + their brochures 5 days after the event date |
| **Toast Notifications** | Non-blocking feedback on all actions |

---

## 📁 Project Structure

```
SIST-EVENTS/
├── server.js          ← Express + Mongoose backend
├── package.json       ← Backend dependencies
├── uploads/
│   └── brochures/     ← Auto-created; stores uploaded poster images
└── src/               ← React frontend source
    ├── App.jsx         ← Root app, routing, events feed
    ├── App.css         ← Full design system (tokens, components, animations)
    ├── HostEvent.jsx   ← Event proposal form with file upload
    └── TeacherDashboard.jsx ← Faculty login + admin panel
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas URI

### 2. Backend

```bash
# From project root
npm install
# start with live-reload (recommended for dev)
npm run dev
# or plain node
npm start
```

The server starts on **http://localhost:5000**.

**Default faculty credentials** (seeded automatically on first run):
```
Username: admin
Password: sist2024
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

React app starts on **http://localhost:3000**.  
Vite proxies `/api` and `/uploads` to the backend automatically.

### 4. Environment Variables

Backend (optional, create a `.env` in root):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sist-events
CLIENT_URL=http://localhost:3000
```

Frontend (optional, create `client/.env`):
```env
VITE_API_URL=http://localhost:5000
# Leave blank when using Vite dev proxy
```

---

## 🗄️ Database Models

### Event
| Field | Type | Notes |
|---|---|---|
| `title` | String | max 120 chars |
| `category` | Enum | Technical, Cultural, Workshop, Sports, Seminar, Hackathon, Other |
| `organizer` | String | Club or dept name |
| `event_date` | Date | |
| `location` | String | |
| `description` | String | max 1000 chars |
| `registration_link` | String | Optional, must be valid URL |
| `brochure_path` | String | Relative URL, e.g. `/uploads/brochures/xyz.jpg` |
| `created_by` | String | Guest name or faculty username |
| `status` | Enum | `pending` · `approved` · `rejected` |

### Faculty
| Field | Type | Notes |
|---|---|---|
| `username` | String | Unique |
| `password` | String | Plain-text for demo — **use bcrypt in production** |
| `name` | String | Display name |

---

## 🔌 API Reference

### Public
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/events` | All approved events (sorted by date) |
| `POST` | `/api/events` | Submit new event (`multipart/form-data`) |
| `POST` | `/api/auth/faculty-login` | Faculty authentication |

### Admin
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/events?status=pending` | All events, filterable by status |
| `PATCH` | `/api/admin/events/:id/status` | `{ status: "approved" \| "rejected" }` |
| `DELETE` | `/api/admin/events/:id` | Hard delete + brochure cleanup |

---

## 🛡️ Production Checklist

- [ ] Hash passwords with **bcrypt** (`bcryptjs`)
- [ ] Add **JWT middleware** to all `/api/admin/*` routes
- [ ] Set `NODE_ENV=production` and use a secrets manager for credentials
- [ ] Replace `confirm()` in delete flow with a proper modal
- [ ] Configure **CORS** to your deployed domain only
- [ ] Use **MongoDB Atlas** or a managed database
- [ ] Store uploads in **AWS S3 / Cloudflare R2** instead of local disk
- [ ] Rate-limit the auth and event-submission endpoints

---

## 🎨 Design System

All design tokens, components, animations, and mobile utilities live in `src/App.css`.  
Key CSS variables:

```css
--c-navy        /* Primary background */
--c-amber       /* Accent / CTA color  */
--c-teal        /* Success / approved  */
--c-rose        /* Danger / rejected   */
--ff-display    /* Syne — display font */
--ff-body       /* DM Sans — body font */
```

Touch feedback: add `.touch-shrink` to any interactive element for the haptic-style scale-down on press.

---

*Built with ❤️ for Sathyabama University students.*
