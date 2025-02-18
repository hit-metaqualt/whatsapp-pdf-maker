const express = require("express");
const { addUser, uploadDocument } = require("../controllers/adminController");
// const { processIncomingMessage } = require("../controllers/sendMessageController");
const { sendMessage, processReceivedMessages } = require("../controllers/sendMessageController");



const router = express.Router();
// router.post("/whatsapp-webhook", processIncomingMessage); 
router.post("/whatsapp-webhook", sendMessage); 
router.get("/whatsapp-received", processReceivedMessages); 







module.exports = router;
