const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const parseCoordinate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

exports.createRoute = async (req, res) => {
  try {
    const {
      name,
      startPoint,
      endPoint,
      startLat,
      startLng,
      endLat,
      endLng,
    } = req.body;

    const route = await prisma.route.create({
      data: {
        name,
        startPoint,
        endPoint,
        startLat: parseCoordinate(startLat),
        startLng: parseCoordinate(startLng),
        endLat: parseCoordinate(endLat),
        endLng: parseCoordinate(endLng),
      },
    });

    res.status(201).json({
      message: "Route created successfully",
      route,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRoutes = async (req, res) => {
  const routes = await prisma.route.findMany();
  res.json(routes);
};

// UPDATE route
exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      startPoint,
      endPoint,
      startLat,
      startLng,
      endLat,
      endLng,
    } = req.body;

    const route = await prisma.route.update({
      where: { id },
      data: {
        name,
        startPoint,
        endPoint,
        startLat: parseCoordinate(startLat),
        startLng: parseCoordinate(startLng),
        endLat: parseCoordinate(endLat),
        endLng: parseCoordinate(endLng),
      },
    });

    res.json(route);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE route
exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.route.delete({
      where: { id },
    });

    res.json({ message: "Route deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
