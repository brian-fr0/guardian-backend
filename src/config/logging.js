const winston = require("winston");
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(process.cwd(), "data", "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const defaultLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, "http.log"),
      level: "http",          // access logs
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,              // keep ~100MB
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

module.exports = defaultLogger;
