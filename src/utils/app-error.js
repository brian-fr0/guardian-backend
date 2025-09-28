const defaultLogger = require("../config/logging");

class AppError {
  static handleError(err, requestId = null) {
    this.log(err, requestId);
  }

  static trySync(action) {
    try {
      action();
    } catch (err) {
      this.handleError(err);
    }
  }

  static async try(action) {
    try {
      await action();
    } catch (err) {
      this.handleError(err);
    }
  }

  static log(err, requestId = null) {
    const payload = {
      ts: new Date().toISOString(),
      level: "error",
      name: err?.name || "Error",
      message: err?.message || "Error",
    };
    if (requestId) payload.id = requestId;
    if (process.env.NODE_ENV !== "production" && err?.stack) {
      payload.stack = err.stack;
    }
    defaultLogger.log(payload);
  }
}

module.exports = AppError;
