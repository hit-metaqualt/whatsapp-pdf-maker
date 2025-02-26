require("dotenv").config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken, {
  httpClient: new twilio.Twilio(),
});

const sendMessage = async (req, res) => {
  try {
    const { to, type, userId } = req.body;

    console.log("Received request:", req.body);

    const user = await User.findOne({ whatsappNumber: to });


    if (!user) {
      console.log("User not found:", to);
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    console.log("User found:", user);

    const document = await Document.findOne({ userId: user._id, type }).sort({
      createdAt: -1,
    });

    if (!document || !document.fileUrl) {
      console.log("No document found for type:", type);
      return res
        .status(404)
        .json({ success: false, msg: "No document found for this type" });
    }

    let cloudinaryUrl = document.fileUrl;

    let pdfUrl = cloudinaryUrl;

    const formattedPdfUrl = pdfUrl.startsWith("http")
      ? pdfUrl
      : `https:${pdfUrl}`;

    console.log("Final Media URL:", formattedPdfUrl);

    // Debug: Check if Cloudinary file is accessible
    const https = require("https");
    https
      .get(formattedPdfUrl, (response) => {
        if (response.statusCode === 200) {
          console.log("Cloudinary file is accessible");
        } else {
          console.log(
            "Cloudinary file is not accessible. Status code:",
            response.statusCode
          );
          return res
            .status(500)
            .json({ success: false, msg: "Cloudinary file is not accessible" });
        }
      })
      .on("error", (e) => {
        console.error("Error checking Cloudinary file:", e);
        return res
          .status(500)
          .json({ success: false, msg: "Error accessing Cloudinary file" });
      });

    // Send the message with media URL
    const message = await client.messages.create({
      body: `Here is your requested ${type} document.`,
      from: "whatsapp:+14155238886", // Make sure this is a Twilio WhatsApp number
      to: `whatsapp:${to}`,
      mediaUrl: [formattedPdfUrl], // Media URL must be an array
    });

    console.log("Message sent successfully:", message.sid);
    res
      .status(200)
      .json({ success: true, msg: "Message sent", sid: message.sid });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};




const axios = require("axios");

const receiveMessage = async (req, res) => {
  try {
    const { Body, From } = req.body;
    
    if (!Body || !From) {
      console.log("⚠️ Invalid message format received.");
      return res.status(400).send("Invalid message format.");
    }

    console.log(`📩 Incoming Message from ${From}: ${Body}`);
    const formattedNumber = From.replace("whatsapp:", "").replace("+91", "").trim();

    const user = await prisma.user.findUnique({ where: { whatsappNumber: formattedNumber } });
    if (!user) {
      console.log("❌ User not found.");
      await sendMessageToUser(From, "👋 You are not registered. Please contact Admin.");
      return res.status(400).send("User not found.");
    }

    console.log("🔍 User from DB:", user);

    let documents;
    try {
      documents = await prisma.document.findMany({ where: { userId: user.id } });
    } catch (error) {
      console.error("❌ Error fetching documents:", error);
      await sendMessageToUser(From, "🚨 Technical issue occurred. Please try again later.");
      return res.status(500).send("Error fetching documents.");
    }

    if (!documents || documents.length === 0) {
      console.log("❌ No documents found.");
      await sendMessageToUser(From, "❌ No documents found. Please contact Admin.");
      return res.status(400).send("No documents found.");
    }

    let userMessage = Body.trim().toLowerCase();
    console.log(`📩 User Message: ${userMessage}`);

    const docMap = documents.reduce((acc, doc, index) => {
      acc[(index + 1).toString()] = doc;
      acc[doc.name.toLowerCase()] = doc;
      return acc;
    }, {});

    if (docMap[userMessage]) {
      const document = docMap[userMessage];
      const baseUrl = process.env.FILE_BASE_URL  || "http://192.168.1.95:5000/uploads/";
      // "http://localhost:5000/uploads/"
      let fileUrl = document.fileUrl.startsWith("http") ? document.fileUrl : `${baseUrl}${document.fileUrl}`;

      if (!(await isValidFileUrl(fileUrl))) {
        console.error(`❌ Invalid or inaccessible media URL: ${fileUrl}`);
        await sendMessageToUser(From, "❌ Error: Document is unavailable. Please contact Admin.");
        return res.status(400).send("Invalid or inaccessible media URL.");
      }

      console.log(`✅ Sending ${document.name} document to ${From}`);
      await sendMediaMessage(From, fileUrl, `${document.name} Document.pdf`);
      return res.status(200).send("PDF sent.");
    }

    const docList = documents.map((doc, index) => `${index + 1}️⃣ ${doc.name}`).join("\n");
    await sendMessageToUser(From, `📄 Select a document by number:\n${docList}`);

    await prisma.user.update({
      where: { whatsappNumber: formattedNumber },
      data: { lastInteraction: Math.floor(Date.now() / 1000) },
    });

    return res.status(200).send("Document list sent.");
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    await sendMessageToUser(req.body?.From || "", "🚨 Technical issue occurred. Please try again later.");
    res.status(500).json({ success: false, msg: "An error occurred." });
  }
};

const sendMessageToUser = async (to, message) => {
  try {
    if (!to) throw new Error("Recipient number missing");
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to,
      body: message,
    });
    console.log(`📩 Sent message to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending message to ${to}:`, error);
  }
};

const sendMediaMessage = async (to, mediaUrl, fileName) => {
  console.log("🔗 Media URL:", mediaUrl);
  try {
    if (!(await isValidFileUrl(mediaUrl))) {
      throw new Error(`Invalid or inaccessible media URL: ${mediaUrl}`);
    }
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to,
      // mediaUrl: [mediaUrl],
      mediaUrl: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'],
      body: `📄 Here is your requested document: ${fileName}`,
    });
    console.log(`📩 Sent document to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending document to ${to}:`, error);
  }
};

const isValidFileUrl = async (url) => {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch {
    return false;
  }
};











module.exports = {
  sendMessage,
  receiveMessage,
};
