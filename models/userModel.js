const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  whatsappNumber: { type: String, required: true, unique: true },
  username: { type: String, default: "" },   // Optional
  email: { type: String, default: "" },      // Optional
  address: { type: String, default: "" },    // Optional
  age: { type: Number, default: null },      // Optional
  gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" }, // Optional
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
});

module.exports = mongoose.model("User", userSchema);
