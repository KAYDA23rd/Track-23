const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const LIVE_WINDOW_MINUTES = 15;

const resolveAssignedBusId = async (userId) => {
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
    },
    orderBy: { startTime: "desc" },
    select: { busId: true },
  });
  if (activeShift?.busId) return activeShift.busId;

  const latestShift = await prisma.shift.findFirst({
    where: { driverId: driver.id },
    orderBy: { startTime: "desc" },
    select: { busId: true },
  });

  return latestShift?.busId || null;
};

exports.upsertDriverLocation = async (req, res) => {
  try {
    const { lat, lng, speedKph, heading, accuracyM } = req.body;

    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      return res.status(400).json({ error: "lat and lng are required numbers" });
    }

    const assignedBusId = await resolveAssignedBusId(req.user.id);

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

    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
