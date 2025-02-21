const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SuperAdmin = sequelize.define("SuperAdmin", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  maxDevices: { type: DataTypes.INTEGER, defaultValue: 1 },  // Max devices allowed
}, { timestamps: true });

module.exports = SuperAdmin;
