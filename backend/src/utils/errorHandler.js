/**
 * Centralized error handling utility
 * Standardizes error responses and logging across the application
 */

class AppError extends Error {
  constructor(message, statusCode, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handling middleware
 * Catches all errors and returns standardized JSON responses
 */
const errorHandler = (err, req, res, next) => {
  const error = {
    code: err.code || "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? err.message || "An error occurred"
        : err.message,
    statusCode: err.statusCode || 500,
    timestamp: err.timestamp || new Date().toISOString(),
  };

  // Log error details for debugging
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Error:", {
      code: error.code,
      message: error.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  res.status(error.statusCode).json({ error });
};

/**
 * Wrapper for async route handlers to catch errors
 * Usage: router.get("/path", asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Common validation error factory
 */
const validationError = (message, details = {}) => {
  const err = new AppError(message, 400, "VALIDATION_ERROR");
  err.details = details;
  return err;
};

/**
 * Common not found error factory
 */
const notFoundError = (resource) => {
  return new AppError(`${resource} not found`, 404, "NOT_FOUND");
};

/**
 * Common conflict error factory
 */
const conflictError = (message) => {
  return new AppError(message, 409, "CONFLICT");
};

/**
 * Common unauthorized error factory
 */
const unauthorizedError = (message = "Unauthorized") => {
  return new AppError(message, 401, "UNAUTHORIZED");
};

/**
 * Common forbidden error factory
 */
const forbiddenError = (message = "Forbidden") => {
  return new AppError(message, 403, "FORBIDDEN");
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  validationError,
  notFoundError,
  conflictError,
  unauthorizedError,
  forbiddenError,
};
