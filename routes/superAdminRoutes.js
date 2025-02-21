const express = require("express");
const { createSuperAdmin } = require("../controllers/superAdminController");

const router = express.Router();

// ✅ Route to create a SuperAdmin
router.post("/create-super-admin", createSuperAdmin);

module.exports = router;
