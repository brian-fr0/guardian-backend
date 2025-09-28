const { Router } = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { logAudit } = require("../lib/audit"); // 🔎 audit helper

const router = Router();

const UP_DIR = path.join(process.cwd(), "data", "uploads");
const DL_SECRET = process.env.FILE_DL_SECRET || process.env.JWT_ACCESS_SECRET;

function verifyDownloadToken(token) {
  try { return jwt.verify(token, DL_SECRET); } catch { return null; }
}

function findFilePath(fid) {
  const jpg = path.join(UP_DIR, fid + ".jpg");
  const png = path.join(UP_DIR, fid + ".png");
  if (fs.existsSync(jpg)) return { fullPath: jpg, mime: "image/jpeg", ext: ".jpg" };
  if (fs.existsSync(png)) return { fullPath: png, mime: "image/png", ext: ".png" };
  return null;
}

router.get("/download", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ message: "Missing token" });

  const payload = verifyDownloadToken(String(token));
  if (!payload) {
    // 🔎 Audit: invalid/expired token attempt
    logAudit(req, {
      action: "file.download_denied",
      entity: "file",
      entityId: null,
      meta: { reason: "invalid_or_expired_token" },
    });
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  const f = findFilePath(payload.fid);
  if (!f) {
    // 🔎 Audit: file missing
    logAudit(req, {
      action: "file.download_missing",
      entity: "file",
      entityId: payload.fid,
    });
    return res.status(404).json({ message: "File not found" });
  }

  // 🔎 Audit: successful download (use the user id from the token)
  logAudit(
    req,
    {
      action: "file.download",
      entity: "file",
      entityId: payload.fid,
      meta: { mime: f.mime },
    },
    { userIdOverride: payload.sub }
  );

  res.setHeader("Content-Type", f.mime);
  res.setHeader("Content-Disposition", `attachment; filename="${payload.fid}${f.ext}"`);
  fs.createReadStream(f.fullPath).pipe(res);
});

module.exports = router;
