const { PrismaClient } = require("@prisma/client");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------LOGIN API------------------
exports.login = async (req, res) => {
  const { username, password, deviceInfo, ipAddress } = req.body;

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const activeSessions = await prisma.deviceSession.count({
      where: { adminId: admin.id, isActive: true },
    });

    if (activeSessions >= admin.allowedDevices) {
      return res.status(403).json({ message: "Max device limit reached" });
    }

    await prisma.deviceSession.create({
      data: { adminId: admin.id, deviceInfo, ipAddress, isActive: true },
    });

    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, admin });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ---------------------LOGOUT API------------------
exports.logout = async (req, res) => {
  const { sessionId } = req.body;
  try {
    const session = await prisma.deviceSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ message: "Session not found" });

    await prisma.deviceSession.update({
      where: { id: sessionId },
      data: { isActive: false, logoutTime: new Date() },
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// -----------------ADD NEW USER-----------------
exports.addUser = async (req, res) => {
  try {
    const { whatsappNumber, username, email, address, age, gender } = req.body;
    if (!whatsappNumber) return res.status(400).json({ error: "WhatsApp number is required" });

    const existingUser = await prisma.user.findUnique({ where: { whatsappNumber } });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const user = await prisma.user.create({
      data: { whatsappNumber, username: username || "", email, address, age, gender },
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ error: err.message });
  }
};

// -----------------ADD DOCUMENT FOR USER-----------------
exports.addDocumentForUser = async (req, res) => {
  try {
    const { userId, type, name, year } = req.body; // Include `year` if applicable

    if (!userId || !type || !name || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Ensure user exists before proceeding
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fileUrl = req.file.path;

    // ✅ Explicitly connect the user using `userId`
    const savedDocument = await prisma.document.create({
      data: {
        userId, // Directly passing userId
        type,
        name,
        fileUrl,
        year: year || null, // Ensure optional year is handled
      },
    });

    res.status(201).json({ message: "Document uploaded successfully", document: savedDocument });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



// -----------------CREATE ADMIN USER-----------------
exports.createAdminUser = async (req, res) => {
  try {
    const { username, password, superAdminId } = req.body;
    if (!username || !password || !superAdminId) {
      return res.status(400).json({ error: "Username, password, and SuperAdmin ID are required" });
    }

    const superAdmin = await prisma.superAdmin.findUnique({ where: { id: superAdminId } });
    if (!superAdmin) return res.status(404).json({ error: "SuperAdmin not found" });

    const existingAdmin = await prisma.admin.findUnique({ where: { username } });
    if (existingAdmin) return res.status(400).json({ error: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: { username, password: hashedPassword, superAdminId },
    });

    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (err) {
    console.error("Error creating Admin:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
