/**
 * Logging utility using Winston
 * Provides structured logging for debugging and monitoring
 */

const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "track23-backend" },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    // Combined log file
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// Console logging in non-production environments
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : "";
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }),
      ),
    }),
  );
}

module.exports = logger;
