/**
 * Input validation schemas using Zod
 * Centralized validation for all API endpoints
 */

const { z } = require("zod");

// Auth validation
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10,15}$/, "Invalid phone number format"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "SUPERVISOR", "MECHANIC", "DRIVER"], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
});

const loginSchema = z.object({
  phone: z.string().regex(/^[0-9]{10,15}$/, "Invalid phone number format"),
  password: z.string().min(1, "Password is required"),
});

// Bus validation
const createBusSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required"),
  model: z.string().min(1, "Model is required"),
  routeId: z.string().uuid("Invalid route ID"),
});

const updateBusSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required").optional(),
  model: z.string().min(1, "Model is required").optional(),
  routeId: z.string().uuid("Invalid route ID").optional(),
  status: z.enum(["ACTIVE", "STANDBY", "INACTIVE", "MAINTENANCE"]).optional(),
});

// Shift validation
const createShiftSchema = z
  .object({
    busId: z.string().uuid("Invalid bus ID"),
    driverId: z.string().uuid("Invalid driver ID"),
    startTime: z.coerce
      .date()
      .min(new Date(), "Start time must be in the future"),
    endTime: z.coerce.date(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

const updateShiftSchema = z.object({
  odometerOut: z
    .number()
    .int()
    .nonnegative("Odometer must be non-negative")
    .optional(),
  odometerIn: z
    .number()
    .int()
    .nonnegative("Odometer must be non-negative")
    .optional(),
  fuelOutPercent: z
    .number()
    .int()
    .min(0)
    .max(100, "Fuel percent must be 0-100")
    .optional(),
  fuelInPercent: z
    .number()
    .int()
    .min(0)
    .max(100, "Fuel percent must be 0-100")
    .optional(),
  handoverNotes: z.string().optional(),
  returnNotes: z.string().optional(),
});

// Remittance validation
const createRemittanceSchema = z.object({
  busId: z.string().uuid("Invalid bus ID"),
  driverId: z.string().uuid("Invalid driver ID"),
  reportedAmount: z.number().int().positive("Reported amount must be positive"),
  varianceReason: z.string().optional(),
});

// Route validation
const createRouteSchema = z.object({
  name: z.string().min(2, "Route name must be at least 2 characters"),
  startPoint: z.string().min(1, "Start point is required"),
  endPoint: z.string().min(1, "End point is required"),
  startLat: z.number().min(-90).max(90).optional(),
  startLng: z.number().min(-180).max(180).optional(),
  endLat: z.number().min(-90).max(90).optional(),
  endLng: z.number().min(-180).max(180).optional(),
  plannedDistanceKm: z
    .number()
    .positive("Distance must be positive")
    .optional(),
  targetDurationMinutes: z
    .number()
    .int()
    .positive("Duration must be positive")
    .optional(),
  turnaroundMinutes: z
    .number()
    .int()
    .nonnegative("Turnaround must be non-negative")
    .optional(),
  plannedTripsPerShift: z
    .number()
    .int()
    .positive("Trips must be positive")
    .optional(),
  peakHeadwayMinutes: z
    .number()
    .int()
    .positive("Peak headway must be positive")
    .optional(),
  offPeakHeadwayMinutes: z
    .number()
    .int()
    .positive("Off-peak headway must be positive")
    .optional(),
});

// Maintenance validation
const createMaintenanceSchema = z.object({
  busId: z.string().uuid("Invalid bus ID"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  faultType: z.string().min(1, "Fault type is required"),
});

/**
 * Validation middleware factory
 * Usage: router.post("/path", validate(schema), controller.method)
 */
const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse(req.body);
    req.validated = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.reduce((acc, err) => {
        const path = err.path.join(".");
        acc[path] = err.message;
        return acc;
      }, {});

      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: formattedErrors,
          statusCode: 400,
          timestamp: new Date().toISOString(),
        },
      });
    }

    next(error);
  }
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createBusSchema,
  updateBusSchema,
  createShiftSchema,
  updateShiftSchema,
  createRemittanceSchema,
  createRouteSchema,
  createMaintenanceSchema,
};
