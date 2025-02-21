// const mongoose = require("mongoose");

// const documentSchema = new mongoose.Schema({
//   userId: { type: String, required: true },
//   type: { type: String, required: true },
//   name: { type: String, required: true },
//   fileUrl: { type: String, required: true },
//   uploadedAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Document", documentSchema);




const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("../models/userModel");

const Document = sequelize.define("Document", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { 
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: "id" }
  },
  type: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false }, // ITR Document Year
  uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: true });

User.hasMany(Document, { foreignKey: "userId" });
Document.belongsTo(User, { foreignKey: "userId" });

module.exports = Document;
