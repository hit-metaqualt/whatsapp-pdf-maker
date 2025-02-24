const { PrismaClient } = require("@prisma/client");
const cloudinary = require("cloudinary").v2;
const prisma = new PrismaClient();
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});




const documentsRequiringYear = new Set(["ITR"]);



exports.addDocumentForUser = async (req, res) => {
  try {
    const { userId, type, name, year } = req.body;

    // ✅ Validate Input
    if (!userId || !type || !name || !req.file) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // ✅ Require `year` if needed
    if (documentsRequiringYear.has(type) && !year) {
      return res.status(400).json({ success: false, message: `Year is required for ${type} documents` });
    }

    // ✅ Check if User Exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Get Cloudinary File URL
    const fileUrl = req.file.path;

    // ✅ Save Document in Database
    const savedDocument = await prisma.document.create({
      data: { userId, type, name, fileUrl, year: documentsRequiringYear.has(type) ? year : null },
    });

    return res.status(201).json({ success: true, message: "Document uploaded successfully", document: savedDocument });

  } catch (error) {
    console.error("Document Upload Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



