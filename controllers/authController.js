const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || "";



// 🔹 Common Login API (For both Super Admin & Admin)
exports.loginUser = async (req, res) => {
    try {
      const { username, password } = req.body;
  
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
      }
  
      let user = null;
      let role = null;
  
      // Check in SuperAdmin table
      user = await prisma.superadmin.findUnique({ where: { username } });
      if (user) {
        role = "superAdmin";
      } else {
        // Check in Admin table if not found in SuperAdmin
        user = await prisma.admin.findUnique({ where: { username } });
        if (user) {
          role = "admin";
        }
      }
  
      // If no user is found in either table
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
  
      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
  
      // Generate JWT token (valid for 1 day)
      const token = jwt.sign(
        { id: user.id, username: user.username, role },
        SECRET_KEY,
        { expiresIn: "1d" }
      );
  
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role,
          createdAt: user.createdAt,
        },
      });
  
    } catch (error) {
      console.error("Login Error:", error);
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  };

// 🔹 Logout API (For both Super Admin & Admin)
exports.logoutUser = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Verify token
    try {
      jwt.verify(token, SECRET_KEY);
      return res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }

  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};




exports.getLoggedInUser = async (req, res) => {
  try {
    // Ensure `req.user` exists and contains a valid `id` (set from authentication middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    const { id } = req.user;
    let userData = null;

    // First, check if the user is a superAdmin
    const superAdmin = await prisma.superadmin.findUnique({
      where: { id },
      select: { id: true, username: true, maxDevices: true },
    });

    // If found in superAdmin, set userData
    if (superAdmin) {
      userData = { role: "superAdmin", ...superAdmin };
    }

    // If not found in superAdmin, check in admin
    if (!userData) {
      const admin = await prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          allowedDevices: true,
          createdAt: true,
          superadmin: { select: { id: true, username: true } }, // ✅ Correct field name
        },
      });

      // If found in admin, set userData
      if (admin) {
        userData = { role: "admin", ...admin };
      }
    }

    // If no user is found in both schemas, return 404
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "User fetched successfully", user: userData });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
