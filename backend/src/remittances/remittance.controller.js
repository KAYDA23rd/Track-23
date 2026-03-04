const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Driver/Admin: Create remittance
exports.createRemittance = async (req, res) => {
  try {
    const { busId, driverId, expectedAmount, reportedAmount } = req.body;

    const remittance = await prisma.remittance.create({
      data: {
        busId,
        driverId,
        date: new Date(),
        expectedAmount,
        reportedAmount,
      },
    });

    res.status(201).json({
      message: "Remittance submitted",
      remittance,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Approve remittance
exports.approveRemittance = async (req, res) => {
  try {
    const { id } = req.params;

    const remittance = await prisma.remittance.update({
      where: { id },
      data: { approved: true },
    });

    res.json({
      message: "Remittance approved",
      remittance,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// View all remittances
exports.getRemittances = async (req, res) => {
  const remittances = await prisma.remittance.findMany({
    include: {
      bus: true,
      driver: true,
    },
  });

  res.json(remittances);
};
