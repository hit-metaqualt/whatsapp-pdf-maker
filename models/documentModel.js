const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true }, // PAN, Aadhar, etc.
  fileUrl: { type: String, required: true }, // URL to the document
});

module.exports = mongoose.model("Document", documentSchema);
