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

    if (!userId || !type || !name || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Require `year` dynamically based on the document type
    if (documentsRequiringYear.has(type) && !year) {
      return res.status(400).json({ message: `Year is required for ${type} documents` });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }, // ✅ Only fetch user ID to reduce query load
    });

    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Use Cloudinary URL from Multer or save locally
    const fileUrl = req.file.path;

    // Save the document to the database
    const savedDocument = await prisma.document.create({
      data: { 
        userId,  
        type, 
        name, 
        fileUrl, 
        year: documentsRequiringYear.has(type) ? year : null, // Save year if required
      },
    });

    console.log(`Document uploaded successfully: ${savedDocument.name} for User ID: ${userId}`);  // Console log for confirmation

    res.status(201).json({ message: "Document uploaded successfully", document: savedDocument });

  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};





// Fetch and Send Document via WhatsApp
exports.sendDocumentToWhatsApp = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { documents: true }, // Fetch user documents
    });

    if (!user || user.documents.length === 0) {
      return res.status(404).json({ message: "No documents found for this user" });
    }

    const latestDocument = user.documents[user.documents.length - 1]; // Get the latest uploaded document
    const fileUrl = latestDocument.fileUrl;

    // Send via Twilio WhatsApp API
    const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+${user.whatsappNumber}`, // User's WhatsApp number
      body: `Hello ${user.username || "User"}, here is your requested document: ${fileUrl}`,
    });

    res.status(200).json({ message: "Document sent successfully via WhatsApp", documentUrl: fileUrl });
  } catch (error) {
    console.error("Error sending document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
