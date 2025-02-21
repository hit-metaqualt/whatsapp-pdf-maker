const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const SuperAdmin = require("../models/superAdmin");

const Admin = sequelize.define("Admin", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  superAdminId: { 
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: SuperAdmin, key: "id" }
  },
  allowedDevices: { type: DataTypes.INTEGER, defaultValue: 1 },  // Device limit
}, { timestamps: true });

SuperAdmin.hasMany(Admin, { foreignKey: "superAdminId" });
Admin.belongsTo(SuperAdmin, { foreignKey: "superAdminId" });

module.exports = Admin;
