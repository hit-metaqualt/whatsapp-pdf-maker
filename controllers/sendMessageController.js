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



const receiveMessage = async (req, res) => {
  try {
    const { Body, From } = req.body;
    if (!Body || !From) {
      console.log("⚠️ Invalid message format received.");
      return res.status(400).send("Invalid message format.");
    }

    console.log(`📩 Incoming Message from ${From}: ${Body}`);

    const formattedNumber = From.replace("whatsapp:", "").replace("+91", "").trim();
    console.log(`📞 Formatted Number: ${formattedNumber}`);

    // Find user in the database
    const user = await prisma.user.findUnique({
      where: { whatsappNumber: formattedNumber }
    });

    if (!user) {
      console.log("❌ User not found in database.");
      await sendMessageToUser(From, "❌ You are not registered. Please contact Admin.");
      return res.status(400).send("User not found.");
    }

    console.log("🔍 User from DB:", user);

    // Fetch user documents
    const userDocuments = await prisma.document.findMany({
      where: { userId: user.id }
    });

    // If no documents are found, contact admin message
    if (!userDocuments || userDocuments.length === 0) {
      console.log("❌ No documents found for this user.");
      await sendMessageToUser(From, "❌ No documents are linked to your account. Please contact Admin to add documents.");
      return res.status(400).send("No documents found.");
    }

    let userMessage = Body.trim().toLowerCase();
    console.log(`📩 Normalized User Message: ${userMessage}`);

    const docTypes = {
      "1": "pan",
      "2": "adhar",
      "3": "itr",
      "pan": "pan",
      "aadhar": "adhar",
      "itr": "itr",
      "4": "passport",
      "5": "bankstatement",
      "6": "payroll",
      "7": "voterid",
      "8": "drivinglicense"
    };

    // Check if the message is a valid document selection (either number or document name)
    if (docTypes[userMessage]) {
      const docType = docTypes[userMessage];
      console.log(`🔍 Searching for document: ${docType} for user ${formattedNumber}`);

      await sendMessageToUser(From, `🔍 Searching for your ${docType.toUpperCase()} document...`);

      // Search for the document by name (field `name` stores document type in the database)
      const document = userDocuments.find(doc => doc.name.toLowerCase() === docType.toLowerCase());

      if (!document) {
        console.log(`❌ No ${docType.toUpperCase()} document found for user ${formattedNumber}`);
        await sendMessageToUser(From, `❌ No ${docType.toUpperCase()} document found for your account.`);
        return res.status(404).send(`${docType.toUpperCase()} document not found.`);
      }

      console.log(`✅ Sending ${docType.toUpperCase()} document to ${From}`);
      await sendMediaMessage(From, document.fileUrl, `${docType.toUpperCase()} Document.pdf`);

      return res.status(200).send("PDF sent.");
    }

    // If the message is not a valid document type, send a greeting and document list
    console.log("❌ Invalid selection, sending greeting and document list.");
    await sendMessageToUser(
      From,
      `👋 Hello *${user.username || 'there'}*! Welcome back!\n\n` +
      `Please select a document type:\n` +
      `1️⃣ PAN\n2️⃣ Aadhar\n3️⃣ ITR\n4️⃣ Passport\n5️⃣ Bank Statement\n6️⃣ Payroll\n7️⃣ Voter ID\n8️⃣ Driving License\n\n` +
      `Reply with the number or document name.`
    );

    // Update last interaction time
    await prisma.user.update({
      where: { whatsappNumber: formattedNumber },
      data: { lastInteraction: BigInt(Date.now()) }  // Convert to BigInt
    });

    return res.status(200).send("Greeting and document list sent.");

  } catch (error) {
    console.error("❌ Error receiving message:", error);
    res.status(500).json({ success: false, msg: "An error occurred while processing your request." });
  }
};



const sendMessageToUser = async (to, message) => {
  try {
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
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to,
      mediaUrl: [mediaUrl],
      body: `📄 Here is your requested document: ${fileName}`,
    });
    console.log(`📩 Sent document to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending document to ${to}:`, error);
  }
};


module.exports = {
  sendMessage,
  receiveMessage,
};
