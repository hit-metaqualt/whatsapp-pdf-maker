const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// 🔹 Middleware to authenticate admin and superadmin
exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    let decoded;

    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
    }

    // Ensure the user has a valid role (admin or superadmin)
    if (!decoded.role || !["admin", "superAdmin"].includes(decoded.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    let user;
    if (decoded.role === "admin") {
      user = await prisma.admin.findUnique({ where: { id: decoded.id } });
    } else if (decoded.role === "superAdmin") {
      user = await prisma.superadmin.findUnique({ where: { id: decoded.id } });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: `${decoded.role} not found` });
    }

    // Attach user details to request
    req.user = { ...user, role: decoded.role };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
