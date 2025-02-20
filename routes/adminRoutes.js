const express = require("express");
const { uploadDocument, addDocumentForUser, addUser} = require("../controllers/adminController");
const { sendMessage, receiveMessage } = require("../controllers/sendMessageController");


const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });



router.post("/create-user", addUser);
router.post("/add-document",upload.single("file"),addDocumentForUser);
router.post("/whatsapp-webhook", sendMessage); 
router.post("/receive-message", receiveMessage);

module.exports = router;
