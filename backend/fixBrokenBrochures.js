/**
 * fixBrokenBrochures.js
 * Clears brochure_path on events that use local file paths (/uploads/...)
 * which no longer exist on disk. Cloudinary URLs (https://...) are kept.
 *
 * Run: node fixBrokenBrochures.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const MONGO = process.env.MONGO_URI;

const eventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.model("Event", eventSchema, "events");

async function run() {
    await mongoose.connect(MONGO);
    console.log("✅  Connected to MongoDB\n");

    const events = await Event.find({}).lean();
    console.log(`Found ${events.length} total events\n`);

    let fixed = 0;
    for (const ev of events) {
        const p = ev.brochure_path;

        if (!p) {
            console.log(`  ⬜ NO IMAGE: "${ev.title}"`);
            continue;
        }

        // Cloudinary / external URL — permanent, leave untouched
        if (p.startsWith("http")) {
            console.log(`  ✅ CLOUDINARY OK: "${ev.title}" → ${p.slice(0, 55)}...`);
            continue;
        }

        // Local path — check if the file still exists on disk
        const absPath = path.join(__dirname, p.replace(/^\//, ""));
        const exists = fs.existsSync(absPath);

        if (!exists) {
            console.log(`  🗑️  CLEARING broken local path: "${ev.title}" → ${p}`);
            await Event.updateOne(
                { _id: ev._id },
                { $unset: { brochure_path: "", brochure_cloud_id: "", brochure_public_id: "" } }
            );
            fixed++;
        } else {
            console.log(`  ⚠️  LOCAL (file still exists): "${ev.title}" → ${p}`);
        }
    }

    console.log(`\n✅  Done. Cleared ${fixed} broken brochure path(s).`);
    if (fixed > 0) {
        console.log("   Those events now show a category placeholder instead of a broken image.");
        console.log("   Re-upload posters via Admin Console → Edit Event to restore them.");
    }
    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
