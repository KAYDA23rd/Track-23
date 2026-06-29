/**
 * Swagger/OpenAPI Configuration
 * API documentation for Track23 backend
 */

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Track23 Fleet Management API",
      version: "1.0.0",
      description:
        "Complete fleet management, driver tracking, and remittance reconciliation system",
      contact: {
        name: "Track23 Team",
        email: "support@track23.io",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
      {
        url: "https://api.track23.io",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /auth/login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            code: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "number" },
            timestamp: { type: "string" },
            details: { type: "object" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            role: {
              type: "string",
              enum: [
                "SUPER_ADMIN",
                "ADMIN",
                "SUPERVISOR",
                "MECHANIC",
                "DRIVER",
              ],
            },
            isActive: { type: "boolean" },
            approvedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Bus: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            plateNumber: { type: "string" },
            model: { type: "string" },
            status: {
              type: "string",
              enum: ["ACTIVE", "STANDBY", "INACTIVE", "MAINTENANCE"],
            },
            routeId: { type: "string", format: "uuid" },
            isUnderRepair: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Route: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            startPoint: { type: "string" },
            endPoint: { type: "string" },
            startLat: { type: "number" },
            startLng: { type: "number" },
            endLat: { type: "number" },
            endLng: { type: "number" },
            plannedDistanceKm: { type: "number" },
            targetDurationMinutes: { type: "number" },
          },
        },
        Shift: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            busId: { type: "string", format: "uuid" },
            driverId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: [
                "ASSIGNED",
                "HANDED_OVER",
                "ON_ROUTE",
                "COMPLETED",
                "CLOSED",
              ],
            },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            completedTrips: { type: "number" },
            passengerCount: { type: "number" },
          },
        },
        Remittance: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            busId: { type: "string", format: "uuid" },
            driverId: { type: "string", format: "uuid" },
            shiftId: { type: "string", format: "uuid" },
            expectedAmount: { type: "number" },
            reportedAmount: { type: "number" },
            varianceAmount: { type: "number" },
            status: {
              type: "string",
              enum: ["PENDING", "APPROVED", "REJECTED", "ESCALATED"],
            },
            date: { type: "string", format: "date-time" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication and user management" },
      { name: "Buses", description: "Bus/fleet management" },
      { name: "Drivers", description: "Driver management" },
      { name: "Shifts", description: "Shift scheduling and management" },
      { name: "Remittances", description: "Financial remittance tracking" },
      { name: "Routes", description: "Route planning and management" },
      { name: "Maintenance", description: "Bus maintenance tickets" },
      { name: "Reports", description: "Operational reports and analytics" },
    ],
    security: [{ BearerAuth: [] }],
  },
  apis: [
    "./src/auth/auth.routes.js",
    "./src/buses/bus.routes.js",
    "./src/shifts/shift.routes.js",
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
