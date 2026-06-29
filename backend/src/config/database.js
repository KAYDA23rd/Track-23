/**
 * Prisma database client singleton
 * Ensures only one database connection is maintained throughout the application
 */

const { PrismaClient } = require("@prisma/client");

let prisma;

/**
 * Get or create Prisma client instance
 * Returns the same instance on subsequent calls
 */
const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  return prisma;
};

module.exports = {
  getPrismaClient,
};
