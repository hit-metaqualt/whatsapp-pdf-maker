const express = require("express");
const { loginUser, logoutUser } = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();



router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);

module.exports = router;
