const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// CREATE bus
exports.createBus = async (req, res) => {
  try {
    const { plateNumber, model, routeId } = req.body;

    const bus = await prisma.bus.create({
      data: {
        plateNumber,
        model,
        routeId,
        status: "STANDBY",
      },
    });

    res.status(201).json({
      message: "Bus created successfully",
      bus,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET all buses
exports.getBuses = async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      include: { route: true },
    });
    res.json(buses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// UPDATE bus
exports.updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { plateNumber, model, routeId, status } = req.body;

    const bus = await prisma.bus.update({
      where: { id },
      data: { plateNumber, model, routeId, status },
    });

    res.json(bus);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE bus
exports.deleteBus = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.bus.delete({
      where: { id },
    });

    res.json({ message: "Bus deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
