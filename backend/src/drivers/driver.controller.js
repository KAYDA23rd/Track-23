// Prisma ORM for database operations
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * CREATE NEW DRIVER
 * Add a new driver to the system
 */
exports.createDriver = async (req, res) => {
  try {
    // Extract driver details from request
    const { name, phone, licenseNo } = req.body;

    // Create driver record in database
    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        licenseNo,
      },
    });

    // Return newly created driver
    res.status(201).json({
      message: "Driver created successfully",
      driver,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET ALL DRIVERS
 * Retrieve list of all drivers in the system
 */
exports.getDrivers = async (req, res) => {
  try {
    // Fetch all driver records from database
    const drivers = await prisma.driver.findMany();
    res.json(drivers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * UPDATE DRIVER
 * Modify driver information
 */
exports.updateDriver = async (req, res) => {
  try {
    // Extract driver ID from URL parameters
    const { id } = req.params;
    // Extract fields to update from request body
    const { name, phone, licenseNo } = req.body;

    // Update driver record in database
    const driver = await prisma.driver.update({
      where: { id },
      data: { name, phone, licenseNo },
    });

    // Return updated driver
    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * DELETE DRIVER
 * Remove a driver from the system
 */
exports.deleteDriver = async (req, res) => {
  try {
    // Extract driver ID from URL parameters
    const { id } = req.params;

    // Delete driver record from database
    await prisma.driver.delete({
      where: { id },
    });

    // Return confirmation message
    res.json({ message: "Driver deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
