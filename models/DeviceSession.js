const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import Sequelize instance
const Admin = require("../models/adminModel"); // Import Admin model

const DeviceSession = sequelize.define("DeviceSession", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Admin,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  deviceInfo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  loginTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  logoutTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

Admin.hasMany(DeviceSession, { foreignKey: "adminId", onDelete: "CASCADE" });
DeviceSession.belongsTo(Admin, { foreignKey: "adminId" });

module.exports = DeviceSession;
