const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * CREATE shift
 */
exports.createShift = async (req, res) => {
  try {
    const { busId, driverId, startTime, endTime } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        error: "End time must be after start time",
      });
    }

    // 1️⃣ Check DRIVER double-booking
    const driverConflict = await prisma.shift.findFirst({
      where: {
        driverId,
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });

    if (driverConflict) {
      return res.status(409).json({
        error: "Driver already has a shift during this time",
      });
    }

    // 2️⃣ Check BUS double-booking
    const busConflict = await prisma.shift.findFirst({
      where: {
        busId,
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });

    if (busConflict) {
      return res.status(409).json({
        error: "Bus is already assigned during this time",
      });
    }

    // 3️⃣ Create shift
    const shift = await prisma.shift.create({
      data: {
        busId,
        driverId,
        startTime: start,
        endTime: end,
      },
    });

    res.status(201).json({
      message: "Shift created successfully",
      shift,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET all shifts
 */
exports.getShifts = async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        bus: true,
        driver: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { busId, driverId, startTime, endTime } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res
        .status(400)
        .json({ error: "End time must be after start time" });
    }

    // Check driver conflict (exclude current shift)
    const driverConflict = await prisma.shift.findFirst({
      where: {
        driverId,
        id: { not: id },
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });

    if (driverConflict) {
      return res
        .status(409)
        .json({ error: "Driver already has a shift during this time" });
    }

    // Check bus conflict (exclude current shift)
    const busConflict = await prisma.shift.findFirst({
      where: {
        busId,
        id: { not: id },
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });

    if (busConflict) {
      return res
        .status(409)
        .json({ error: "Bus is already assigned during this time" });
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        busId,
        driverId,
        startTime: start,
        endTime: end,
      },
    });

    res.json({ message: "Shift updated", shift });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.shift.delete({ where: { id } });

    res.json({ message: "Shift deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
