/**
 * Bus Controller
 * HTTP handlers for bus/fleet management endpoints
 * Uses bus.service for business logic
 */

const { asyncHandler } = require("../utils/errorHandler");
const busService = require("./bus.service");
const logger = require("../utils/logger");

/**
 * Create a new bus
 * POST /buses
 */
exports.createBus = asyncHandler(async (req, res) => {
  logger.info(`Creating new bus: ${req.validated.plateNumber}`);
  const bus = await busService.createBus(req.validated);
  res.status(201).json({
    message: "Bus created successfully",
    bus,
  });
});

/**
 * Get all buses
 * GET /buses
 */
exports.getBuses = asyncHandler(async (req, res) => {
  logger.info("Fetching all buses");
  const buses = await busService.getAllBuses();
  res.json(buses);
});

/**
 * Get a specific bus
 * GET /buses/:id
 */
exports.getBusById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.info(`Fetching bus: ${id}`);
  const bus = await busService.getBusById(id);
  res.json(bus);
});

/**
 * Update a bus
 * PUT /buses/:id
 */
exports.updateBus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.info(`Updating bus: ${id}`);
  const bus = await busService.updateBus(id, req.validated);
  res.json({
    message: "Bus updated successfully",
    bus,
  });
});

/**
 * Delete a bus
 * DELETE /buses/:id
 */
exports.deleteBus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.info(`Deleting bus: ${id}`);
  const result = await busService.deleteBus(id);
  res.json(result);
});

/**
 * Get buses by route
 * GET /buses/route/:routeId
 */
exports.getBusesByRoute = asyncHandler(async (req, res) => {
  const { routeId } = req.params;
  logger.info(`Fetching buses for route: ${routeId}`);
  const buses = await busService.getBusesByRoute(routeId);
  res.json(buses);
});

/**
 * Get buses by status
 * GET /buses/status/:status
 */
exports.getBusesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  logger.info(`Fetching buses with status: ${status}`);
  const buses = await busService.getBusesByStatus(status);
  res.json(buses);
  }
};
