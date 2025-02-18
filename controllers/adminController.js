const User = require("../models/userModel");
const Document = require("../models/documentModel");
const multer = require("multer");

// Multer Setup for File Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage }).single("document");

// Add User
exports.addUser = async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    const user = new User({ whatsappNumber });
    await user.save();
    res.status(201).json({ message: "User added successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upload Document for User
exports.uploadDocument = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    const { userId, type } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    try {
      const document = new Document({ userId, type, fileUrl });
      await document.save();

      await User.findByIdAndUpdate(userId, { $push: { documents: document._id } });

      res.status(201).json({ message: "Document uploaded successfully", document });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
