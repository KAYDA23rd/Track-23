/**
 * Application-wide constants
 * Centralized business rules and configuration values
 */

// Remittance configuration
export const REMITTANCE_CONFIG = {
  DEFAULT_EXPECTED_AMOUNT: 25000,
  VARIANCE_THRESHOLD_PERCENT: 10, // Flag for escalation if variance exceeds 10%
};

// Authentication configuration
export const AUTH_CONFIG = {
  BCRYPT_SALT_ROUNDS: 10,
  JWT_EXPIRY: "7d",
};

// Shift status lifecycle
export const SHIFT_STATUS = {
  ASSIGNED: "ASSIGNED",
  HANDED_OVER: "HANDED_OVER",
  ON_ROUTE: "ON_ROUTE",
  COMPLETED: "COMPLETED",
  CLOSED: "CLOSED",
};

// Bus status types
export const BUS_STATUS = {
  ACTIVE: "ACTIVE",
  STANDBY: "STANDBY",
  INACTIVE: "INACTIVE",
  MAINTENANCE: "MAINTENANCE",
};

// Maintenance ticket status
export const TICKET_STATUS = {
  OPEN: "OPEN",
  ENROUTE: "ENROUTE",
  RESOLVED: "RESOLVED",
};

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  MECHANIC: "MECHANIC",
  DRIVER: "DRIVER",
};

// Role hierarchy for permission checks
export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  SUPERVISOR: 3,
  MECHANIC: 2,
  DRIVER: 1,
};

// Remittance status
export const REMITTANCE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ESCALATED: "ESCALATED",
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Timeout values (in ms)
export const TIMEOUTS = {
  DATABASE_QUERY: 10000,
  API_REQUEST: 5000,
};
