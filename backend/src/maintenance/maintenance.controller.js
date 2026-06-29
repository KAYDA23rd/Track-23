const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ticketInclude = {
  bus: {
    include: {
      route: true,
    },
  },
};

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseChecklist = (body) => ({
  brakeChecked: Boolean(body.brakeChecked),
  engineChecked: Boolean(body.engineChecked),
  tireChecked: Boolean(body.tireChecked),
  electricalChecked: Boolean(body.electricalChecked),
  roadTestPassed: Boolean(body.roadTestPassed),
});

exports.createTicket = async (req, res) => {
  try {
    const { busId, issue, workshopPriority } = req.body;

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        busId,
        issue,
        workshopPriority: parseOptionalInt(workshopPriority),
      },
      include: ticketInclude,
    });

    await prisma.bus.update({
      where: { id: busId },
      data: { status: "INACTIVE" },
    });

    res.status(201).json({
      message: "Maintenance ticket created",
      ticket,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["OPEN", "ENROUTE", "RESOLVED"].includes(status)) {
      return res.status(400).json({ error: "Invalid maintenance status" });
    }

    const existing = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: ticketInclude,
    });

    if (!existing) {
      return res.status(404).json({ error: "Maintenance ticket not found" });
    }

    const ticket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status,
        workStartedAt:
          status === "ENROUTE" && !existing.workStartedAt ? new Date() : existing.workStartedAt,
        resolvedAt: status === "RESOLVED" ? new Date() : existing.resolvedAt,
        returnedToServiceAt:
          status === "RESOLVED" ? new Date() : existing.returnedToServiceAt,
      },
      include: ticketInclude,
    });

    if (status === "RESOLVED") {
      await prisma.bus.update({
        where: { id: ticket.busId },
        data: { status: "INACTIVE" },
      });
    } else {
      await prisma.bus.update({
        where: { id: ticket.busId },
        data: { status: "INACTIVE" },
      });
    }

    res.json({
      message: `Ticket moved to ${status}`,
      ticket,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      diagnosis,
      repairNotes,
      partsUsed,
      assignedMechanicName,
      workshopPriority,
      brakeChecked,
      engineChecked,
      tireChecked,
      electricalChecked,
      roadTestPassed,
    } = req.body;

    const ticket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        diagnosis: diagnosis ?? undefined,
        repairNotes: repairNotes ?? undefined,
        partsUsed: partsUsed ?? undefined,
        assignedMechanicName: assignedMechanicName ?? undefined,
        workshopPriority: parseOptionalInt(workshopPriority),
        ...parseChecklist({
          brakeChecked,
          engineChecked,
          tireChecked,
          electricalChecked,
          roadTestPassed,
        }),
      },
      include: ticketInclude,
    });

    res.json({
      message: "Maintenance record updated",
      ticket,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      diagnosis,
      repairNotes,
      partsUsed,
      assignedMechanicName,
      workshopPriority,
      brakeChecked,
      engineChecked,
      tireChecked,
      electricalChecked,
      roadTestPassed,
    } = req.body;

    const ticket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        returnedToServiceAt: new Date(),
        diagnosis: diagnosis ?? undefined,
        repairNotes: repairNotes ?? undefined,
        partsUsed: partsUsed ?? undefined,
        assignedMechanicName: assignedMechanicName ?? undefined,
        workshopPriority: parseOptionalInt(workshopPriority),
        ...parseChecklist({
          brakeChecked,
          engineChecked,
          tireChecked,
          electricalChecked,
          roadTestPassed,
        }),
      },
      include: ticketInclude,
    });

    await prisma.bus.update({
      where: { id: ticket.busId },
      data: { status: "INACTIVE" },
    });

    res.json({
      message: "Ticket resolved",
      ticket,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTickets = async (req, res) => {
  const tickets = await prisma.maintenanceTicket.findMany({
    include: ticketInclude,
    orderBy: [{ createdAt: "desc" }],
  });

  res.json(tickets);
};
