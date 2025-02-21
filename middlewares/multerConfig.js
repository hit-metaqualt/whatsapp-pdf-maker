const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Configure Multer Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const fileExtension = file.originalname.split(".").pop(); // Get correct extension
    const fileName = `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`; // Remove existing extension
    
    console.log("📂 Uploading file:", fileName, "with extension:", fileExtension);

    return {
      folder: "user_documents",  // Folder where the file will be uploaded
      format: fileExtension,     // Set correct format
      public_id: fileName,       // Ensure no duplicate extensions
      resource_type: 'raw',      // Set resource type to 'raw' for PDFs
    };
  },
});

// ✅ File Filter for PDFs and Images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, JPG, and PNG allowed"), false);
  }
};

// ✅ Multer Upload Middleware
const upload = multer({ storage, fileFilter });

module.exports = { upload };
