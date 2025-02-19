require("dotenv").config();
const twilio = require("twilio");
const Document = require("../models/documentModel"); 
const User = require("../models/userModel"); 

const path = require("path"); 
const fs = require("fs");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);


const sendMessage = async (req, res) => {
  try {
    const { to, type } = req.body;
    
    let pdfUrl = "https://res.cloudinary.com/dm2x9xuwa/image/upload/v1733563340/cld-sample-5.jpg";

    // Ensure HTTPS format
    const formattedPdfUrl = pdfUrl.startsWith("http") ? pdfUrl : `https:${pdfUrl}`;

    const message = await client.messages.create({
      body: `Here is your requested ${type} document.`,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${to}`,
      mediaUrl: [formattedPdfUrl], // ✅ Must be an array
    });

    console.log("Message sent successfully:", message.sid);
    res.status(200).json({ success: true, msg: "Message sent", sid: message.sid });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: error.message });
  }  
};



// const sendMessage = async (req, res) => {
//   try {
//     const { to, type, userId } = req.body;

//     console.log("Received request:", req.body);

//     const user = await User.findOne({ whatsappNumber: userId });

//     if (!user) {
//       console.log("User not found:", to);
//       return res.status(404).json({ success: false, msg: "User not found" });
//     }

//     console.log("User found:", user);

//     const document = await Document.findOne({ userId: user._id, type }).sort({ createdAt: -1 });

//     if (!document || !document.fileUrl) {
//       console.log("No document found for type:", type);
//       return res.status(404).json({ success: false, msg: "No document found for this type" });
//     }

//     let cloudinaryUrl = document.fileUrl;


//         let pdfUrl = cloudinaryUrl;

//     const formattedPdfUrl = pdfUrl.startsWith("http") ? pdfUrl : `https:${pdfUrl}`;

//     console.log("Final Media URL:", formattedPdfUrl);


//     const message = await client.messages.create({
//       body: `Here is your requested ${type} document.`,
//       from: "whatsapp:+14155238886",
//       to: `whatsapp:${to}`,
//       mediaUrl: [formattedPdfUrl],
//     });

//     console.log("Message sent successfully:", message.sid);
//     res.status(200).json({ success: true, msg: "Message sent", sid: message.sid });

//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ success: false, msg: error.message });
//   }
// };





module.exports = {
  sendMessage,
  
};
