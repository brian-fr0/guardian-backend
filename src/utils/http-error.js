const HttpResponse = require("./http-response-helper");
const defaultLogger = require("../config/logging");

function maskSensitive(inputPath = "") {
  if (!inputPath) return inputPath;
  try {
    const u = new URL(inputPath, "http://mask.local");
    const params = u.searchParams;
    for (const key of ["token", "access_token", "refresh_token", "code", "password"]) {
      if (params.has(key)) params.set(key, "[redacted]");
    }
    const q = params.toString();
    return u.pathname + (q ? `?${q}` : "");
  } catch {
    return inputPath.replace(/(token|access_token|refresh_token|code|password)=([^&]+)/gi, "$1=[redacted]");
  }
}

class HttpError extends Error {
  code;
  data;
  id;
  path;
  clientMessage;

  /**
   * @param {Object} param0
   * @param {number} [param0.code=500]
   * @param {string} [param0.clientMessage=""]
   * @param {{}} [param0.data={}]
   * @param {string} [param0.id=""]
   * @param {string} [param0.path=""]
   * @param {Error} [err=null]
   */
  constructor(
    { code = 500, clientMessage = "", data = {}, id = "", path = "" },
    err = null,
  ) {
    super(clientMessage || "");

    if (err) {
      this.name = err.name || this.name;
      this.message = err.message || clientMessage || "Error";
      if (err.stack) this.stack = (this.stack || "") + "\n" + err.stack;
      Error.captureStackTrace?.(this, this.constructor);
    } else {
      this.message = clientMessage || "Error";
    }

    this.id = id;
    this.path = path;
    this.code = code;
    this.data = data;
    this.clientMessage = clientMessage;
  }

  /**
   * @param {import("express").Response} res
   */
  handleResponse(res) {
    new HttpResponse(
      this.code,
      { code: this.code, message: this.clientMessage, data: this.data },
      this.clientMessage,
    ).json(res);
  }

  handleLogging() {
    const payload = {
      ts: new Date().toISOString(),
      level: this.code >= 500 ? "error" : "warn", // 🔕 4xx as warn, 5xx as error
      id: this.id || null,
      status: this.code,
      name: this.name || "HttpError",
      message: this.message || this.clientMessage || "Error",
      path: maskSensitive(this.path || ""),
    };

    if (process.env.NODE_ENV !== "production" && this.stack) {
      payload.stack = this.stack;
    }

    defaultLogger.log(payload);
  }
}

module.exports = HttpError;
