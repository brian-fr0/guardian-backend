// src/lib/audit.js
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const DATA_DIR = path.join(process.cwd(), "data");
const AUDIT_FILE = path.join(DATA_DIR, "audit.log");

// Ensure data dir and log file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, "", "utf8");

// Mask sensitive query params (signed tokens, refresh tokens, etc.)
function maskSensitivePath(rawPath) {
  if (!rawPath) return rawPath;
  let p = rawPath;
  // token=..., refreshToken=..., access_token=...
  p = p.replace(/(\btoken=)[^&#]+/gi, "$1[redacted]");
  p = p.replace(/(\brefreshToken=)[^&#]+/gi, "$1[redacted]");
  p = p.replace(/(\baccess_token=)[^&#]+/gi, "$1[redacted]");
  return p;
}

// Resolve userId from req or Authorization header if missing
function resolveUserId(req, userIdOverride) {
  if (userIdOverride) return userIdOverride;

  // From req.user (middleware-populated)
  if (typeof req.user === "string") return req.user;
  if (req.user?.sub) return req.user.sub;

  // Fallback: parse Authorization bearer token
  const auth = req.headers?.authorization || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (typeof payload === "object" && payload?.sub) return payload.sub;
    } catch {
      // ignore verification errors — fail-open on userId
    }
  }

  return null;
}

/**
 * Write a single JSON line to data/audit.log
 * @param {import('express').Request} req
 * @param {object} event - { action, entity, entityId, meta }
 * @param {object} [opts] - { userIdOverride?: string }
 */
function logAudit(req, event, opts = {}) {
  const now = new Date();
  const safePath = maskSensitivePath(req.originalUrl || req.url || "");
  const userId = resolveUserId(req, opts.userIdOverride);

  const rec = {
    id: uuidv4(),
    ts: now.toISOString(),
    userId,
    ip: req.ip,
    ua: req.headers?.["user-agent"] || "",
    method: req.method,
    path: safePath,
    action: event.action,          // e.g., "file.upload"
    entity: event.entity || null,  // e.g., "file"
    entityId: event.entityId || null,
    meta: event.meta || null,
  };

  try {
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(rec) + "\n", "utf8");
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[audit] write failed:", e.message);
    }
  }
}

module.exports = { logAudit };
