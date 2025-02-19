const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", documentSchema);
