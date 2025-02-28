const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { addToBlacklist, isTokenBlacklisted } = require("../utils/tokenBlacklist");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "";


// ✅ Create SuperAdmin
const createSuperAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Fix model name to SuperAdmin (with capital S)
    const superAdmin = await prisma.superAdmin.create({
      data: { username, password: hashedPassword },
    });

    res.status(201).json({ message: "SuperAdmin created successfully", superAdmin });
  } catch (error) {
    console.error("Error creating SuperAdmin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// ✅ Fetch All Admins Under SuperAdmin
const fetchAllAdmins = async (req, res) => {
  try {
    const { superAdminId } = req.body; // Get superAdminId from request body

    if (!superAdminId) {
      return res.status(400).json({ error: "Super Admin ID is required" });
    }

    const admins = await prisma.admin.findMany({
      where: { superAdminId },
      select: { id: true, username: true, allowedDevices: true },
    });

    res.status(200).json({ message: "Admins fetched successfully", admins });
  } catch (error) {
    console.error("Fetch Admins Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// ✅ Super Admin Dashboard
const getSuperAdminDashboard = async (req, res) => {
  try {
    const superAdminId = req.superAdmin.id;

    const totalAdmins = await prisma.admin.count({ where: { superAdminId } });
    const totalUsers = await prisma.user.count();

    res.status(200).json({ message: "Dashboard data fetched", data: { totalAdmins, totalUsers } });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { createSuperAdmin,fetchAllAdmins, getSuperAdminDashboard };
