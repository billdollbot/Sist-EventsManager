/**
 * fixBrokenBrochures.js
 * One-time migration: clears brochure_path on events that use local
 * file paths (e.g. /uploads/...) which no longer exist on disk.
 * Cloudinary URLs (https://...) are left untouched.
 *
 * Run: node fixBrokenBrochures.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const MONGO = process.env.MONGO_URI ||
    "mongodb+srv://midhun:midhun123@sistevents.ystmyb0.mongodb.net/?appName=SistEvents";

const eventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.model("Event", eventSchema, "events");

async function run() {
    await mongoose.connect(MONGO);
    console.log("✅  Connected to MongoDB");

    const events = await Event.find({ brochure_path: { $exists: true, $ne: null, $ne: "" } });
    console.log(`Found ${events.length} events with a brochure_path`);

    let fixed = 0;
    for (const ev of events) {
        const p = ev.brochure_path;

        // Skip Cloudinary / external URLs — they are permanent
        if (p && p.startsWith("http")) {
            console.log(`  ✅ OK  (Cloudinary): ${ev.title} → ${p.slice(0, 60)}`);
            continue;
        }

        // Local path — check if the file actually exists on disk
        const absPath = path.join(__dirname, p);
        if (p && !fs.existsSync(absPath)) {
            console.log(`  🗑️  BROKEN (file missing): ${ev.title} → ${p}`);
            await Event.updateOne({ _id: ev._id }, {
                $set: { brochure_path: null, brochure_public_id: null },
            });
            fixed++;
        } else {
            console.log(`  ⚠️  LOCAL (file exists): ${ev.title} → ${p}`);
        }
    }

    console.log(`\n✅  Done. Cleared ${fixed} broken brochure path(s).`);
    console.log("   Affected events will now show a category placeholder instead of a broken image.");
    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
