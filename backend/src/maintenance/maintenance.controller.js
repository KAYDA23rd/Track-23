const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create maintenance ticket
exports.createTicket = async (req, res) => {
  try {
    const { busId, issue } = req.body;

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        busId,
        issue,
      },
    });

    res.status(201).json({
      message: "Maintenance ticket created",
      ticket,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Resolve ticket
exports.resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    res.json({
      message: "Ticket resolved",
      ticket,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// View tickets
exports.getTickets = async (req, res) => {
  const tickets = await prisma.maintenanceTicket.findMany({
    include: {
      bus: true,
    },
  });

  res.json(tickets);
};
