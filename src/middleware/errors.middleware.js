// src/middleware/errors.middleware.js
const errorService = require("../services/error-service");
const { CriticalError } = require("../utils/critical-error");
const https = require("https");
const http = require("http");

// Tiny helper to send POST JSON to a webhook (works with Discord)
function postWebhook(url, payload) {
  try {
    const u = new URL(url);
    const body = JSON.stringify(payload);
    const opts = {
      method: "POST",
      hostname: u.hostname,
      port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + (u.search || ""),
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 2500,
    };
    const reqFn = u.protocol === "https:" ? https.request : http.request;
    const r = reqFn(opts, () => {});
    r.on("error", () => {});
    r.write(body);
    r.end();
  } catch {
    // swallow webhook errors so they don't crash the server
  }
}

// Build Discord-friendly JSON
function buildDiscordPayload({ status, req, err }) {
  const env = process.env.NODE_ENV || "development";
  const title = status >= 500 ? `CRITICAL ${status}` : `${status}`;
  const shortMsg = (err?.message || "Server error").toString().slice(0, 300);
  const rid = req.id || "-";
  const path = req.originalUrl || req.url || "-";
  const now = new Date().toISOString();

  const content = `🚨 **${title}** ${req.method} ${path} (${env})`;

  return {
    username: "Guardian Alerts",
    content,
    embeds: [
      {
        title: "Server Error",
        color: 0xE02424, // red
        timestamp: now,
        fields: [
          { name: "Status", value: String(status), inline: true },
          { name: "Method", value: String(req.method || "-"), inline: true },
          { name: "Path", value: path, inline: false },
          { name: "Request ID", value: String(rid), inline: false },
          { name: "Message", value: "```\n" + shortMsg + "\n```", inline: false },
        ],
      },
    ],
  };
}

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function HttpErrorMiddleware(err, req, res, next) {
  const httpError = errorService.handleError(err, req.id, req.path);
  httpError.handleLogging();

  const url = process.env.ALERT_WEBHOOK_URL;
  const status = httpError.status || httpError.code || 500;
  const isCritical = err instanceof CriticalError || status >= 500;

  // 🚨 Send alert to Discord if critical and webhook configured
  if (isCritical && url) {
    const payload = buildDiscordPayload({ status, req, err });
    postWebhook(url, payload);
  }

  // Preserve your existing CriticalError flow
  if (err instanceof CriticalError) {
    return next(err);
  }

  return httpError.handleResponse(res);
}

module.exports = HttpErrorMiddleware;
