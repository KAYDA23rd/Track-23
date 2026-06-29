const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getStatusSeverity = (status) => {
  if (status === "ESCALATED") return "high";
  if (status === "PENDING") return "medium";
  return "low";
};

const buildOperationsSnapshot = async () => {
  const today = startOfToday();
  const now = new Date();
  const locationCutoff = new Date(now.getTime() - 15 * 60 * 1000);

  // Pull the full operating picture in one pass so dashboard and supervisor
  // screens are driven from a consistent snapshot instead of mixed timestamps.
  const [shifts, remittances, tickets, locations, routes, inactiveBuses] = await Promise.all([
    prisma.shift.findMany({
      where: { startTime: { gte: today } },
      include: {
        bus: { include: { route: true } },
        driver: true,
        remittances: true,
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.remittance.findMany({
      where: { createdAt: { gte: today } },
      include: {
        bus: { include: { route: true } },
        driver: true,
        shift: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.maintenanceTicket.findMany({
      where: { status: { not: "RESOLVED" } },
      include: { bus: { include: { route: true } } },
      orderBy: [{ workshopPriority: "asc" }, { createdAt: "desc" }],
    }),
    prisma.driverLocation.findMany({
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
      },
    }),
    prisma.route.findMany({
      include: {
        buses: {
          include: {
            shifts: {
              include: { remittances: true },
              where: { startTime: { gte: today } },
            },
          },
        },
      },
    }),
    prisma.bus.findMany({
      where: { status: "INACTIVE" },
      include: {
        route: true,
        maintenance: {
          where: { status: { in: ["OPEN", "ENROUTE"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const liveShifts = shifts.filter((shift) => shift.status === "ON_ROUTE");
  const overdueShifts = shifts.filter(
    (shift) => !["COMPLETED", "CLOSED"].includes(shift.status) && shift.endTime < now,
  );
  const pendingHandover = shifts.filter((shift) => shift.status === "ASSIGNED");
  const completedAwaitingClose = shifts.filter(
    (shift) => shift.status === "COMPLETED" && shift.remittances.length === 0,
  );

  // Tracking is keyed by bus because route supervision cares about the vehicle
  // currently in service, not just the account that sent the location.
  const liveLocationsByBusId = new Map(
    locations.filter((location) => location.busId).map((location) => [location.busId, location]),
  );

  const offlineDrivers = liveShifts
    .map((shift) => {
      const location = liveLocationsByBusId.get(shift.busId);
      if (!location || location.recordedAt < locationCutoff) {
        return {
          shiftId: shift.id,
          driver: shift.driver.name,
          bus: shift.bus.plateNumber,
          route: shift.bus.route?.name || "No route",
          lastRecordedAt: location?.recordedAt || null,
        };
      }
      return null;
    })
    .filter(Boolean);

  // Route performance is derived from shift records rather than static bus
  // counts so supervisors see actual corridor productivity.
  const routePerformance = routes.map((route) => {
    const routeShifts = route.buses.flatMap((bus) => bus.shifts);
    const routeRemittances = routeShifts.flatMap((shift) => shift.remittances);
    const totalReported = routeRemittances.reduce((sum, item) => sum + item.reportedAmount, 0);
    const totalExpected = routeRemittances.reduce((sum, item) => sum + item.expectedAmount, 0);
    const totalTrips = routeShifts.reduce((sum, shift) => sum + (shift.completedTrips || 0), 0);
    const totalPassengers = routeShifts.reduce((sum, shift) => sum + (shift.passengerCount || 0), 0);
    const completedLoops = routeShifts.reduce((sum, shift) => sum + (shift.completedLoops || 0), 0);
    const avgDurationBase = routeShifts.filter((shift) => shift.actualDurationMinutes != null);
    const avgDurationMinutes =
      avgDurationBase.length > 0
        ? Math.round(
            avgDurationBase.reduce((sum, shift) => sum + (shift.actualDurationMinutes || 0), 0) /
              avgDurationBase.length,
          )
        : null;

    return {
      routeId: route.id,
      routeName: route.name,
      plannedDistanceKm: route.plannedDistanceKm,
      targetDurationMinutes: route.targetDurationMinutes,
      plannedTripsPerShift: route.plannedTripsPerShift,
      activeBuses: route.buses.filter((bus) => bus.status === "ACTIVE").length,
      dispatchedShifts: routeShifts.length,
      completedShifts: routeShifts.filter((shift) => ["COMPLETED", "CLOSED"].includes(shift.status)).length,
      totalTrips,
      totalPassengers,
      completedLoops,
      avgPassengersPerTrip: totalTrips > 0 ? Number((totalPassengers / totalTrips).toFixed(1)) : 0,
      avgDurationMinutes,
      reportedRevenue: totalReported,
      expectedRevenue: totalExpected,
      revenuePerTrip: totalTrips > 0 ? Math.round(totalReported / totalTrips) : 0,
    };
  });

  const tripMetrics = shifts.reduce(
    (acc, shift) => {
      acc.completedTrips += shift.completedTrips || 0;
      acc.passengerCount += shift.passengerCount || 0;
      acc.completedLoops += shift.completedLoops || 0;
      if (shift.actualDurationMinutes != null) {
        acc.durationSamples += 1;
        acc.totalDuration += shift.actualDurationMinutes;
      }
      return acc;
    },
    {
      completedTrips: 0,
      passengerCount: 0,
      completedLoops: 0,
      durationSamples: 0,
      totalDuration: 0,
    },
  );

  // Alert generation converts raw operational facts into a single prioritized
  // queue that the supervisor app can filter without recomputing business rules.
  const alerts = [
    ...overdueShifts.map((shift) => ({
      id: `overdue-shift-${shift.id}`,
      type: "OVERDUE_SHIFT",
      severity: "critical",
      title: "Shift overdue",
      message: `${shift.driver.name} on ${shift.bus.plateNumber} has passed the scheduled end time.`,
      route: shift.bus.route?.name || "No route",
      subject: shift.bus.plateNumber,
      timestamp: shift.endTime,
    })),
    ...offlineDrivers.map((item) => ({
      id: `offline-driver-${item.shiftId}`,
      type: "TRACKING_LOSS",
      severity: "critical",
      title: "Driver tracking lost",
      message: `${item.driver} on ${item.bus} has no live location inside the last 15 minutes.`,
      route: item.route,
      subject: item.bus,
      timestamp: item.lastRecordedAt,
    })),
    ...remittances
      .filter((item) => ["PENDING", "ESCALATED", "REJECTED"].includes(item.status))
      .map((item) => ({
        id: `remittance-${item.id}`,
        type: "REMITTANCE_EXCEPTION",
        severity: getStatusSeverity(item.status),
        title: `Remittance ${item.status.toLowerCase()}`,
        message: `${item.driver.name} on ${item.bus.plateNumber} submitted NGN ${item.reportedAmount.toLocaleString()} against NGN ${item.expectedAmount.toLocaleString()}.`,
        route: item.bus.route?.name || "No route",
        subject: item.bus.plateNumber,
        timestamp: item.createdAt,
      })),
    ...tickets.map((ticket) => ({
      id: `maintenance-${ticket.id}`,
      type: "MAINTENANCE_BLOCKER",
      severity: ticket.status === "ENROUTE" ? "medium" : "high",
      title: ticket.status === "ENROUTE" ? "Bus under repair" : "Bus removed from service",
      message: `${ticket.bus.plateNumber} is ${ticket.status === "ENROUTE" ? "in the workshop" : "waiting for mechanic action"} for ${ticket.issue}.`,
      route: ticket.bus.route?.name || "No route",
      subject: ticket.bus.plateNumber,
      timestamp: ticket.createdAt,
    })),
    ...pendingHandover.map((shift) => ({
      id: `handover-${shift.id}`,
      type: "HANDOVER_PENDING",
      severity: "medium",
      title: "Driver handover pending",
      message: `${shift.driver.name} has an assigned bus ${shift.bus.plateNumber} awaiting handover confirmation.`,
      route: shift.bus.route?.name || "No route",
      subject: shift.bus.plateNumber,
      timestamp: shift.startTime,
    })),
    ...completedAwaitingClose.map((shift) => ({
      id: `closeout-${shift.id}`,
      type: "SHIFT_CLOSEOUT",
      severity: "medium",
      title: "Shift awaiting close-out",
      message: `${shift.driver.name} completed service on ${shift.bus.plateNumber} but the shift is still open.`,
      route: shift.bus.route?.name || "No route",
      subject: shift.bus.plateNumber,
      timestamp: shift.completedAt || shift.endTime,
    })),
    ...routePerformance
      .filter(
        (route) =>
          route.plannedTripsPerShift &&
          route.dispatchedShifts > 0 &&
          route.totalTrips < route.plannedTripsPerShift * route.dispatchedShifts,
      )
      .map((route) => ({
        id: `route-output-${route.routeId}`,
        type: "TRIP_TARGET_MISS",
        severity: "medium",
        title: "Trip target missed",
        message: `${route.routeName} delivered ${route.totalTrips} trips against a planned ${route.plannedTripsPerShift * route.dispatchedShifts}.`,
        route: route.routeName,
        subject: route.routeName,
        timestamp: now,
      })),
    ...inactiveBuses
      .filter((bus) => bus.maintenance.length === 0)
      .map((bus) => ({
        id: `inactive-bus-${bus.id}`,
        type: "INACTIVE_BUS",
        severity: "low",
        title: "Inactive bus awaiting dispatch decision",
        message: `${bus.plateNumber} is inactive without an open maintenance ticket. Review service readiness.`,
        route: bus.route?.name || "No route",
        subject: bus.plateNumber,
        timestamp: now,
      })),
  ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  return {
    snapshot: {
      liveShifts: liveShifts.length,
      pendingHandover: pendingHandover.length,
      overdueShifts: overdueShifts.length,
      completedAwaitingClose: completedAwaitingClose.length,
      pendingRemittances: remittances.filter((item) => item.status === "PENDING").length,
      escalatedRemittances: remittances.filter((item) => item.status === "ESCALATED").length,
      unresolvedMaintenance: tickets.length,
      offlineDrivers,
      overdueShiftList: overdueShifts.map((shift) => ({
        shiftId: shift.id,
        driver: shift.driver.name,
        bus: shift.bus.plateNumber,
        route: shift.bus.route?.name || "No route",
        scheduledEnd: shift.endTime,
      })),
      routePerformance,
      tripMetrics: {
        completedTrips: tripMetrics.completedTrips,
        passengerCount: tripMetrics.passengerCount,
        completedLoops: tripMetrics.completedLoops,
        avgPassengersPerTrip:
          tripMetrics.completedTrips > 0
            ? Number((tripMetrics.passengerCount / tripMetrics.completedTrips).toFixed(1))
            : 0,
        avgDurationMinutes:
          tripMetrics.durationSamples > 0
            ? Math.round(tripMetrics.totalDuration / tripMetrics.durationSamples)
            : null,
      },
      liveOperations: liveShifts.map((shift) => ({
        shiftId: shift.id,
        driver: shift.driver.name,
        bus: shift.bus.plateNumber,
        route: shift.bus.route?.name || "No route",
        startedAt: shift.tripStartedAt || shift.startTime,
        remittanceSubmitted: shift.remittances.length > 0,
        completedTrips: shift.completedTrips || 0,
        passengerCount: shift.passengerCount || 0,
      })),
    },
    alerts,
  };
};

exports.dailyRevenue = async (req, res) => {
  const today = startOfToday();

  const remittances = await prisma.remittance.aggregate({
    where: {
      date: { gte: today },
      status: "APPROVED",
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

exports.revenueByRoute = async (req, res) => {
  const routes = await prisma.route.findMany({
    include: {
      buses: {
        include: {
          remittances: {
            where: { status: "APPROVED" },
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

exports.driverPerformance = async (req, res) => {
  const drivers = await prisma.driver.findMany({
    include: {
      remittances: true,
      shifts: true,
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
      completedShifts: driver.shifts.filter((shift) => shift.status === "COMPLETED" || shift.status === "CLOSED").length,
    };
  });

  res.json(result);
};

exports.maintenanceSummary = async (req, res) => {
  const open = await prisma.maintenanceTicket.count({
    where: { status: { in: ["OPEN", "ENROUTE"] } },
  });

  const resolved = await prisma.maintenanceTicket.count({
    where: { status: "RESOLVED" },
  });

  res.json({ open, resolved });
};

exports.operationsConsole = async (req, res) => {
  // Admin and supervisor surfaces both consume this response, so keep it as the
  // shared operational summary rather than tailoring it to one page.
  const { snapshot } = await buildOperationsSnapshot();
  res.json(snapshot);
};

exports.alertCenter = async (req, res) => {
  const { snapshot, alerts } = await buildOperationsSnapshot();

  // Severity counts let the control tower show queue pressure at a glance
  // without iterating the full alert list client-side.
  const severityCounts = alerts.reduce(
    (acc, alert) => {
      acc.total += 1;
      acc[alert.severity] += 1;
      return acc;
    },
    { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
  );

  res.json({
    generatedAt: new Date(),
    severityCounts,
    alertCount: alerts.length,
    alerts,
    snapshot: {
      liveShifts: snapshot.liveShifts,
      pendingHandover: snapshot.pendingHandover,
      overdueShifts: snapshot.overdueShifts,
      pendingRemittances: snapshot.pendingRemittances,
      escalatedRemittances: snapshot.escalatedRemittances,
      unresolvedMaintenance: snapshot.unresolvedMaintenance,
      offlineDrivers: snapshot.offlineDrivers.length,
      completedAwaitingClose: snapshot.completedAwaitingClose,
    },
  });
};
