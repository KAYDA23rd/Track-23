const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Shared include keeps every shift response rich enough for dispatch,
// remittance, and dashboard views without extra follow-up queries.
const shiftInclude = {
  bus: {
    include: {
      route: true,
    },
  },
  driver: true,
  remittances: true,
};

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

// Adds derived operational fields so frontend screens do not have to
// re-implement dispatch-specific status calculations.
const withOperationalStatus = (shift) => {
  const now = new Date();
  const isDelayed =
    shift.status !== "COMPLETED" &&
    shift.status !== "CLOSED" &&
    shift.endTime < now;

  return {
    ...shift,
    operationalStatus: shift.status,
    isDelayed,
    remittanceSubmitted: (shift.remittances || []).length > 0,
    tripGap:
      shift.plannedTripsTarget == null ? null : Number(shift.completedTrips || 0) - Number(shift.plannedTripsTarget),
    avgPassengersPerTrip:
      Number(shift.completedTrips || 0) > 0
        ? Number(shift.passengerCount || 0) / Number(shift.completedTrips || 0)
        : 0,
  };
};

const getShiftById = async (id) =>
  prisma.shift.findUnique({
    where: { id },
    include: shiftInclude,
  });

const ensureShiftExists = async (id) => {
  const shift = await getShiftById(id);
  if (!shift) {
    const error = new Error("Shift not found");
    error.statusCode = 404;
    throw error;
  }
  return shift;
};

const validateBusAndDriverAvailability = async ({
  shiftId,
  busId,
  driverId,
  start,
  end,
}) => {
  // Overlap check is intentionally based on time windows, not status alone.
  // A shift that still exists operationally should block double-booking.
  const overlapWhere = {
    AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
    status: { not: "CLOSED" },
  };

  const driverConflict = await prisma.shift.findFirst({
    where: {
      ...overlapWhere,
      driverId,
      ...(shiftId ? { id: { not: shiftId } } : {}),
    },
  });

  if (driverConflict) {
    const error = new Error("Driver already has a shift during this time");
    error.statusCode = 409;
    throw error;
  }

  const busConflict = await prisma.shift.findFirst({
    where: {
      ...overlapWhere,
      busId,
      ...(shiftId ? { id: { not: shiftId } } : {}),
    },
  });

  if (busConflict) {
    const error = new Error("Bus is already assigned during this time");
    error.statusCode = 409;
    throw error;
  }
};

const handleControllerError = (res, error) => {
  res.status(error.statusCode || 500).json({ error: error.message });
};

const ensureBusAvailableForDispatch = async (busId) => {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: { route: true },
  });

  if (!bus) {
    const error = new Error("Bus not found");
    error.statusCode = 404;
    throw error;
  }

  if (["MAINTENANCE", "INACTIVE"].includes(bus.status)) {
    const error = new Error("Bus is under repair and cannot be assigned until maintenance is completed");
    error.statusCode = 409;
    throw error;
  }

  // Open workshop tickets are treated as a hard dispatch lock even if the bus
  // status was changed elsewhere. This keeps maintenance as the source of truth.
  const openTicket = await prisma.maintenanceTicket.findFirst({
    where: {
      busId,
      status: { in: ["OPEN", "ENROUTE"] },
    },
  });

  if (openTicket) {
    const error = new Error("Bus has an active maintenance ticket and is unavailable for dispatch");
    error.statusCode = 409;
    throw error;
  }

  return bus;
};

