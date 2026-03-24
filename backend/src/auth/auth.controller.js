const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { generateToken } = require("../utils/jwt");

const prisma = new PrismaClient();

/**
 * REGISTER USER (Admin, Driver, Mechanic)
 */
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    if (!name || !phone || !password || !role) {
      return res.status(400).json({ error: "name, phone, password, and role are required" });
    }

    if (role === "SUPER_ADMIN") {
      return res.status(403).json({ error: "SUPER_ADMIN cannot be created from this endpoint" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        role,
        isActive: role === "DRIVER" ? false : true,
      },
    });

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
 * SUPER_ADMIN: CREATE NORMAL ADMIN ACCOUNT
 */
exports.createAdmin = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: "name, phone, and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });

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
 * DRIVER SELF-SIGNUP (requires admin approval)
 */
exports.driverSignup = async (req, res) => {
  try {
    const { name, phone, password, licenseNo, email } = req.body;

    if (!name || !phone || !password || !licenseNo) {
      return res.status(400).json({ error: "name, phone, password, and licenseNo are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name,
          phone,
          email: email || null,
          password: hashedPassword,
          role: "DRIVER",
          isActive: false,
        },
      });

      // Keep Driver profile synced so shifts/remittances can be linked immediately after approval.
      await tx.driver.upsert({
        where: { phone },
        update: { name, licenseNo },
        create: { name, phone, licenseNo },
      });
    });

    res.status(201).json({
      message: "Account created. Awaiting admin approval.",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * LOGIN USER
 */
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.role === "DRIVER" && !user.isActive) {
      return res.status(403).json({ error: "Driver account pending admin approval" });
    }

    const token = generateToken(user);

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

/**
 * ADMIN: LIST PENDING DRIVER ACCOUNTS
 */
exports.getPendingDrivers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "DRIVER",
        isActive: false,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ADMIN: APPROVE DRIVER ACCOUNT
 */
exports.approveDriver = async (req, res) => {
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
      message: "Driver account approved",
      user: updated,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
