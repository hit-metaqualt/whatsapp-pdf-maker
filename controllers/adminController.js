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



exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token (valid for 1 day)
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role, // Optional: Add role if needed
        createdAt: admin.createdAt,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// ✅ Admin Logout API
exports.adminLogout = async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      // Return successful logout response
      res.json({ success: true, message: "Logout successful" });
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Fetch active session
    const activeSession = await prisma.devicesession.findFirst({
      where: { adminId, isActive: true },
      select: { id: true }
    });

    if (!activeSession) {
      return res.status(404).json({ message: "No active session found" });
    }

    return res.status(200).json({ sessionId: activeSession.id });
  } catch (error) {
    console.error("Fetch Sessions Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
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





// -----------------CREATE ADMIN USER-----------------
exports.createAdminUser = async (req, res) => {
  try {
    const { username, password, superAdminId } = req.body;

    // ✅ Validate Required Fields
    if (!username || !password || !superAdminId) {
      return res.status(400).json({
        success: false,
        message: "Username, password, and superAdminId are required.",
      });
    }

    // ✅ Validate SuperAdmin Existence
    const superAdmin = await prisma.superadmin.findUnique({
      where: { id: superAdminId },
    });

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "SuperAdmin not found.",
      });
    }

    // ✅ Check if Admin Username Already Exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin username already exists. Choose a different username.",
      });
    }

    // ✅ Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create New Admin (Fix: Remove `createdAt`)
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        superAdminId,
      },
      select: {
        id: true,
        username: true,
        superAdminId: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully.",
      admin,
    });

  } catch (err) {
    console.error("Error creating Admin:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: err.message,
    });
  }
};
