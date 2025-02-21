const express = require("express");
const { uploadDocument, addDocumentForUser, addUser, login} = require("../controllers/adminController");
const { sendMessage, receiveMessage } = require("../controllers/sendMessageController");
const { upload } = require("../middlewares/multerConfig");


const router = express.Router();


router.post("/login", login);
router.post("/create-user", addUser);
router.post("/add-document",upload.single("file"),addDocumentForUser);
router.post("/whatsapp-webhook", sendMessage); 
router.post("/receive-message", receiveMessage);

module.exports = router;
