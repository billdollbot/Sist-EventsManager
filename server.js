/**
 * SIST-EVENTS — server.js (v3)
 * Roles: admin | faculty | student
 */

const express    = require("express");
const mongoose   = require("mongoose");
const multer     = require("multer");
const cors       = require("cors");
const path       = require("path");
const fs         = require("fs");
const cron       = require("node-cron");

const app   = express();
const PORT  = process.env.PORT  || 5000;
const MONGO = process.env.MONGO_URI || "mongodb+srv://midhun:midhun123@sistevents.ystmyb0.mongodb.net/?appName=SistEvents";

/* ── Middleware ─────────────────────────────────── */
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ── Upload dir ─────────────────────────────────── */
const uploadDir = path.join(__dirname, "uploads", "brochures");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/* ── Multer ─────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (_r, _f, cb) => cb(null, uploadDir),
  filename:    (_r, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`),
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

/* Admin */
const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name:     { type: String, default: "Super Admin" },
}, { timestamps: true });
const Admin = mongoose.model("Admin", adminSchema);

/* Faculty */
const facultySchema = new mongoose.Schema({
  username:   { type: String, unique: true, required: true, trim: true },
  password:   { type: String, required: true },
  name:       { type: String, required: true, trim: true },
  department: { type: String, trim: true, default: "" },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });
const Faculty = mongoose.model("Faculty", facultySchema);

/* Student */
const studentSchema = new mongoose.Schema({
  register_number: { type: String, unique: true, required: true, trim: true, uppercase: true },
  password:        { type: String, required: true },
  name:            { type: String, required: true, trim: true },
  department:      { type: String, trim: true, default: "" },
  year:            { type: String, enum: ["1","2","3","4","PG"], default: "1" },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true });
const Student = mongoose.model("Student", studentSchema);

/* Event */
const eventSchema = new mongoose.Schema({
  title:             { type: String, required: true, trim: true, maxlength: 120 },
  category:          { type: String, required: true, enum: ["Technical","Cultural","Workshop","Sports","Seminar","Hackathon","Other"] },
  organizer:         { type: String, required: true, trim: true },
  event_date:        { type: Date,   required: true },
  location:          { type: String, required: true, trim: true },
  description:       { type: String, required: true, maxlength: 1000 },
  registration_link: { type: String, trim: true },
  brochure_path:     { type: String, default: null },
  created_by:        { type: String, required: true },
  created_by_id:     { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  status:            { type: String, enum: ["pending","approved","rejected"], default: "pending" },
}, { timestamps: true });
const Event = mongoose.model("Event", eventSchema);

/* ── Seed default admin ─────────────────────────── */
mongoose.connection.once("open", async () => {
  const exists = await Admin.findOne({ username: "admin" });
  if (!exists) {
    await Admin.create({ username: "admin", password: "admin123", name: "Super Admin" });
    console.log("🌱  Admin seeded  →  admin / admin123");
  }
});

/* ── Helper ─────────────────────────────────────── */
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const delFile = p => { if (p) fs.unlink(path.join(__dirname, p), () => {}); };

/* ══════════════════════════════════════════════════
   AUTH ROUTES
══════════════════════════════════════════════════ */

/* POST /api/auth/admin-login */
app.post("/api/auth/admin-login", wrap(async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username: username?.trim() });
  if (!admin || admin.password !== password)
    return res.status(401).json({ message: "Invalid admin credentials." });
  res.json({ success: true, role: "admin", user: { id: admin._id, name: admin.name, username: admin.username } });
}));

/* POST /api/auth/faculty-login */
app.post("/api/auth/faculty-login", wrap(async (req, res) => {
  const { username, password } = req.body;
  const faculty = await Faculty.findOne({ username: username?.trim(), isActive: true });
  if (!faculty || faculty.password !== password)
    return res.status(401).json({ message: "Invalid faculty credentials." });
  res.json({ success: true, role: "faculty", user: { id: faculty._id, name: faculty.name, username: faculty.username, department: faculty.department } });
}));

/* POST /api/auth/student-login */
app.post("/api/auth/student-login", wrap(async (req, res) => {
  const { register_number, password } = req.body;
  const student = await Student.findOne({ register_number: register_number?.trim().toUpperCase(), isActive: true });
  if (!student || student.password !== password)
    return res.status(401).json({ message: "Invalid register number or password." });
  res.json({ success: true, role: "student", user: { id: student._id, name: student.name, register_number: student.register_number, department: student.department, year: student.year } });
}));

/* ══════════════════════════════════════════════════
   PUBLIC EVENT ROUTES
══════════════════════════════════════════════════ */

/* GET /api/events — approved events (students + faculty) */
app.get("/api/events", wrap(async (_req, res) => {
  const events = await Event.find({ status: "approved" }).sort({ event_date: 1 }).lean();
  res.json(events);
}));

/* ══════════════════════════════════════════════════
   FACULTY ROUTES
══════════════════════════════════════════════════ */

