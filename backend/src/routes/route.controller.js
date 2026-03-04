const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createRoute = async (req, res) => {
  try {
    const { name, startPoint, endPoint } = req.body;

    const route = await prisma.route.create({
      data: {
        name,
        startPoint,
        endPoint,
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
    const { name, startPoint, endPoint } = req.body;

    const route = await prisma.route.update({
      where: { id },
      data: { name, startPoint, endPoint },
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
