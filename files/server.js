/**
 * SIST-EVENTS — Backend Server
 * Node.js + Express + Mongoose + Multer + node-cron
 */

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/sist-events";

/* ─────────────────────────────────────────────
   MIDDLEWARE
───────────────────────────────────────────── */
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ─────────────────────────────────────────────
   ENSURE UPLOAD DIRECTORY EXISTS
───────────────────────────────────────────── */
const uploadDir = path.join(__dirname, "uploads", "brochures");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/* ─────────────────────────────────────────────
   MULTER CONFIGURATION
───────────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) cb(null, true);
  else cb(new Error("Only image files are allowed for brochures."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
});

/* ─────────────────────────────────────────────
   MONGOOSE CONNECTION
───────────────────────────────────────────── */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ─────────────────────────────────────────────
   SCHEMAS & MODELS
───────────────────────────────────────────── */

// ── EVENT SCHEMA ──────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      required: true,
      enum: [
        "Technical",
        "Cultural",
        "Workshop",
        "Sports",
        "Seminar",
        "Hackathon",
        "Other",
      ],
    },
    organizer: { type: String, required: true, trim: true },
    event_date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 1000 },
    registration_link: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Must be a valid URL"],
    },
    brochure_path: { type: String, default: null },
    created_by: { type: String, required: true }, // guest name or faculty username
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

// ── FACULTY SCHEMA (seeded statically) ────────
const facultySchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // plain-text for demo; use bcrypt in prod
  name: String,
});

const Faculty = mongoose.model("Faculty", facultySchema);

// Seed one default faculty account on startup
const seedFaculty = async () => {
  const exists = await Faculty.findOne({ username: "admin" });
  if (!exists) {
    await Faculty.create({
      username: "admin",
      password: "sist2024",
      name: "Dr. Faculty Admin",
    });
    console.log("🌱 Default faculty seeded  username: admin  password: sist2024");
  }
};
mongoose.connection.once("open", seedFaculty);

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const deleteFile = (filePath) => {
  if (!filePath) return;
  const abs = path.join(__dirname, filePath);
  fs.unlink(abs, () => {}); // silently ignore missing-file errors
};

/* ─────────────────────────────────────────────
   AUTH ROUTES
───────────────────────────────────────────── */

// POST /api/auth/faculty-login
app.post(
  "/api/auth/faculty-login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required." });

    const faculty = await Faculty.findOne({ username: username.trim() });
    if (!faculty || faculty.password !== password)
      return res.status(401).json({ message: "Invalid credentials." });

    res.json({
      success: true,
      faculty: { username: faculty.username, name: faculty.name },
    });
  })
);

/* ─────────────────────────────────────────────
   PUBLIC EVENT ROUTES
───────────────────────────────────────────── */

// GET /api/events — approved events only (public)
app.get(
  "/api/events",
  asyncHandler(async (_req, res) => {
    const events = await Event.find({ status: "approved" })
      .sort({ event_date: 1 })
      .lean();
    res.json(events);
  })
);

// POST /api/events — submit a new event proposal
app.post(
  "/api/events",
  upload.single("brochure"),
  asyncHandler(async (req, res) => {
    const {
      title,
      category,
      organizer,
      event_date,
      location,
      description,
      registration_link,
      created_by,
    } = req.body;

    const brochure_path = req.file
      ? `/uploads/brochures/${req.file.filename}`
      : null;

    const event = await Event.create({
      title,
      category,
      organizer,
      event_date: new Date(event_date),
      location,
      description,
      registration_link,
      brochure_path,
      created_by,
      status: "pending",
    });

    res.status(201).json({ message: "Event submitted for review.", event });
  })
);

/* ─────────────────────────────────────────────
   ADMIN / FACULTY ROUTES
   (In production, protect with JWT middleware)
───────────────────────────────────────────── */

// GET /api/admin/events — all events with status filter
app.get(
  "/api/admin/events",
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
    res.json(events);
  })
);

// PATCH /api/admin/events/:id/status — approve or reject
app.patch(
  "/api/admin/events/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ message: "Status must be approved or rejected." });

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!event) return res.status(404).json({ message: "Event not found." });

    res.json({ message: `Event ${status}.`, event });
  })
);

// DELETE /api/admin/events/:id — hard delete with brochure cleanup
app.delete(
  "/api/admin/events/:id",
  asyncHandler(async (req, res) => {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });

    deleteFile(event.brochure_path);
    res.json({ message: "Event deleted." });
  })
);

/* ─────────────────────────────────────────────
   SCHEDULED CLEANUP — runs daily at midnight
   Deletes events whose event_date passed > 5 days ago
───────────────────────────────────────────── */
cron.schedule("0 0 * * *", async () => {
  console.log("🧹 Running event cleanup job...");
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 5);

    const stale = await Event.find({ event_date: { $lt: cutoff } });
    for (const ev of stale) deleteFile(ev.brochure_path);

    const result = await Event.deleteMany({ event_date: { $lt: cutoff } });
    console.log(`✅ Cleanup complete. Removed ${result.deletedCount} stale event(s).`);
  } catch (err) {
    console.error("❌ Cleanup job failed:", err);
  }
});

/* ─────────────────────────────────────────────
   GLOBAL ERROR HANDLER
───────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(413).json({ message: "File too large. Max 5 MB." });
  res.status(500).json({ message: err.message || "Internal server error." });
});

/* ─────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────── */
app.listen(PORT, () =>
  console.log(`🚀 SIST-EVENTS server running on http://localhost:${PORT}`)
);
