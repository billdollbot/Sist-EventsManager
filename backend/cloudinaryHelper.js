/**
 * Cloudinary helper — upload / delete brochure images
 *
 * Requires one env var:
 *   CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
 */

const cloudinary = require("cloudinary").v2;
const path = require("path");

/**
 * Upload a local file to Cloudinary.
 * @param {string} filePath  – absolute path to the temp file
 * @returns {{ publicId: string, directUrl: string }}
 */
async function uploadToCloudinary(filePath) {
    try {
        // Cloudinary automatically infers credentials from CLOUDINARY_URL env var.
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "sist_events_brochures",
            use_filename: true,
            unique_filename: true,
            overwrite: true,
        });

        console.log(`☁️  Uploaded to Cloudinary: ${result.public_id} → ${result.secure_url}`);

        return {
            publicId: result.public_id,
            directUrl: result.secure_url,
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}

/**
 * Delete a file from Cloudinary.
 * @param {string} publicId – Cloudinary public ID
 */
async function deleteFromCloudinary(publicId) {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`🗑️  Deleted from Cloudinary: ${publicId}`);
    } catch (err) {
        console.warn(`⚠️  Cloudinary delete failed for ${publicId}:`, err.message);
    }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
