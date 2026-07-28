/**
 * SDC Club Events Hub — server.js v5
 * Public: anyone can view approved events (no login for students)
 * Roles:  admin | faculty
 * NEW: In-app registration with dynamic fields + limits
 */

const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const { uploadToCloudinary, deleteFromCloudinary } = require("./cloudinaryHelper");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || "mongodb+srv://midhun:midhun123@sistevents.ystmyb0.mongodb.net/?appName=SistEvents";

/* ── Middleware ─────────────────────────────────── */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://sist-events-manager-iq96.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ── Upload dir ─────────────────────────────────── */
const uploadDir = path.join(__dirname, "uploads", "brochures");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/* ── Multer ─────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (_r, _f, cb) => cb(null, uploadDir),
  filename: (_r, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  fileFilter: (_r, file, cb) => {
    /jpeg|jpg|png|gif|webp/.test(file.mimetype) ? cb(null, true) : cb(new Error("Images only"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ── DB ─────────────────────────────────────────── */
mongoose.connect(MONGO)
  .then(() => console.log("✅  MongoDB connected"))
  .catch(err => console.error("❌  MongoDB error:", err));

/* ══════════════════════════════════════════════════
   SCHEMAS
══════════════════════════════════════════════════ */

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, default: "Super Admin" },
}, { timestamps: true });
const Admin = mongoose.model("Admin", adminSchema);

const facultySchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, trim: true, default: "" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
const Faculty = mongoose.model("Faculty", facultySchema);

/* SDC Clubs list — stored in DB so admin can manage */
const clubSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true, trim: true },
  shortCode: { type: String, trim: true, default: "" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
const Club = mongoose.model("Club", clubSchema);

/* ── Registration Field sub-schema ─────────────── */
const registrationFieldSchema = new mongoose.Schema({
  label:       { type: String, required: true, trim: true },
  type:        { type: String, required: true, enum: ["text", "email", "number", "select", "textarea", "tel"] },
  required:    { type: Boolean, default: true },
  placeholder: { type: String, default: "" },
  options:     [{ type: String }],   // for select type
}, { _id: true });

const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 120 },
  category:    { type: String, required: true, enum: ["Technical", "Cultural", "Workshop", "Sports", "Seminar", "Hackathon", "Other"] },
  club:        { type: String, required: true, trim: true },
  organizer:   { type: String, required: true, trim: true },
  event_date:  { type: Date, required: true },
  location:    { type: String, required: true, trim: true },
  description: { type: String, required: true, maxlength: 1000 },

  /* Registration — either external link OR built-in form */
  registration_link:   { type: String, trim: true, default: "" },
  registration_fields: [registrationFieldSchema],
  registration_limit:  { type: Number, default: 0 },   // 0 = unlimited
  registration_count:  { type: Number, default: 0 },

  brochure_path:     { type: String, default: null },
  brochure_cloud_id: { type: String, default: null },
  created_by:        { type: String, required: true },
  created_by_id:     { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  status:            { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });
const Event = mongoose.model("Event", eventSchema);

/* ── Registration schema ───────────────────────── */
const registrationSchema = new mongoose.Schema({
  eventId:      { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  formData:     { type: mongoose.Schema.Types.Mixed, required: true },  // { fieldLabel: value, ... }
  email:        { type: String, trim: true, lowercase: true, default: "" },  // for duplicate detection
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for duplicate prevention: one email per event
registrationSchema.index({ eventId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $ne: "" } } });

const Registration = mongoose.model("Registration", registrationSchema);

/* ── Seed defaults ──────────────────────────────── */
mongoose.connection.once("open", async () => {
  /* Admin */
  if (!await Admin.findOne({ username: "admin" })) {
    await Admin.create({ username: "admin", password: "admin123", name: "Super Admin" });
    console.log("🌱  Admin seeded → admin / admin123");
  }
  /* Default SDC clubs */
  const defaultClubs = [
    { name: "Software Development Club (SDC)", shortCode: "SDC" },
    { name: "IEEE Student Branch", shortCode: "IEEE" },
    { name: "CSI Student Chapter", shortCode: "CSI" },
    { name: "Google Developer Student Club", shortCode: "GDSC" },
    { name: "Coding Club", shortCode: "CC" },
    { name: "Robotics Club", shortCode: "RC" },
    { name: "Cultural Club", shortCode: "CULT" },
    { name: "Sports Committee", shortCode: "SPORT" },
    { name: "Literary Club", shortCode: "LIT" },
    { name: "Photography Club", shortCode: "PHOTO" },
    { name: "Entrepreneurship Cell", shortCode: "E-CELL" },
    { name: "NSS Unit", shortCode: "NSS" },
    { name: "NCC Wing", shortCode: "NCC" },
    { name: "Department of CSE", shortCode: "CSE" },
    { name: "Department of IT", shortCode: "IT" },
    { name: "Department of ECE", shortCode: "ECE" },
    { name: "Department of Mechanical", shortCode: "MECH" },
    { name: "Department of Civil", shortCode: "CIVIL" },
    { name: "Other", shortCode: "OTHER" },
  ];
  for (const c of defaultClubs) {
    if (!await Club.findOne({ name: c.name })) await Club.create(c);
  }
  console.log("🌱  Default clubs seeded");
});

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const delFile = p => { if (p) fs.unlink(path.join(__dirname, p), () => { }); };

/* ══════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════ */
app.post("/api/auth/admin-login", wrap(async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username: username?.trim() });
  if (!admin || admin.password !== password) return res.status(401).json({ message: "Invalid admin credentials." });
  res.json({ success: true, role: "admin", user: { id: admin._id, name: admin.name, username: admin.username } });
}));

