/**
 * Cloudinary helper — upload / delete brochure images
 *
 * Uses explicit env vars (works regardless of CLOUDINARY_URL):
 *   CLOUDINARY_CLOUD_NAME=...
 *   CLOUDINARY_API_KEY=...
 *   CLOUDINARY_API_SECRET=...
 */

const cloudinary = require("cloudinary").v2;

// Explicitly configure so we're not relying on CLOUDINARY_URL parsing
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const configured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (!configured) {
    console.warn("⚠️  Cloudinary env vars missing — image uploads will be disabled.");
} else {
    console.log(`☁️  Cloudinary ready (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`);
}

/**
 * Upload a local file to Cloudinary.
 * @param {string} filePath – absolute path to the temp file
 * @returns {{ publicId: string, directUrl: string } | null}
 */
async function uploadToCloudinary(filePath) {
    if (!configured) {
        console.warn("Cloudinary not configured; skipping upload.");
        return null;
    }
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "sist_events_brochures",
            use_filename: true,
            unique_filename: true,
            overwrite: true,
        });
        console.log(`☁️  Uploaded to Cloudinary: ${result.public_id} → ${result.secure_url}`);
        return { publicId: result.public_id, directUrl: result.secure_url };
    } catch (error) {
        console.error("Cloudinary upload error:", error.message);
        throw error;
    }
}

/**
 * Delete a file from Cloudinary.
 * @param {string} publicId – Cloudinary public ID
 */
async function deleteFromCloudinary(publicId) {
    if (!configured || !publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`🗑️  Deleted from Cloudinary: ${publicId}`);
    } catch (err) {
        console.warn(`⚠️  Cloudinary delete failed for ${publicId}:`, err.message);
    }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
