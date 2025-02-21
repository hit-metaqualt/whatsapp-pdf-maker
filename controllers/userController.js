const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ✅ Create User Function
const createUser = async (req, res) => {
  try {
    const { whatsappNumber, username, email, address, age, gender, adminId } = req.body;

    // 🔹 Validate Input
    if (!whatsappNumber || !adminId) {
      return res.status(400).json({ error: "WhatsApp number and Admin ID are required" });
    }

    // 🔹 Check if Admin Exists
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // 🔹 Check if User Exists
    const existingUser = await prisma.user.findUnique({
      where: { whatsappNumber },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User with this WhatsApp number already exists" });
    }

    // 🔹 Create User
    const user = await prisma.user.create({
      data: {
        whatsappNumber,
        username: username || "",
        email: email || "",
        address: address || "",
        age: age || null,
        gender: gender || "Other",
        adminId,
      },
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error("Error creating User:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { createUser }; // ✅ Ensure Correct Export