app.post("/api/auth/faculty-login", wrap(async (req, res) => {
  const { username, password } = req.body;
  const f = await Faculty.findOne({ username: username?.trim(), isActive: true });
  if (!f || f.password !== password) return res.status(401).json({ message: "Invalid faculty credentials." });
  res.json({ success: true, role: "faculty", user: { id: f._id, name: f.name, username: f.username, department: f.department } });
}));

/* ══════════════════════════════════════════════════
   PUBLIC ROUTES (no auth required)
══════════════════════════════════════════════════ */

/* Approved events — public */
app.get("/api/events", wrap(async (_req, res) => {
  const events = await Event.find({ status: "approved" }).sort({ event_date: 1 }).lean();
  res.json(events);
}));

/* Upcoming events for ticker — public */
app.get("/api/events/upcoming", wrap(async (_req, res) => {
  const now = new Date();
  const events = await Event.find({ status: "approved", event_date: { $gte: now } }).sort({ event_date: 1 }).limit(10).lean();
  res.json(events);
}));

/* All clubs — public */
app.get("/api/clubs", wrap(async (_req, res) => {
  const clubs = await Club.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json(clubs);
}));

/* ══════════════════════════════════════════════════
   PUBLIC REGISTRATION ROUTES
══════════════════════════════════════════════════ */

/* Get registration count for an event */
app.get("/api/events/:id/registration-count", wrap(async (req, res) => {
  const event = await Event.findById(req.params.id).select("registration_count registration_limit registration_fields").lean();
  if (!event) return res.status(404).json({ message: "Event not found." });
  res.json({
    count: event.registration_count || 0,
    limit: event.registration_limit || 0,
    hasForm: event.registration_fields && event.registration_fields.length > 0,
  });
}));