exports.createShift = async (req, res) => {
  try {
    const {
      busId,
      driverId,
      startTime,
      endTime,
      odometerOut,
      fuelOutPercent,
      handoverNotes,
    } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    // Dispatch creation snapshots route planning assumptions onto the shift so
    // later reporting still reflects the original plan even if route targets change.
    await validateBusAndDriverAvailability({ busId, driverId, start, end });

    const bus = await ensureBusAvailableForDispatch(busId);

    const shift = await prisma.shift.create({
      data: {
        busId,
        driverId,
        startTime: start,
        endTime: end,
        status: "ASSIGNED",
        issuedAt: new Date(),
        issuedByUserId: req.user.id,
        odometerOut: parseOptionalInt(odometerOut),
        fuelOutPercent: parseOptionalInt(fuelOutPercent),
        handoverNotes: handoverNotes || null,
        plannedTripsTarget: bus.route?.plannedTripsPerShift ?? null,
        targetDurationMinutesSnapshot: bus.route?.targetDurationMinutes ?? null,
      },
      include: shiftInclude,
    });

    res.status(201).json({
      message: "Shift created successfully",
      shift: withOperationalStatus(shift),
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.getShifts = async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({
      include: shiftInclude,
      orderBy: [{ startTime: "desc" }],
    });

    res.json(shifts.map(withOperationalStatus));
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      busId,
      driverId,
      startTime,
      endTime,
      odometerOut,
      fuelOutPercent,
      handoverNotes,
    } = req.body;

    const currentShift = await ensureShiftExists(id);

    if (["ON_ROUTE", "COMPLETED", "CLOSED"].includes(currentShift.status)) {
      return res.status(409).json({
        error: "Shift timing and assignment can no longer be edited after route execution has started",
      });
    }

    // Assignment edits stay open only before execution begins. After that,
    // dispatch history needs to remain stable for tracking and remittance integrity.
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    await validateBusAndDriverAvailability({
      shiftId: id,
      busId,
      driverId,
      start,
      end,
    });

    const bus = await ensureBusAvailableForDispatch(busId);

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        busId,
        driverId,
        startTime: start,
        endTime: end,
        odometerOut: parseOptionalInt(odometerOut),
        fuelOutPercent: parseOptionalInt(fuelOutPercent),
        handoverNotes: handoverNotes || null,
        plannedTripsTarget: bus.route?.plannedTripsPerShift ?? null,
        targetDurationMinutesSnapshot: bus.route?.targetDurationMinutes ?? null,
      },
      include: shiftInclude,
    });

    res.json({ message: "Shift updated", shift: withOperationalStatus(shift) });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.confirmShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await ensureShiftExists(id);

    if (shift.status !== "ASSIGNED") {
      return res.status(409).json({
        error: "Only assigned shifts can be handed over",
      });
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        confirmed: true,
        status: "HANDED_OVER",
        handoverConfirmedAt: new Date(),
        handoverConfirmedByUserId: req.user.id,
      },
      include: shiftInclude,
    });

    res.json({
      message: "Bus handover confirmed",
      shift: withOperationalStatus(updatedShift),
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.startShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await ensureShiftExists(id);

    if (shift.status !== "HANDED_OVER") {
      return res.status(409).json({
        error: "Shift must be handed over before it can move on route",
      });
    }

    // Re-check the bus at route start time so a late maintenance lock prevents
    // a bus from going live after handover.
    await ensureBusAvailableForDispatch(shift.busId);

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        status: "ON_ROUTE",
        tripStartedAt: new Date(),
      },
      include: shiftInclude,
    });

    await prisma.bus.update({
      where: { id: shift.busId },
      data: { status: "ACTIVE" },
    });

    res.json({
      message: "Shift is now on route",
      shift: withOperationalStatus(updatedShift),
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.completeShift = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      odometerIn,
      fuelInPercent,
      returnNotes,
      completedTrips,
      completedLoops,
      passengerCount,
      tripPerformanceNotes,
    } = req.body;
    const shift = await ensureShiftExists(id);

    if (!["HANDED_OVER", "ON_ROUTE"].includes(shift.status)) {
      return res.status(409).json({
        error: "Only active dispatched shifts can be marked complete",
      });
    }

    // Actual duration uses the real route start when available, with scheduled
    // start as a fallback so late handover does not break close-out metrics.
    const tripStart = shift.tripStartedAt || shift.startTime;
    const actualDurationMinutes = Math.max(
      0,
      Math.round((Date.now() - new Date(tripStart).getTime()) / 60000),
    );

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        odometerIn: parseOptionalInt(odometerIn),
        fuelInPercent: parseOptionalInt(fuelInPercent),
        returnNotes: returnNotes || null,
        completedTrips: parseOptionalInt(completedTrips) ?? shift.completedTrips,
        completedLoops: parseOptionalInt(completedLoops) ?? shift.completedLoops,
        passengerCount: parseOptionalInt(passengerCount) ?? shift.passengerCount,
        tripPerformanceNotes: tripPerformanceNotes || shift.tripPerformanceNotes || null,
        actualDurationMinutes,
      },
      include: shiftInclude,
    });

    await prisma.bus.update({
      where: { id: shift.busId },
      data: { status: "STANDBY" },
    });

    res.json({
      message: "Shift marked complete",
      shift: withOperationalStatus(updatedShift),
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.updateShiftPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      completedTrips,
      completedLoops,
      passengerCount,
      tripPerformanceNotes,
    } = req.body;

    const shift = await ensureShiftExists(id);

    // Drivers can update productivity once the bus is formally handed over,
    // and supervisors/admins keep those numbers through completion until final closure.
    if (!["HANDED_OVER", "ON_ROUTE", "COMPLETED"].includes(shift.status)) {
      return res.status(409).json({
        error: "Trip performance can only be updated after handover and before final closure",
      });
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        completedTrips: parseOptionalInt(completedTrips) ?? shift.completedTrips,
        completedLoops: parseOptionalInt(completedLoops) ?? shift.completedLoops,
        passengerCount: parseOptionalInt(passengerCount) ?? shift.passengerCount,
        tripPerformanceNotes:
          tripPerformanceNotes === undefined ? shift.tripPerformanceNotes : tripPerformanceNotes || null,
      },
      include: shiftInclude,
    });

    res.json({
      message: "Shift performance updated",
      shift: withOperationalStatus(updatedShift),
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.closeShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await ensureShiftExists(id);

    // Close-out is separated from completion so operations can hold the shift
    // open until remittance and return checks are settled.
    if (shift.status !== "COMPLETED") {
      return res.status(409).json({
        error: "Only completed shifts can be closed",
      });
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedByUserId: req.user.id,
      },
      include: shiftInclude,
    });

    res.json({
      message: "Shift closed successfully",
      shift: withOperationalStatus(updatedShift),
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await ensureShiftExists(id);

    // Once route execution has started, deletion would destroy operational
    // history and downstream financial references.
    if (!["ASSIGNED", "HANDED_OVER"].includes(shift.status)) {
      return res.status(409).json({
        error: "Only unexecuted shifts can be deleted",
      });
    }

    await prisma.shift.delete({ where: { id } });
    res.json({ message: "Shift deleted" });
  } catch (error) {
    handleControllerError(res, error);
  }
};