/* POST /api/faculty/events — create event (faculty only) */
app.post("/api/faculty/events", upload.single("brochure"), wrap(async (req, res) => {
  const { title, category, organizer, event_date, location, description, registration_link, faculty_id, faculty_name } = req.body;
  const brochure_path = req.file ? `/uploads/brochures/${req.file.filename}` : null;

  const event = await Event.create({
    title, category, organizer,
    event_date: new Date(event_date),
    location, description, registration_link,
    brochure_path,
    created_by:    faculty_name || "Faculty",
    created_by_id: faculty_id  || null,
    status: "pending",
  });
  res.status(201).json({ message: "Event submitted for admin review.", event });
}));

/* GET /api/faculty/events/:facultyId — events by this faculty */
app.get("/api/faculty/events/:facultyId", wrap(async (req, res) => {
  const events = await Event.find({ created_by_id: req.params.facultyId }).sort({ createdAt: -1 }).lean();
  res.json(events);
}));

/* ══════════════════════════════════════════════════
   ADMIN — EVENT MANAGEMENT
══════════════════════════════════════════════════ */

app.get("/api/admin/events", wrap(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
  res.json(events);
}));

app.patch("/api/admin/events/:id/status", wrap(async (req, res) => {
  const { status } = req.body;
  if (!["approved","rejected"].includes(status))
    return res.status(400).json({ message: "Status must be approved or rejected." });
  const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!event) return res.status(404).json({ message: "Event not found." });
  res.json({ message: `Event ${status}.`, event });
}));

app.delete("/api/admin/events/:id", wrap(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found." });
  delFile(event.brochure_path);
  res.json({ message: "Event deleted." });
}));

/* ══════════════════════════════════════════════════
   ADMIN — FACULTY MANAGEMENT
══════════════════════════════════════════════════ */

/* GET all faculty */
app.get("/api/admin/faculty", wrap(async (_req, res) => {
  const list = await Faculty.find().sort({ createdAt: -1 }).lean();
  res.json(list);
}));

/* POST add faculty */
app.post("/api/admin/faculty", wrap(async (req, res) => {
  const { username, password, name, department } = req.body;
  if (!username || !password || !name)
    return res.status(400).json({ message: "Username, password and name are required." });

  const exists = await Faculty.findOne({ username: username.trim() });
  if (exists) return res.status(409).json({ message: "Username already exists." });

  const faculty = await Faculty.create({ username: username.trim(), password, name: name.trim(), department: department?.trim() || "" });
  res.status(201).json({ message: "Faculty added.", faculty });
}));

/* PATCH update faculty */
app.patch("/api/admin/faculty/:id", wrap(async (req, res) => {
  const { name, password, department, isActive } = req.body;
  const update = {};
  if (name)       update.name       = name.trim();
  if (password)   update.password   = password;
  if (department !== undefined) update.department = department.trim();
  if (isActive   !== undefined) update.isActive   = isActive;

  const faculty = await Faculty.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!faculty) return res.status(404).json({ message: "Faculty not found." });
  res.json({ message: "Faculty updated.", faculty });
}));

/* DELETE faculty */
app.delete("/api/admin/faculty/:id", wrap(async (req, res) => {
  const faculty = await Faculty.findByIdAndDelete(req.params.id);
  if (!faculty) return res.status(404).json({ message: "Faculty not found." });
  res.json({ message: "Faculty removed." });
}));

/* ══════════════════════════════════════════════════
   ADMIN — STUDENT MANAGEMENT
══════════════════════════════════════════════════ */

/* GET all students */
app.get("/api/admin/students", wrap(async (_req, res) => {
  const list = await Student.find().sort({ createdAt: -1 }).lean();
  res.json(list);
}));

/* POST add student */
app.post("/api/admin/students", wrap(async (req, res) => {
  const { register_number, password, name, department, year } = req.body;
  if (!register_number || !password || !name)
    return res.status(400).json({ message: "Register number, password and name are required." });

  const exists = await Student.findOne({ register_number: register_number.trim().toUpperCase() });
  if (exists) return res.status(409).json({ message: "Register number already exists." });

  const student = await Student.create({
    register_number: register_number.trim().toUpperCase(),
    password, name: name.trim(),
    department: department?.trim() || "",
    year: year || "1",
  });
  res.status(201).json({ message: "Student added.", student });
}));

/* PATCH update student */
app.patch("/api/admin/students/:id", wrap(async (req, res) => {
  const { name, password, department, year, isActive } = req.body;
  const update = {};
  if (name)     update.name     = name.trim();
  if (password) update.password = password;
  if (department !== undefined) update.department = department.trim();
  if (year)     update.year     = year;
  if (isActive !== undefined)   update.isActive   = isActive;

  const student = await Student.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!student) return res.status(404).json({ message: "Student not found." });
  res.json({ message: "Student updated.", student });
}));

/* DELETE student */
app.delete("/api/admin/students/:id", wrap(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found." });
  res.json({ message: "Student removed." });
}));

/* ── Cron: delete events 5 days after event_date ── */
cron.schedule("0 0 * * *", async () => {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 5);
  const stale = await Event.find({ event_date: { $lt: cutoff } });
  stale.forEach(ev => delFile(ev.brochure_path));
  const r = await Event.deleteMany({ event_date: { $lt: cutoff } });
  console.log(`🧹  Cleanup: removed ${r.deletedCount} stale event(s)`);
});

/* ── Error handler ──────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error." });
});

app.listen(PORT, () => console.log(`🚀  SIST-EVENTS running on http://localhost:${PORT}`));