const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createUser = async (req, res) => {
  try {
    const { whatsappNumber, username, email, address, age, gender, adminId } = req.body;

    // 🔹 Ensure required fields are present
    if (!whatsappNumber || !adminId) {
      return res.status(400).json({ error: "whatsappNumber and adminId are required." });
    }

    // 🔹 Convert age to an integer if it's provided
    const ageInt = age ? parseInt(age, 10) : null;

    // 🔹 Convert gender to match the UserGender enum
    const validGender = gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : null;

    // 🔹 Check if user already exists
    const existingUser = await prisma.User.findUnique({
      where: { whatsappNumber },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User with this WhatsApp number already exists." });
    }

    // 🔹 Create a new user
    const user = await prisma.User.create({
      data: {
        whatsappNumber,
        username,
        email,
        address,
        age: ageInt, // Use the converted integer value
        gender: validGender, // Use the corrected gender value
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
    console.log("User Object in Request:", req.user); // Debugging

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: "Unauthorized: User ID not found" });
    }

    const adminId = req.user.id; // Use req.user instead of req.admin

    // Fetch users associated with the given admin ID
    const users = await prisma.user.findMany({
      where: { adminId },
    });

    // Return success with empty array if no users are found
    const formattedUsers = users.length > 0 
      ? users.map(user => ({
          ...user,
          id: user.id.toString(),
          lastInteraction: user.lastInteraction ? user.lastInteraction.toString() : "0",
        }))
      : [];

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
    const { type } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Define the base URL (change this based on your actual server URL)
    const documents = await prisma.document.findMany({
      where: { userId, ...(type ? { type } : {}) },
      include: {
        yearData: {
          select: {
            id: true,
            documentId: true,
            yearRange: true,
            fileUrl: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "desc" },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    const baseURL = "http://localhost:5000"; // Your Node.js server URL


    const transformedDocuments = documents.map((doc) => ({
      id: doc.id,
      userId: doc.userId,
      type: doc.type,
      name: doc.name,
      fileUrl: doc.fileUrl ? `${baseURL}/uploads/${doc.fileUrl}` : null, // Convert to full URL
      uploadedAt: doc.uploadedAt,
      hasYearWiseData: Array.isArray(doc.yearData) && doc.yearData.length > 0,
      yearWiseData: doc.yearData.map((yearDoc) => ({
        ...yearDoc,
        fileUrl: yearDoc.fileUrl ? `${baseURL}/uploads/${yearDoc.fileUrl}` : null, // Convert to full URL
      })),
    }));


    // const transformedDocuments = documents.map((doc) => ({
    //   id: doc.id,
    //   userId: doc.userId,
    //   type: doc.type,
    //   name: doc.name,
    //   fileUrl: doc.fileUrl ? `${doc.fileUrl}` : null, // Convert to full URL
    //   uploadedAt: doc.uploadedAt,
    //   hasYearWiseData: Array.isArray(doc.yearData) && doc.yearData.length > 0,
    //   yearWiseData: doc.yearData.map((yearDoc) => ({
    //     ...yearDoc,
    //     fileUrl: yearDoc.fileUrl ? `${yearDoc.fileUrl}` : null, // Convert to full URL
    //   })),
    // }));

    return res.status(200).json({
      success: true,
      message: transformedDocuments.length ? "Documents fetched successfully" : "No documents found",
      data: transformedDocuments,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
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
