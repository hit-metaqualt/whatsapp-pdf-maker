const sequelize = require("./database"); // Import Sequelize instance
require("../models/userModel"); // Import all models
require("../models/adminModel");
require("../models/documentModel");
require("../models/superAdmin");
require("../models/userModel");



(async () => {
  try {
    await sequelize.sync({ alter: true }); // Sync DB (use { force: true } only for resetting DB)
    console.log("✅ Database synchronized successfully.");
    process.exit();
  } catch (error) {
    console.error("❌ Database synchronization failed:", error);
    process.exit(1);
  }
})();
