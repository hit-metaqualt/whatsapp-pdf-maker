const User = require("../models/userModel");
const Document = require("../models/documentModel");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const DeviceSession = require("../models//DeviceSession");


// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



// ---------------------------LOGIN API------------------


exports.login = async (req, res) => {
  const { username, password, deviceInfo, ipAddress } = req.body;

  try {
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Check current active sessions
    const activeSessions = await DeviceSession.count({ where: { adminId: admin.id, isActive: true } });

    if (activeSessions >= admin.allowedDevices) {
      return res.status(403).json({ message: "Max device limit reached" });
    }

    // Create a new session
    await DeviceSession.create({
      adminId: admin.id,
      deviceInfo,
      ipAddress,
    });

    // Generate JWT token
    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, admin });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ---------------------


// -------------LOGOUT API

exports.logout = async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = await DeviceSession.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.isActive = false;
    session.logoutTime = new Date();
    await session.save();

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



// -----------------







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




exports.addDocumentForUser = async (req, res) => {
  try {
    const { userId, type, name } = req.body;

    // Validate request data
    if (!userId || !type || !name || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Find User by WhatsApp Number (Mobile Number)
    const user = await User.findOne({ whatsappNumber: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("11111111-ading file to Cloudinary:", req.file.originalname);



    // ✅ Get Cloudinary file URL
    const fileUrl = req.file.path;

    console.log("111111111-Cloudinary Upload Successful:", fileUrl);




    // ✅ Create a new document entry
    const newDocument = new Document({
      userId: user.whatsappNumber, // Store the mobile number
      type,
      name,
      fileUrl,
    });

    // ✅ Save document to DB
    const savedDocument = await newDocument.save();

    // ✅ Update User's documents array
    user.documents.push(savedDocument._id);
    await user.save();

    res.status(201).json({
      message: "Document uploaded successfully",
      document: savedDocument,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