/* Register for an event — public */
app.post("/api/events/:id/register", wrap(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found." });
  if (event.status !== "approved") return res.status(400).json({ message: "Event is not open for registration." });
  if (!event.registration_fields || event.registration_fields.length === 0) {
    return res.status(400).json({ message: "This event does not have an in-app registration form." });
  }

  // Check limit
  if (event.registration_limit > 0 && event.registration_count >= event.registration_limit) {
    return res.status(400).json({ message: "Registration is full. Maximum limit reached." });
  }

  const { formData } = req.body;
  if (!formData || typeof formData !== "object") {
    return res.status(400).json({ message: "Form data is required." });
  }

  // Validate required fields
  const missingFields = [];
  let emailValue = "";
  for (const field of event.registration_fields) {
    const val = formData[field.label];
    if (field.required && (!val || String(val).trim() === "")) {
      missingFields.push(field.label);
    }
    if (field.type === "email" && val) {
      emailValue = String(val).trim().toLowerCase();
    }
  }
  if (missingFields.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(", ")}` });
  }

  // Email validation
  if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  // Check for duplicate (by email if available)
  if (emailValue) {
    const existing = await Registration.findOne({ eventId: event._id, email: emailValue });
    if (existing) {
      return res.status(409).json({ message: "You have already registered for this event with this email." });
    }
  }

  // Create registration
  const registration = await Registration.create({
    eventId: event._id,
    formData,
    email: emailValue,
  });

  // Increment count atomically
  await Event.findByIdAndUpdate(event._id, { $inc: { registration_count: 1 } });

  res.status(201).json({ message: "Registration successful! 🎉", registration });
}));

/* ══════════════════════════════════════════════════
   FACULTY ROUTES
══════════════════════════════════════════════════ */
app.post("/api/faculty/events", upload.single("brochure"), wrap(async (req, res) => {
  const { title, category, club, organizer, event_date, location, description,
    registration_link, registration_fields, registration_limit,
    faculty_id, faculty_name } = req.body;

  let brochure_path = null;
  let brochure_cloud_id = null;

  if (req.file) {
    try {
      const localPath = path.join(uploadDir, req.file.filename);
      const result = await uploadToCloudinary(localPath);
      brochure_path = result.directUrl;
      brochure_cloud_id = result.publicId;
      // Remove temp local file
      fs.unlink(localPath, () => { });
    } catch (err) {
      console.error("Cloudinary upload failed, falling back to local:", err.message);
      brochure_path = `/uploads/brochures/${req.file.filename}`;
    }
  }

  // Parse registration_fields if it's a JSON string
  let parsedFields = [];
  if (registration_fields) {
    try {
      parsedFields = typeof registration_fields === "string"
        ? JSON.parse(registration_fields)
        : registration_fields;
    } catch { parsedFields = []; }
  }

  const event = await Event.create({
    title, category, club, organizer,
    event_date: new Date(event_date),
    location, description,
    registration_link: registration_link || "",
    registration_fields: parsedFields,
    registration_limit: parseInt(registration_limit) || 0,
    brochure_path, brochure_cloud_id,
    created_by: faculty_name || "Faculty",
    created_by_id: faculty_id || null,
    status: "pending",
  });
  res.status(201).json({ message: "Event submitted for review.", event });
}));

app.get("/api/faculty/events/:facultyId", wrap(async (req, res) => {
  const events = await Event.find({ created_by_id: req.params.facultyId }).sort({ createdAt: -1 }).lean();
  res.json(events);
}));

/* ── Faculty: view registrations for their event ── */
app.get("/api/faculty/events/:eventId/registrations", wrap(async (req, res) => {
  const event = await Event.findById(req.params.eventId).lean();
  if (!event) return res.status(404).json({ message: "Event not found." });

  const registrations = await Registration.find({ eventId: req.params.eventId })
    .sort({ registeredAt: -1 }).lean();
  res.json({
    event: {
      _id: event._id,
      title: event.title,
      registration_fields: event.registration_fields,
      registration_limit: event.registration_limit,
      registration_count: event.registration_count,
    },
    registrations,
  });
}));

/* ── Faculty: delete a registration ────────────── */
app.delete("/api/faculty/events/:eventId/registrations/:regId", wrap(async (req, res) => {
  const reg = await Registration.findOneAndDelete({
    _id: req.params.regId,
    eventId: req.params.eventId,
  });
  if (!reg) return res.status(404).json({ message: "Registration not found." });

  // Decrement count
  await Event.findByIdAndUpdate(req.params.eventId, { $inc: { registration_count: -1 } });
  res.json({ message: "Registration removed." });
}));

/* ── Faculty: export registrations as CSV ──────── */
app.get("/api/faculty/events/:eventId/registrations/export", wrap(async (req, res) => {
  const event = await Event.findById(req.params.eventId).lean();
  if (!event) return res.status(404).json({ message: "Event not found." });

  const registrations = await Registration.find({ eventId: req.params.eventId })
    .sort({ registeredAt: 1 }).lean();

  // Build CSV
  const fields = (event.registration_fields || []).map(f => f.label);
  const header = ["S.No", ...fields, "Registered At"].join(",");
  const rows = registrations.map((r, i) => {
    const vals = fields.map(f => {
      const v = r.formData?.[f] ?? "";
      // Escape CSV values
      return `"${String(v).replace(/"/g, '""')}"`;
    });
    const date = new Date(r.registeredAt).toLocaleString("en-IN");
    return [i + 1, ...vals, `"${date}"`].join(",");
  });

  const csv = [header, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, "_")}_registrations.csv"`);
  res.send(csv);
}));

/* ══════════════════════════════════════════════════
   ADMIN — EVENTS
══════════════════════════════════════════════════ */
app.get("/api/admin/events", wrap(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(await Event.find(filter).sort({ createdAt: -1 }).lean());
}));

app.patch("/api/admin/events/:id/status", wrap(async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status." });
  const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!event) return res.status(404).json({ message: "Not found." });
  res.json({ message: `Event ${status}.`, event });
}));

app.delete("/api/admin/events/:id", wrap(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: "Not found." });
  // Also delete all registrations for this event
  await Registration.deleteMany({ eventId: event._id });
  if (event.brochure_cloud_id) {
    deleteFromCloudinary(event.brochure_cloud_id);
  } else {
    delFile(event.brochure_path);
  }
  res.json({ message: "Deleted." });
}));

