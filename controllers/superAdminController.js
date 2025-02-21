const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

// ✅ Create SuperAdmin Function
const createSuperAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🛑 Validate Input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // 🔒 Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create SuperAdmin
    const superAdmin = await prisma.superAdmin.create({
      data: { username, password: hashedPassword },
    });

    res.status(201).json({ message: "SuperAdmin created successfully", superAdmin });
  } catch (error) {
    console.error("Error creating SuperAdmin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { createSuperAdmin }; // ✅ Ensure Correct Export
