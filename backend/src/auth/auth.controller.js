// Password hashing library for secure credential storage
const bcrypt = require("bcryptjs");

// Prisma ORM for database operations
const { PrismaClient } = require("@prisma/client");

// Import JWT token generation utility
const { generateToken } = require("../utils/jwt");

// Initialize Prisma client for database access
const prisma = new PrismaClient();

/**
 * REGISTER NEW USER (Admin, Mechanic, Supervisor)
 * Only SUPER_ADMIN can create other users
 * Drivers register themselves via driverSignup endpoint
 */
exports.register = async (req, res) => {
  try {
    // Extract user details from request body
    const { name, phone, email, password, role } = req.body;

    // Validate all required fields are provided
    if (!name || !phone || !password || !role) {
      return res
        .status(400)
        .json({ error: "name, phone, password, and role are required" });
    }

    // Prevent direct creation of SUPER_ADMIN (security measure)
    if (role === "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ error: "SUPER_ADMIN cannot be created from this endpoint" });
    }

    // Hash password using bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user record in database
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        role,
        // Drivers start as inactive until admin approval, others active immediately
        isActive: role === "DRIVER" ? false : true,
      },
    });

    // Return success response with user data (password excluded)
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * CREATE ADMIN ACCOUNT
 * Only SUPER_ADMIN can create admin accounts
 */
exports.createAdmin = async (req, res) => {
  try {
    // Extract admin details from request
    const { name, phone, email, password } = req.body;

    // Validate required fields
    if (!name || !phone || !password) {
      return res
        .status(400)
        .json({ error: "name, phone, and password are required" });
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user in database
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true, // Admin accounts active immediately
      },
    });

    // Return success response
    res.status(201).json({
      message: "Admin created successfully",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * DRIVER SELF-SIGNUP
 * Drivers can create their own account
 * Requires admin approval before can login
 */
exports.driverSignup = async (req, res) => {
  try {
    // Extract driver signup details
    const { name, phone, password, licenseNo, email } = req.body;

    // Validate all required driver fields
    if (!name || !phone || !password || !licenseNo) {
      return res
        .status(400)
        .json({ error: "name, phone, password, and licenseNo are required" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use database transaction to ensure both user and driver records are created together
    await prisma.$transaction(async (tx) => {
      // Create user account (inactive until approved)
      await tx.user.create({
        data: {
          name,
          phone,
          email: email || null,
          password: hashedPassword,
          role: "DRIVER",
          isActive: false, // Inactive until admin approval
        },
      });

      // Create or update driver profile
      // Syncs user data with driver profile so shifts/remittances can be linked after approval
      await tx.driver.upsert({
        where: { phone },
        update: { name, licenseNo },
        create: { name, phone, licenseNo },
      });
    });

    // Return confirmation message
    res.status(201).json({
      message: "Account created. Awaiting admin approval.",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.mechanicSignup = async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: "name, phone, and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role: "MECHANIC",
        isActive: false,
      },
    });

    res.status(201).json({
      message: "Mechanic account created. Awaiting admin approval.",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.supervisorSignup = async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: "name, phone, and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role: "SUPERVISOR",
        isActive: false,
      },
    });

    res.status(201).json({
      message: "Supervisor account created. Awaiting admin approval.",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * LOGIN USER
 * Authenticate user with phone number and password
 * Drivers must be approved before login is allowed
 */
exports.login = async (req, res) => {
  try {
    // Extract credentials from request
    const { phone, password } = req.body;

    // Find user by phone number (unique identifier)
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    // Return error if user not found (generic for security)
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare provided password with stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    // Return error if password doesn't match
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      const pendingMessage =
        user.role === "DRIVER"
          ? "Driver account pending admin approval"
          : user.role === "MECHANIC"
            ? "Mechanic account pending admin approval"
            : user.role === "SUPERVISOR"
              ? "Supervisor account pending admin approval"
            : "Account is inactive";

      return res.status(403).json({ error: pendingMessage });
    }

    // Generate JWT token for authenticated user
    const token = generateToken(user);

    // Return success with token and user info
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: "Account inactive" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET PENDING DRIVERS
 * Retrieve list of driver accounts awaiting admin approval
 * Only admins can see this list
 */
exports.getPendingDrivers = async (req, res) => {
  try {
    // Query all inactive driver accounts
    const users = await prisma.user.findMany({
      where: {
        role: "DRIVER",
        isActive: false,
      },
      orderBy: { createdAt: "desc" },
      // Only select needed fields (exclude password)
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });

    // Return list of pending drivers
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDriverAccounts = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "DRIVER",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        isActive: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingStaff = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["MECHANIC", "SUPERVISOR"] },
        isActive: false,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStaffAccounts = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["MECHANIC", "SUPERVISOR", "ADMIN", "SUPER_ADMIN"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * APPROVE DRIVER ACCOUNT
 * Admin endpoint to activate a pending driver account
 */
exports.approveDriver = async (req, res) => {
  try {
    // Extract driver ID from URL params
    const { id } = req.params;

    // Update user to active status and record approval timestamp
    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        approvedAt: new Date(),
      },
      // Only return necessary fields
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        approvedAt: true,
      },
    });

    // Return confirmation with updated user data
    res.json({
      message: "Driver account approved",
      user: updated,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: Boolean(isActive),
        approvedAt: isActive ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        approvedAt: true,
      },
    });

    res.json({
      message: updated.isActive ? "Driver account activated" : "Driver account suspended",
      user: updated,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.approveStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        approvedAt: true,
      },
    });

    res.json({
      message: "Staff account approved",
      user: updated,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!existing || !["MECHANIC", "SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(existing.role)) {
      return res.status(404).json({ error: "Staff account not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: Boolean(isActive),
        approvedAt: isActive ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        approvedAt: true,
      },
    });

    res.json({
      message: updated.isActive ? "Staff account activated" : "Staff account suspended",
      user: updated,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
