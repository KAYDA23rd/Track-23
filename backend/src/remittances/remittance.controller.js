const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_EXPECTED_AMOUNT = 25000;

const getOrCreateRemittanceConfig = async () => {
  return prisma.remittanceConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      expectedAmount: DEFAULT_EXPECTED_AMOUNT,
    },
  });
};

// Driver/Admin: Create remittance
exports.createRemittance = async (req, res) => {
  try {
    const { busId, driverId, reportedAmount } = req.body;

    if (!busId || !driverId || reportedAmount === undefined) {
      return res.status(400).json({ error: "busId, driverId, and reportedAmount are required" });
    }

    const config = await getOrCreateRemittanceConfig();

    const remittance = await prisma.remittance.create({
      data: {
        busId,
        driverId,
        date: new Date(),
        expectedAmount: config.expectedAmount,
        reportedAmount: Number(reportedAmount),
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

// View expected amount setting
exports.getExpectedAmount = async (req, res) => {
  try {
    const config = await getOrCreateRemittanceConfig();
    res.json({ expectedAmount: config.expectedAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Super Admin: Update expected amount setting
exports.updateExpectedAmount = async (req, res) => {
  try {
    const { expectedAmount } = req.body;

    if (!Number.isFinite(Number(expectedAmount)) || Number(expectedAmount) < 0) {
      return res.status(400).json({ error: "expectedAmount must be a valid non-negative number" });
    }

    const config = await prisma.remittanceConfig.upsert({
      where: { id: 1 },
      update: { expectedAmount: Number(expectedAmount) },
      create: {
        id: 1,
        expectedAmount: Number(expectedAmount),
      },
    });

    res.json({
      message: "Expected amount updated",
      expectedAmount: config.expectedAmount,
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
