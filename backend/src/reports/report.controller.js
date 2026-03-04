const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// DAILY REVENUE SUMMARY
exports.dailyRevenue = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const remittances = await prisma.remittance.aggregate({
    where: {
      date: {
        gte: today,
      },
      approved: true,
    },
    _sum: {
      reportedAmount: true,
      expectedAmount: true,
    },
  });

  res.json({
    date: today,
    expected: remittances._sum.expectedAmount || 0,
    reported: remittances._sum.reportedAmount || 0,
  });
};

// REVENUE BY ROUTE
exports.revenueByRoute = async (req, res) => {
  const routes = await prisma.route.findMany({
    include: {
      buses: {
        include: {
          remittances: {
            where: { approved: true },
          },
        },
      },
    },
  });

  const result = routes.map((route) => {
    let total = 0;

    route.buses.forEach((bus) => {
      bus.remittances.forEach((r) => {
        total += r.reportedAmount;
      });
    });

    return {
      route: route.name,
      revenue: total,
    };
  });

  res.json(result);
};

// DRIVER PERFORMANCE
exports.driverPerformance = async (req, res) => {
  const drivers = await prisma.driver.findMany({
    include: {
      remittances: true,
    },
  });

  const result = drivers.map((driver) => {
    let expected = 0;
    let reported = 0;

    driver.remittances.forEach((r) => {
      expected += r.expectedAmount;
      reported += r.reportedAmount;
    });

    return {
      driver: driver.name,
      expected,
      reported,
      variance: reported - expected,
    };
  });

  res.json(result);
};

// MAINTENANCE OVERVIEW
exports.maintenanceSummary = async (req, res) => {
  const open = await prisma.maintenanceTicket.count({
    where: { status: "OPEN" },
  });

  const resolved = await prisma.maintenanceTicket.count({
    where: { status: "RESOLVED" },
  });

  res.json({
    open,
    resolved,
  });
};
