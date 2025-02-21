const express = require("express");
const { login, createAdminUser} = require("../controllers/adminController");
const { sendMessage, receiveMessage } = require("../controllers/sendMessageController");
const { upload } = require("../middlewares/multerConfig");
const { createUser } = require("../controllers/userController");
const { addDocumentForUser } = require("../controllers/documentController");



const router = express.Router();


router.post("/login", login);
router.post("/create-user", createUser);
router.post("/create-admin", createAdminUser);

router.post("/add-document",upload.single("file"),addDocumentForUser);
router.post("/whatsapp-webhook", sendMessage); 
router.post("/receive-message", receiveMessage);

module.exports = router;
