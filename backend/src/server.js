// Load environment variables from .env file
require("dotenv").config();

// Import the Express application configuration
const app = require("./app");
const logger = require("./utils/logger");
const { getPrismaClient } = require("./config/database");

// Define the port from environment variable or default to 4000
const PORT = process.env.PORT || 4000;

// Initialize database connection
const prisma = getPrismaClient();

// Start the server and listen for incoming requests
const server = app.listen(PORT, () => {
  logger.info(`✅ Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});

/**
 * Graceful shutdown handler
 * Closes database connection and HTTP server cleanly
 */
const gracefulShutdown = async (signal) => {
  logger.info(`⏹️  Received ${signal}, starting graceful shutdown...`);

  server.close(async () => {
    try {
      // Disconnect database
      await prisma.$disconnect();
      logger.info("✅ Database connection closed");
      process.exit(0);
    } catch (err) {
      logger.error("❌ Error during graceful shutdown:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("❌ Forced shutdown after 30 seconds");
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("❌ Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});
