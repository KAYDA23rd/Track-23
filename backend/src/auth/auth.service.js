/**
 * Authentication Service Layer
 * Contains all authentication business logic
 * Separated from HTTP handling for better testability and reusability
 */

const bcrypt = require("bcryptjs");
const { getPrismaClient } = require("../config/database");
const { generateToken } = require("./auth.utils");
const { AUTH_CONFIG, USER_ROLES } = require("../utils/constants");
const {
  AppError,
  validationError,
  unauthorizedError,
  forbiddenError,
  conflictError,
} = require("../utils/errorHandler");

const prisma = getPrismaClient();

/**
 * Hash password securely
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);
};

/**
 * Verify password against hash
 */
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Register a new user (Admin, Supervisor, Mechanic)
 * Only SUPER_ADMIN can create other users via this endpoint
 */
const registerUser = async (data) => {
  const { name, phone, email, password, role } = data;

  // Validate role
  if (!Object.values(USER_ROLES).includes(role)) {
    throw validationError("Invalid user role");
  }

  // Prevent SUPER_ADMIN creation via this endpoint
  if (role === USER_ROLES.SUPER_ADMIN) {
    throw forbiddenError(
      "SUPER_ADMIN accounts can only be created through system setup",
    );
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser) {
    throw conflictError("A user with this phone number already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email: email || null,
      password: hashedPassword,
      role,
      isActive: role === USER_ROLES.DRIVER ? false : true, // Drivers inactive until approval
    },
  });

  // If registering a driver, also create driver profile
  if (role === USER_ROLES.DRIVER) {
    await prisma.driver.upsert({
      where: { phone },
      update: { name },
      create: { name, phone },
    });
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
  };
};

/**
 * Driver self-signup
 * Drivers can create accounts but are inactive until admin approval
 */
const driverSignup = async (data) => {
  const { name, phone, password, licenseNo, email } = data;

  // Check if driver already exists
  const existingDriver = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingDriver) {
    throw conflictError("A user with this phone number already exists");
  }

  const hashedPassword = await hashPassword(password);

  // Use transaction to create user and driver profile atomically
  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role: USER_ROLES.DRIVER,
        isActive: false,
      },
    });

    await tx.driver.upsert({
      where: { phone },
      update: { name, licenseNo },
      create: { name, phone, licenseNo },
    });
  });

  return { message: "Account created successfully. Awaiting admin approval." };
};

/**
 * Generic signup for Mechanic and Supervisor roles
 */
const signupByRole = async (data, role) => {
  const { name, phone, password, email } = data;

  if (!Object.values(USER_ROLES).includes(role)) {
    throw validationError("Invalid user role");
  }

  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser) {
    throw conflictError("A user with this phone number already exists");
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.create({
    data: {
      name,
      phone,
      email: email || null,
      password: hashedPassword,
      role,
      isActive: false,
    },
  });

  return {
    message: `${role} account created successfully. Awaiting admin approval.`,
  };
};

/**
 * User login
 * Validates credentials and returns JWT token
 */
const login = async (data) => {
  const { phone, password } = data;

  // Find user by phone
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw unauthorizedError("Invalid phone or password");
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    throw unauthorizedError("Invalid phone or password");
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError("Account inactive", 403, "ACCOUNT_INACTIVE");
  }

  // Check if driver/mechanic/supervisor account is approved
  if (
    [USER_ROLES.DRIVER, USER_ROLES.MECHANIC, USER_ROLES.SUPERVISOR].includes(
      user.role,
    )
  ) {
    if (!user.approvedAt) {
      const role = user.role.toLowerCase();
      throw new AppError(
        `${role} account pending admin approval`,
        403,
        "PENDING_APPROVAL",
      );
    }
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
  };
};

/**
 * Approve a pending user account
 * Only SUPER_ADMIN or ADMIN can approve
 */
const approveAccount = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  if (user.approvedAt) {
    throw new AppError("Account already approved", 409, "ALREADY_APPROVED");
  }

  const approvedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      approvedAt: new Date(),
      isActive: true,
    },
  });

  return {
    id: approvedUser.id,
    name: approvedUser.name,
    role: approvedUser.role,
    approvedAt: approvedUser.approvedAt,
  };
};

/**
 * Get pending approvals
 */
const getPendingApprovals = async (role = null) => {
  const where = {
    approvedAt: null,
    role: { not: USER_ROLES.SUPER_ADMIN },
  };

  if (role) {
    where.role = role;
  }

  const pendingUsers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return pendingUsers;
};

module.exports = {
  registerUser,
  driverSignup,
  signupByRole,
  login,
  approveAccount,
  getPendingApprovals,
  hashPassword,
  verifyPassword,
};
