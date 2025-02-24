const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createUser = async (req, res) => {
  try {
    const { whatsappNumber, username, email, address, age, gender, adminId } = req.body;

    // 🔹 Ensure required fields are present
    if (!whatsappNumber || !adminId) {
      return res.status(400).json({ error: "whatsappNumber and adminId are required." });
    }

    // 🔹 Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { whatsappNumber },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User with this WhatsApp number already exists." });
    }

    // 🔹 Create a new user
    const user = await prisma.user.create({
      data: {
        whatsappNumber,
        username,
        email,
        address,
        age,
        gender: gender || null, // If gender is empty, set it to `null`
        adminId,
      },
    });

    return res.status(201).json({ message: "User created successfully.", user });
  } catch (error) {
    console.error("Error creating User:", error);

    if (error.code === 'P2002') {
      return res.status(409).json({ error: "User with this WhatsApp number already exists." });
    }

    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

const fetchAllUsers = async (req, res) => {
  try {
    console.log("Admin Object in Request:", req.admin); // Debugging

    if (!req.admin || !req.admin.id) {
      return res.status(401).json({ success: false, error: "Unauthorized: Admin ID not found" });
    }

    const adminId = req.admin.id;

    // Fetch users associated with the given admin ID
    const users = await prisma.user.findMany({
      where: { adminId },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found for this admin." });
    }

    // Convert BigInt values to strings
    const formattedUsers = users.map(user => ({
      ...user,
      id: user.id.toString(),
      lastInteraction: user.lastInteraction ? user.lastInteraction.toString() : "0",
    }));

    return res.status(200).json({ success: true, users: formattedUsers });

  } catch (error) {
    console.error("Fetch Users Error:", error);
    return res.status(500).json({
      success: false,
      error: "Server Error",
      details: error.message,
    });
  }
};


const fetchUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required",
      });
    }

    // Check if user exists before fetching documents
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Fetch documents for the user
    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        name: true,
        fileUrl: true,
        year: true,
        uploadedAt: true,
      },
    });

    return res.status(200).json({
      status: true,
      message: documents.length ? "Documents fetched successfully" : "No documents found",
      data: documents,
    });

  } catch (error) {
    console.error("Error fetching documents:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};






const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("User ID received:", userId);

    if (!userId) {
      return res.status(400).json({ status: false, message: "Invalid or missing User ID" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Delete user (Cascade deletion of related documents)
    await prisma.user.delete({ where: { id: userId } });

    return res.status(200).json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};


const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, address, age, gender } = req.body;

    console.log("Received userId:", userId);
    console.log("Received body:", req.body);

    if (!userId || !isUuid(userId)) {
      return res.status(400).json({ status: false, message: "Invalid or missing User ID" });
    }

    // Fetch user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, gender: true } // Fetch only required fields
    });

    if (!existingUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Validate and process gender
    let validGender = existingUser.gender;
    if (gender) {
      const allowedGenders = Object.values(prisma.user_gender);
      if (!allowedGenders.includes(gender)) {
        return res.status(400).json({ 
          status: false, 
          message: `Invalid gender. Allowed values: ${allowedGenders.join(", ")}` 
        });
      }
      validGender = gender; // Use Prisma enum directly
    }

    // Update user details (only provided fields)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username || undefined,
        email: email || undefined,
        address: address || undefined,
        age: age || undefined,
        gender: validGender
      },
    });

    return res.status(200).json({ status: true, message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};



module.exports = { createUser ,editUser,deleteUser,fetchUserDocuments,fetchAllUsers}; // ✅ Ensure Correct Export
