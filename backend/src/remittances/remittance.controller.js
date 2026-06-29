const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
// Central expected amount gives the business one operational remittance target
// that drivers cannot override from the client.
const DEFAULT_EXPECTED_AMOUNT = 25000;

const getOrCreateRemittanceConfig = async () =>
  prisma.remittanceConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      expectedAmount: DEFAULT_EXPECTED_AMOUNT,
    },
  });

const getDriverByUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (!user?.phone) return null;

  return prisma.driver.findUnique({
    where: { phone: user.phone },
  });
};

const getCurrentShiftForDriver = async (driverId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // The latest shift for today is treated as the remittance source of truth.
  // This avoids drivers remitting against old or unrelated assignments.
  return prisma.shift.findFirst({
    where: {
      driverId,
      startTime: { gte: today },
    },
    include: {
      bus: {
        include: { route: true },
      },
      driver: true,
    },
    orderBy: [{ startTime: "desc" }],
  });
};

const ensureOwnDriverAccess = async (req, submittedDriverId) => {
  if (req.user.role !== "DRIVER") return null;

  const driver = await getDriverByUser(req.user.id);
  if (!driver) {
    const error = new Error("Driver profile not linked to this account");
    error.statusCode = 403;
    throw error;
  }

  // Drivers are only allowed to remit against their own linked profile even if
  // a different driverId is sent from the client.
  if (driver.id !== submittedDriverId) {
    const error = new Error("Drivers can only submit remittance for their own profile");
    error.statusCode = 403;
    throw error;
  }

  return driver;
};

exports.createRemittance = async (req, res) => {
  try {
    const { busId, driverId, reportedAmount, varianceReason } = req.body;

    if (!busId || !driverId || reportedAmount === undefined) {
      return res.status(400).json({ error: "busId, driverId, and reportedAmount are required" });
    }

    await ensureOwnDriverAccess(req, driverId);

    const config = await getOrCreateRemittanceConfig();
    const shift = await getCurrentShiftForDriver(driverId);

    // Remittance is tied to the assigned bus and completed shift so cash cannot
    // be posted independently of the dispatch record.
    if (!shift || shift.busId !== busId) {
      return res.status(409).json({
        error: "Remittance must match the driver's assigned shift and bus",
      });
    }

    if (shift.status !== "COMPLETED") {
      return res.status(409).json({
        error: "Remittance can only be submitted after the shift is marked completed",
      });
    }

    // One remittance per shift keeps reconciliation deterministic.
    const existingRemittance = await prisma.remittance.findFirst({
      where: { shiftId: shift.id },
    });

    if (existingRemittance) {
      return res.status(409).json({
        error: "A remittance has already been submitted for this shift",
      });
    }

    const numericReportedAmount = Number(reportedAmount);
    const varianceAmount = numericReportedAmount - config.expectedAmount;
    const requiresReason = varianceAmount !== 0;

    // Variance notes are mandatory whenever cash does not match the expected
    // amount so supervisors/admins have an audit trail before review.
    if (requiresReason && !varianceReason?.trim()) {
      return res.status(400).json({
        error: "Variance reason is required when remittance does not match expected amount",
      });
    }

    const remittance = await prisma.remittance.create({
      data: {
        busId,
        driverId,
        shiftId: shift.id,
        date: new Date(),
        expectedAmount: config.expectedAmount,
        reportedAmount: numericReportedAmount,
        varianceAmount,
        varianceReason: varianceReason?.trim() || null,
      },
      include: {
        bus: {
          include: { route: true },
        },
        driver: true,
        shift: true,
      },
    });

    res.status(201).json({
      message: "Remittance submitted",
      remittance,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

exports.getExpectedAmount = async (req, res) => {
  try {
    const config = await getOrCreateRemittanceConfig();
    res.json({ expectedAmount: config.expectedAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateExpectedAmount = async (req, res) => {
  try {
    const { expectedAmount } = req.body;

    if (!Number.isFinite(Number(expectedAmount)) || Number(expectedAmount) < 0) {
      return res.status(400).json({ error: "expectedAmount must be a valid non-negative number" });
    }

    // Only super admin can call this route; the controller keeps the config in
    // a single-row table so the amount is easy to audit and change centrally.
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

exports.reviewRemittance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = "APPROVED", reviewNotes } = req.body;

    if (!["APPROVED", "REJECTED", "ESCALATED"].includes(status)) {
      return res.status(400).json({
        error: "status must be APPROVED, REJECTED, or ESCALATED",
      });
    }

    const remittance = await prisma.remittance.update({
      where: { id },
      data: {
        approved: status === "APPROVED",
        status,
        reviewNotes: reviewNotes?.trim() || null,
        reviewedAt: new Date(),
        reviewedByUserId: req.user.id,
      },
      include: {
        bus: {
          include: { route: true },
        },
        driver: true,
        shift: true,
      },
    });

    // Approval also closes the linked shift so dispatch, finance, and reporting
    // all agree that the day’s operating record has been settled.
    if (status === "APPROVED" && remittance.shiftId) {
      await prisma.shift.update({
        where: { id: remittance.shiftId },
        data: { status: "CLOSED", closedAt: new Date(), closedByUserId: req.user.id },
      });
    }

    res.json({
      message: `Remittance ${status.toLowerCase()}`,
      remittance,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.approveRemittance = async (req, res) => {
  req.body.status = "APPROVED";
  return exports.reviewRemittance(req, res);
};

exports.getRemittances = async (req, res) => {
  const remittances = await prisma.remittance.findMany({
    include: {
      bus: {
        include: { route: true },
      },
      driver: true,
      shift: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  res.json(remittances);
};

exports.getReconciliationSummary = async (req, res) => {
  const remittances = await prisma.remittance.findMany({
    include: {
      bus: {
        include: { route: true },
      },
      driver: true,
    },
  });

  const summary = remittances.reduce(
    (acc, item) => {
      acc.expected += item.expectedAmount;
      acc.reported += item.reportedAmount;
      acc.variance += item.varianceAmount;

      if (item.status === "PENDING") acc.pending += 1;
      if (item.status === "ESCALATED") acc.escalated += 1;
      if (item.status === "REJECTED") acc.rejected += 1;

      return acc;
    },
    { expected: 0, reported: 0, variance: 0, pending: 0, escalated: 0, rejected: 0 },
  );

  res.json(summary);
};
