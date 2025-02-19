const mongoose = require("mongoose");
const User = require("../models/userModel");
const Document = require("../models/documentModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer Setup (Memory Storage for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("fileUrl"); // Ensure the field name is "document"

// ✅ Add New User
exports.addUser = async (req, res) => {
  try {
    const { whatsappNumber, username, email, address, age, gender } = req.body;

    console.log("Received request to add user:", req.body);

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ whatsappNumber });
    if (existingUser) {
      return res.status(400).json({ error: "User with this WhatsApp number already exists" });
    }

    // ✅ Create new user
    const user = new User({
      whatsappNumber,
      username: username || "",
      email: email || "",
      address: address || "",
      age: age || null,
      gender: gender || "",
    });

    await user.save();
    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Upload Document to Cloudinary and Save in MongoDB
exports.addDocumentForUser = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: "File upload failed", details: err.message });
    }

    let { userId, type, name } = req.body;
    console.log("Received request to add document:", { userId, type, name });

    // ✅ Validate Inputs
    if (!userId || !type || !name || !req.file) {
      return res.status(400).json({ error: "userId, type, name, and file are required" });
    }

    try {
      // ✅ Find user by ObjectId or WhatsApp number
      let user = mongoose.Types.ObjectId.isValid(userId)
        ? await User.findById(userId)
        : await User.findOne({ whatsappNumber: userId });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // ✅ Determine File Type for Cloudinary
      const fileType = req.file.mimetype.startsWith("image/") ? "image" : "raw";

      // ✅ Upload file to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: fileType, folder: "documents" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ error: "Cloudinary upload failed" });
          }

          console.log("Cloudinary Upload Result:", result);

          // ✅ Save document in MongoDB
          const document = new Document({
            userId: user._id,
            type,
            name,
            fileUrl: result.secure_url,
          });

          await document.save();

          // ✅ Link document to user
          user.documents.push(document._id);
          await user.save();

          res.status(201).json({ message: "Document added successfully", document });
        }
      );

      // ✅ Convert Buffer to Stream and Upload
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: err.message });
    }
  });
};