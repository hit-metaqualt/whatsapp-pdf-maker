const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require("dotenv").config();




exports.addDocumentForUser = async (req, res) => {
  try {
    const { userId, name, year } = req.body;

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


exports.deleteDocumentForUser = async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({ success: false, message: "Document ID is required" });
    }

    // Check if the document exists
    const document = await prisma.document.findUnique({ where: { id: documentId } });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Delete related year-wise documents
    await prisma.documentYearData.deleteMany({ where: { documentId } });

    // Delete the main document
    await prisma.document.delete({ where: { id: documentId } });

    return res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete Document Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

