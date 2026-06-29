const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const hasActiveMaintenanceTicket = async (busId) => {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: {
      busId,
      status: { in: ["OPEN", "ENROUTE"] },
    },
  });

  return Boolean(ticket);
};

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

    const busesWithMaintenanceFlag = await Promise.all(
      buses.map(async (bus) => ({
        ...bus,
        isUnderRepair: await hasActiveMaintenanceTicket(bus.id),
        status: (await hasActiveMaintenanceTicket(bus.id)) ? "INACTIVE" : bus.status,
      })),
    );

    res.json(busesWithMaintenanceFlag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// UPDATE bus
exports.updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { plateNumber, model, routeId, status } = req.body;

    const underRepair = await hasActiveMaintenanceTicket(id);

    if (underRepair && status && status !== "INACTIVE") {
      return res.status(409).json({
        error: "Bus remains inactive while repair is in progress. Resolve maintenance before changing status.",
      });
    }

    const bus = await prisma.bus.update({
      where: { id },
      data: {
        plateNumber,
        model,
        routeId,
        status: underRepair ? "INACTIVE" : status,
      },
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
