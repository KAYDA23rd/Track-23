const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const LIVE_WINDOW_MINUTES = 15;

const resolveAssignedShift = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  if (!user?.phone) return null;

  const driver = await prisma.driver.findUnique({
    where: { phone: user.phone },
    select: { id: true },
  });
  if (!driver) return null;

  const now = new Date();

  const activeShift = await prisma.shift.findFirst({
    where: {
      driverId: driver.id,
      startTime: { lte: now },
      endTime: { gte: now },
      status: { in: ["HANDED_OVER", "ON_ROUTE", "COMPLETED"] },
    },
    orderBy: { startTime: "desc" },
    select: { id: true, busId: true, status: true },
  });
  if (activeShift?.busId) return activeShift;

  const latestShift = await prisma.shift.findFirst({
    where: {
      driverId: driver.id,
      status: { in: ["ASSIGNED", "HANDED_OVER", "ON_ROUTE", "COMPLETED"] },
    },
    orderBy: { startTime: "desc" },
    select: { id: true, busId: true, status: true },
  });

  return latestShift || null;
};

exports.upsertDriverLocation = async (req, res) => {
  try {
    const { lat, lng, speedKph, heading, accuracyM } = req.body;

    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      return res.status(400).json({ error: "lat and lng are required numbers" });
    }

    const assignedShift = await resolveAssignedShift(req.user.id);
    const assignedBusId = assignedShift?.busId || null;

    const location = await prisma.driverLocation.upsert({
      where: { userId: req.user.id },
      update: {
        lat: Number(lat),
        lng: Number(lng),
        busId: assignedBusId,
        speedKph: speedKph == null ? null : Number(speedKph),
        heading: heading == null ? null : Number(heading),
        accuracyM: accuracyM == null ? null : Number(accuracyM),
        recordedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        lat: Number(lat),
        lng: Number(lng),
        busId: assignedBusId,
        speedKph: speedKph == null ? null : Number(speedKph),
        heading: heading == null ? null : Number(heading),
        accuracyM: accuracyM == null ? null : Number(accuracyM),
      },
    });

    res.json({
      message: "Location updated",
      assignedBusId,
      assignedShiftId: assignedShift?.id || null,
      location,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLiveDriverLocations = async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - LIVE_WINDOW_MINUTES * 60 * 1000);

    const locations = await prisma.driverLocation.findMany({
      where: {
        recordedAt: {
          gte: cutoff,
        },
      },
      orderBy: { recordedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    const busIds = [...new Set(locations.map((location) => location.busId).filter(Boolean))];
    const buses = busIds.length
      ? await prisma.bus.findMany({
          where: { id: { in: busIds } },
          include: { route: true },
        })
      : [];
    const busById = new Map(buses.map((bus) => [bus.id, bus]));

    res.json(
      locations.map((location) => ({
        ...location,
        bus: location.busId ? busById.get(location.busId) || null : null,
        isOfflineRisk: location.recordedAt < cutoff,
      })),
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
