const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  whatsappNumber: { type: String, required: true, unique: true },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
});

module.exports = mongoose.model("User", userSchema);
