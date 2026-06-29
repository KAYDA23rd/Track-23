/**
 * Bus Service Layer
 * Business logic for bus/fleet management
 * Separates database operations from HTTP handling
 */

const { getPrismaClient } = require("../config/database");
const {
  AppError,
  notFoundError,
  conflictError,
  validationError,
} = require("../utils/errorHandler");
const { BUS_STATUS, TICKET_STATUS } = require("../utils/constants");

const prisma = getPrismaClient();

/**
 * Get all buses with maintenance status (optimized query)
 * Uses a single query with aggregation to avoid N+1 problem
 */
const getAllBuses = async () => {
  const buses = await prisma.bus.findMany({
    include: {
      route: true,
      maintenance: {
        where: {
          status: { in: [TICKET_STATUS.OPEN, TICKET_STATUS.ENROUTE] },
        },
        select: { id: true },
        take: 1, // Only need to know if any exist
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich bus data with maintenance status
  return buses.map((bus) => ({
    ...bus,
    isUnderRepair: bus.maintenance.length > 0,
    status: bus.maintenance.length > 0 ? BUS_STATUS.INACTIVE : bus.status,
  }));
};

/**
 * Get a single bus by ID
 */
const getBusById = async (busId) => {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: {
      route: true,
      maintenance: {
        where: {
          status: { in: [TICKET_STATUS.OPEN, TICKET_STATUS.ENROUTE] },
        },
      },
    },
  });

  if (!bus) {
    throw notFoundError("Bus");
  }

  return {
    ...bus,
    isUnderRepair: bus.maintenance.length > 0,
    status: bus.maintenance.length > 0 ? BUS_STATUS.INACTIVE : bus.status,
  };
};

/**
 * Create a new bus
 */
const createBus = async (data) => {
  const { plateNumber, model, routeId } = data;

  // Check if route exists
  const route = await prisma.route.findUnique({
    where: { id: routeId },
  });

  if (!route) {
    throw validationError("Invalid route ID");
  }

  // Check if plate number already exists
  const existingBus = await prisma.bus.findUnique({
    where: { plateNumber },
  });

  if (existingBus) {
    throw conflictError("A bus with this plate number already exists");
  }

  const bus = await prisma.bus.create({
    data: {
      plateNumber,
      model,
      routeId,
      status: BUS_STATUS.STANDBY,
    },
    include: { route: true },
  });

  return bus;
};

/**
 * Update a bus
 */
const updateBus = async (busId, data) => {
  const { plateNumber, model, routeId, status } = data;

  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: {
      maintenance: {
        where: {
          status: { in: [TICKET_STATUS.OPEN, TICKET_STATUS.ENROUTE] },
        },
        select: { id: true },
      },
    },
  });

  if (!bus) {
    throw notFoundError("Bus");
  }

  const hasActiveMaintenance = bus.maintenance.length > 0;

  // Prevent status change if bus is under repair
  if (hasActiveMaintenance && status && status !== BUS_STATUS.INACTIVE) {
    throw conflictError(
      "Bus remains inactive while repair is in progress. Resolve maintenance before changing status.",
    );
  }

  // If updating plate number, check uniqueness (excluding current bus)
  if (plateNumber && plateNumber !== bus.plateNumber) {
    const existingBus = await prisma.bus.findUnique({
      where: { plateNumber },
    });

    if (existingBus) {
      throw conflictError("A bus with this plate number already exists");
    }
  }

  // If updating route, verify it exists
  if (routeId && routeId !== bus.routeId) {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      throw validationError("Invalid route ID");
    }
  }

  const updatedBus = await prisma.bus.update({
    where: { id: busId },
    data: {
      plateNumber: plateNumber || undefined,
      model: model || undefined,
      routeId: routeId || undefined,
      status: hasActiveMaintenance ? BUS_STATUS.INACTIVE : status || undefined,
    },
    include: { route: true },
  });

  return {
    ...updatedBus,
    isUnderRepair: hasActiveMaintenance,
  };
};

/**
 * Delete a bus (soft delete recommended for production)
 */
const deleteBus = async (busId) => {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
  });

  if (!bus) {
    throw notFoundError("Bus");
  }

  // Check if bus has active shifts or remittances
  const activeShifts = await prisma.shift.count({
    where: {
      busId,
      status: { not: "CLOSED" },
    },
  });

  if (activeShifts > 0) {
    throw conflictError("Cannot delete bus with active shifts");
  }

  await prisma.bus.delete({
    where: { id: busId },
  });

  return { message: "Bus deleted successfully" };
};

/**
 * Get buses by route
 */
const getBusesByRoute = async (routeId) => {
  const buses = await prisma.bus.findMany({
    where: { routeId },
    include: {
      maintenance: {
        where: {
          status: { in: [TICKET_STATUS.OPEN, TICKET_STATUS.ENROUTE] },
        },
        select: { id: true },
      },
    },
  });

  return buses.map((bus) => ({
    ...bus,
    isUnderRepair: bus.maintenance.length > 0,
    status: bus.maintenance.length > 0 ? BUS_STATUS.INACTIVE : bus.status,
  }));
};

/**
 * Get buses by status
 */
const getBusesByStatus = async (status) => {
  const buses = await prisma.bus.findMany({
    where: { status },
    include: { route: true },
  });

  return buses;
};

module.exports = {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  getBusesByRoute,
  getBusesByStatus,
};
