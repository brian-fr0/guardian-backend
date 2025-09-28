const { Router } = require("express");
const filesController = require("../controllers/files.controller");

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const { logAudit } = require("../lib/audit"); // 🔎 audit helper

const fileRouter = Router();

/**
 * Upload config: memory -> sharp -> disk
 * Limits: JPEG/PNG only, max 5MB
 */
const storage = multer.memoryStorage();
function fileFilter(_req, file, cb) {
  const ok = ["image/jpeg", "image/png"].includes(file.mimetype);
  cb(ok ? null : new Error("Only JPEG/PNG images are allowed"), ok);
}
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Save uploads OUTSIDE any public/static dir
const UP_DIR = path.join(process.cwd(), "data", "uploads");
if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive: true });

function id(len = 16) {
  return crypto.randomBytes(len).toString("hex");
}

function findFilePath(fileId) {
  const jpg = path.join(UP_DIR, fileId + ".jpg");
  const png = path.join(UP_DIR, fileId + ".png");
  if (fs.existsSync(jpg)) return { fullPath: jpg, mime: "image/jpeg", ext: ".jpg" };
  if (fs.existsSync(png)) return { fullPath: png, mime: "image/png", ext: ".png" };
  return null;
}

/** ── Signed URL settings ───────────────────────────────────────────── */
const TTL_MIN = Number(process.env.SECURE_DOWNLOAD_TTL_MIN || 10);
const DL_SECRET = process.env.FILE_DL_SECRET || process.env.JWT_ACCESS_SECRET;

function signDownloadToken({ fileId, userId }) {
  return jwt.sign({ fid: fileId, sub: userId || "unknown" }, DL_SECRET, {
    expiresIn: `${TTL_MIN}m`,
  });
}

/** ── Routes ───────────────────────────────────────────────────────── */

// KEEP your existing route
fileRouter.get("/", filesController.get);

/**
 * POST /upload
 * - Accepts: multipart/form-data (field "file")
 * - Auto-orients, strips EXIF (sharp default), saves as .jpg or .png
 * - Returns { id, ext, size }
 */
fileRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const isPng = req.file.mimetype === "image/png";
    const fileId = id();
    const ext = isPng ? ".png" : ".jpg";
    const filePath = path.join(UP_DIR, fileId + ext);

    let pipeline = sharp(req.file.buffer).rotate(); // auto-orient
    pipeline = isPng
      ? pipeline.png({ compressionLevel: 9 })
      : pipeline.jpeg({ quality: 85, mozjpeg: true });

    const output = await pipeline.toBuffer();
    fs.writeFileSync(filePath, output);

    // 🔎 Audit: file upload
    logAudit(req, {
      action: "file.upload",
      entity: "file",
      entityId: fileId,
      meta: { ext, size: output.length },
    });

    return res.json({ id: fileId, ext, size: output.length });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Upload failed" });
  }
});

/**
 * POST /:id/sign
 * - Requires auth (this router is mounted under an authenticated group)
 * - Returns a time-limited signed URL for downloading the file
 *   { url: "/api/v1/files/download?token=...", expiresInMin: <TTL> }
 */
fileRouter.post("/:id/sign", (req, res) => {
  const { id: fileId } = req.params;
  const exists = findFilePath(fileId);
  if (!exists) return res.status(404).json({ message: "File not found" });

  // Robustly resolve user id from req.user (handles number/string/object)
  const userId =
    (typeof req.user === "number" || typeof req.user === "string")
      ? String(req.user)
      : (req.user && req.user.sub != null)
      ? String(req.user.sub)
      : "unknown";

  // Ensure we always sign with a string sub
  const token = signDownloadToken({ fileId, userId: String(userId) });

  // 🔎 Audit: signed URL created
  logAudit(req, {
    action: "file.sign_url",
    entity: "file",
    entityId: fileId,
    meta: { ttlMin: TTL_MIN },
  });

  return res.json({
    url: `/api/v1/files/download?token=${token}`,
    expiresInMin: TTL_MIN,
  });
});

// Note: /download is NOT here (it's public-only in files.public.route)

module.exports = fileRouter;
