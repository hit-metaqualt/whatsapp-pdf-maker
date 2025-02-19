const express = require("express");
const { uploadDocument, addDocumentForUser, addUser } = require("../controllers/adminController");
// const { processIncomingMessage } = require("../controllers/sendMessageController");
const { sendMessage } = require("../controllers/sendMessageController");



const router = express.Router();

router.post("/create-user", addUser);
router.post("/add-document", addDocumentForUser);

router.post("/whatsapp-webhook", sendMessage); 
// router.get("/whatsapp-received", processReceivedMessages); 






module.exports = router;
