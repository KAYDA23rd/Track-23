const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// CREATE driver
exports.createDriver = async (req, res) => {
  try {
    const { name, phone, licenseNo } = req.body;

    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        licenseNo,
      },
    });

    res.status(201).json({
      message: "Driver created successfully",
      driver,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET all drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany();
    res.json(drivers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// UPDATE driver
exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, licenseNo } = req.body;

    const driver = await prisma.driver.update({
      where: { id },
      data: { name, phone, licenseNo },
    });

    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE driver
exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.driver.delete({
      where: { id },
    });

    res.json({ message: "Driver deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
