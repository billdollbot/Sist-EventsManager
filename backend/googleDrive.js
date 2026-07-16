/**
 * Google Drive helper — upload / delete brochure images
 *
 * Requires two env vars:
 *   GOOGLE_SERVICE_ACCOUNT_KEY  – path to the service-account JSON key file
 *   GOOGLE_DRIVE_FOLDER_ID      – ID of the shared Drive folder
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

let driveClient = null;

/** Authenticate and return a cached Drive client */
function getDrive() {
  if (driveClient) return driveClient;

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyPath) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY env var is not set.");

  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(keyPath),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  driveClient = google.drive({ version: "v3", auth });
  return driveClient;
}

/**
 * Upload a local file to Google Drive, make it publicly readable.
 * @param {string} filePath  – absolute path to the temp file
 * @param {string} mimeType  – e.g. "image/png"
 * @returns {{ fileId: string, directUrl: string }}
 */
async function uploadToDrive(filePath, mimeType) {
  const drive = getDrive();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID env var is not set.");

  // 1. Upload
  const res = await drive.files.create({
    requestBody: {
      name: path.basename(filePath),
      parents: [folderId],
    },
    media: {
      mimeType,
      body: fs.createReadStream(filePath),
    },
    fields: "id",
  });

  const fileId = res.data.id;

  // 2. Make publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  // Direct-embed URL for images
  const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

  console.log(`☁️  Uploaded to Google Drive: ${fileId} → ${directUrl}`);
  return { fileId, directUrl };
}

/**
 * Delete a file from Google Drive.
 * @param {string} fileId – Google Drive file ID
 */
async function deleteFromDrive(fileId) {
  if (!fileId) return;
  try {
    const drive = getDrive();
    await drive.files.delete({ fileId });
    console.log(`🗑️  Deleted from Google Drive: ${fileId}`);
  } catch (err) {
    // File may already be gone — log but don't crash
    console.warn(`⚠️  Drive delete failed for ${fileId}:`, err.message);
  }
}

module.exports = { uploadToDrive, deleteFromDrive };
