const express = require("express");
const { addUser, uploadDocument } = require("../controllers/adminController");
// const { processIncomingMessage } = require("../controllers/sendMessageController");
const { sendMessage, processReceivedMessages } = require("../controllers/sendMessageController");



const router = express.Router();
router.post("/whatsapp-webhook", sendMessage); 
router.get("/whatsapp-received", processReceivedMessages); 



// https://whatsapp-pdf-maker.onrender.com/api/admin/whatsapp-received



module.exports = router;
