const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();



const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";





// 🔹 Middleware to authenticate admin and super admin
exports.authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
      }

      // Ensure the user has a valid role (admin or super admin)
      if (!decoded.role || (decoded.role !== "admin" && decoded.role !== "superadmin")) {
        return res.status(403).json({ success: false, message: "Forbidden: Only admins can access this route" });
      }

      // 🔹 Fetch admin details from database
      const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });

      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }

      req.admin = admin; // Attach admin details to request
      next();
    });

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


