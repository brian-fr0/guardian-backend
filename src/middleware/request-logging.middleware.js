const { v4: uuidv4 } = require("uuid");
const defaultLogger = require("../config/logging");

function maskSensitivePath(inputPath = "") {
  if (!inputPath) return inputPath;
  try {
    const u = new URL(inputPath, "http://mask.local"); // base for relative paths
    const qp = u.searchParams;
    for (const k of ["token", "access_token", "refresh_token", "code", "password"]) {
      if (qp.has(k)) qp.set(k, "[redacted]");
    }
    const q = qp.toString();
    return u.pathname + (q ? `?${q}` : "");
  } catch {
    return inputPath.replace(/(token|access_token|refresh_token|code|password)=([^&]+)/gi, "$1=[redacted]");
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function RequestLoggingMiddleware(req, res, next) {
  req.id = req.id || uuidv4();
  const t0 = Date.now();

  res.on("finish", () => {
    const rawPath = req.originalUrl || req.url;
    defaultLogger.http({
      ts: new Date().toISOString(),
      id: req.id,
      method: req.method,
      path: maskSensitivePath(rawPath), // 🔒 redact sensitive query params
      status: res.statusCode,
      ms: Date.now() - t0,
      ip: req.ip,
      ua: req.headers["user-agent"],
    });
  });

  next();
}

module.exports = RequestLoggingMiddleware;
