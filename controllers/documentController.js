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

exports.addDocumentForUser = async (req, res) => {
  try {
    const { userId, name, year } = req.body;

    console.log("Received file:", req.file);
    console.log("Received body:", req.body);

    if (!userId || !name || !req.file) {
      return res.status(400).json({ success: false, message: "User ID, name, and file are required" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Store local file path
    const filePath = req.file.filename; // ✅ Now path is defined
    // Find or create main document entry
    let document = await prisma.document.findFirst({ where: { userId, name } });

    if (!document) {
      document = await prisma.document.create({
        data: { userId, name, fileUrl: filePath }, // ✅ Added fileUrl
      });
    }

    if (year) {
      let existingYearData = await prisma.documentYearData.findFirst({
        where: { documentId: document.id, yearRange: year },
      });

      if (existingYearData) {
        const updatedYearDocument = await prisma.documentYearData.update({
          where: { id: existingYearData.id },
          data: { fileUrl: filePath, uploadedAt: new Date() },
        });

        return res.status(200).json({
          success: true,
          message: "Year-wise document updated successfully",
          document: { ...updatedYearDocument, name: document.name, year },
        });
      } else {
        const newYearDocument = await prisma.documentYearData.create({
          data: { documentId: document.id, yearRange: year, fileUrl: filePath, uploadedAt: new Date() },
        });

        return res.status(201).json({
          success: true,
          message: "New year-wise document added successfully",
          document: { ...newYearDocument, name: document.name, year },
        });
      }
    } else {
      const updatedDocument = await prisma.document.update({
        where: { id: document.id },
        data: { fileUrl: filePath, uploadedAt: new Date() },
      });

      return res.status(200).json({
        success: true,
        message: "Document updated successfully",
        document: { ...updatedDocument, year: null },
      });
    }
  } catch (error) {
    console.error("Document Upload Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


