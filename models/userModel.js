// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   whatsappNumber: { type: String, required: true, unique: true },
//   username: { type: String, default: "" },   // Optional
//   email: { type: String, default: "" },      // Optional
//   address: { type: String, default: "" },    // Optional
//   age: { type: Number, default: null },      // Optional
//   gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" }, // Optional
//   documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
// });

// module.exports = mongoose.model("User", userSchema);



const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Admin = require("../models/adminModel");


const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  whatsappNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  username: { type: DataTypes.STRING, defaultValue: "" },
  email: { type: DataTypes.STRING, defaultValue: "" },
  address: { type: DataTypes.STRING, defaultValue: "" },
  age: { type: DataTypes.INTEGER, defaultValue: null },
  gender: { type: DataTypes.ENUM("Male", "Female", "Other"), defaultValue: "Other" },
  adminId: { 
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Admin, key: "id" }
  }
}, { timestamps: true });

Admin.hasMany(User, { foreignKey: "adminId" });
User.belongsTo(Admin, { foreignKey: "adminId" });

module.exports = User;