/* ── Admin: view registrations for any event ───── */
app.get("/api/admin/events/:eventId/registrations", wrap(async (req, res) => {
  const event = await Event.findById(req.params.eventId).lean();
  if (!event) return res.status(404).json({ message: "Event not found." });

  const registrations = await Registration.find({ eventId: req.params.eventId })
    .sort({ registeredAt: -1 }).lean();
  res.json({
    event: {
      _id: event._id,
      title: event.title,
      registration_fields: event.registration_fields,
      registration_limit: event.registration_limit,
      registration_count: event.registration_count,
    },
    registrations,
  });
}));

/* ══════════════════════════════════════════════════
   ADMIN — FACULTY
══════════════════════════════════════════════════ */
app.get("/api/admin/faculty", wrap(async (_req, res) => {
  res.json(await Faculty.find().sort({ createdAt: -1 }).lean());
}));

app.post("/api/admin/faculty", wrap(async (req, res) => {
  const { username, password, name, department } = req.body;
  if (!username || !password || !name) return res.status(400).json({ message: "Username, password and name required." });
  if (await Faculty.findOne({ username: username.trim() })) return res.status(409).json({ message: "Username already exists." });
  const f = await Faculty.create({ username: username.trim(), password, name: name.trim(), department: department?.trim() || "" });
  res.status(201).json({ message: "Faculty added.", faculty: f });
}));

app.patch("/api/admin/faculty/:id", wrap(async (req, res) => {
  const { name, password, department, isActive } = req.body;
  const u = {};
  if (name !== undefined) u.name = name.trim();
  if (password) u.password = password;
  if (department !== undefined) u.department = department.trim();
  if (isActive !== undefined) u.isActive = isActive;
  const f = await Faculty.findByIdAndUpdate(req.params.id, u, { new: true });
  if (!f) return res.status(404).json({ message: "Not found." });
  res.json({ message: "Updated.", faculty: f });
}));

app.delete("/api/admin/faculty/:id", wrap(async (req, res) => {
  if (!await Faculty.findByIdAndDelete(req.params.id)) return res.status(404).json({ message: "Not found." });
  res.json({ message: "Faculty removed." });
}));

/* ══════════════════════════════════════════════════
   ADMIN — CLUBS
══════════════════════════════════════════════════ */
app.get("/api/admin/clubs", wrap(async (_req, res) => {
  res.json(await Club.find().sort({ name: 1 }).lean());
}));

app.post("/api/admin/clubs", wrap(async (req, res) => {
  const { name, shortCode } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Club name required." });
  if (await Club.findOne({ name: name.trim() })) return res.status(409).json({ message: "Club already exists." });
  const c = await Club.create({ name: name.trim(), shortCode: shortCode?.trim() || "" });
  res.status(201).json({ message: "Club added.", club: c });
}));

app.patch("/api/admin/clubs/:id", wrap(async (req, res) => {
  const { name, shortCode, isActive } = req.body;
  const u = {};
  if (name !== undefined) u.name = name.trim();
  if (shortCode !== undefined) u.shortCode = shortCode.trim();
  if (isActive !== undefined) u.isActive = isActive;
  const c = await Club.findByIdAndUpdate(req.params.id, u, { new: true });
  if (!c) return res.status(404).json({ message: "Not found." });
  res.json({ message: "Updated.", club: c });
}));

app.delete("/api/admin/clubs/:id", wrap(async (req, res) => {
  if (!await Club.findByIdAndDelete(req.params.id)) return res.status(404).json({ message: "Not found." });
  res.json({ message: "Club removed." });
}));

/* ── Cron cleanup ───────────────────────────────── */
cron.schedule("0 0 * * *", async () => {
  const cut = new Date(); cut.setDate(cut.getDate() - 5);
  const stale = await Event.find({ event_date: { $lt: cut } });
  for (const e of stale) {
    // Delete registrations for stale events
    await Registration.deleteMany({ eventId: e._id });
    if (e.brochure_cloud_id) {
      await deleteFromCloudinary(e.brochure_cloud_id);
    } else {
      delFile(e.brochure_path);
    }
  }
  const r = await Event.deleteMany({ event_date: { $lt: cut } });
  console.log(`🧹  Cleanup: removed ${r.deletedCount} stale event(s)`);
});

/* ── Error handler ──────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error." });
});

const server = app.listen(PORT, () =>
  console.log(`🚀  SDC Events Hub running → http://localhost:${PORT}`)
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌  Port ${PORT} is already in use. Kill other node processes and retry.`);
    console.error(`    Run: taskkill /F /IM node.exe`);
    process.exit(1);   // Exit cleanly so nodemon can restart
  } else {
    throw err;
  }
});
