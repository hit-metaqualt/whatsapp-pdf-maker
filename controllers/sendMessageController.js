require("dotenv").config();
const Document = require("../models/documentModel");
const User = require("../models/userModel");
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

    const user = await User.findOne({ whatsappNumber: userId });

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

    const user = await User.findOne({ whatsappNumber: formattedNumber });

    if (!user) {
      console.log("❌ User not found in database.");
      await sendMessageToUser(From, "❌ You are not registered. Please contact Admin.");
      return res.status(400).send("User not found.");
    }

    console.log("🔍 User from DB:", user);

    const userDocuments = await Document.find({ userId: formattedNumber });

    if (!userDocuments || userDocuments.length === 0) {
      console.log("❌ No documents found for this user.");
      await sendMessageToUser(From, "❌ No documents are linked to your account. Please upload your documents.");
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

    // Step 1: If user selects "ITR", ask for the year
    if (userMessage === "itr" || userMessage === "3") {
      await sendMessageToUser(
        From,
        `📄 Please select the ITR year:\n\n2022, 2023, 2024\n\nReply with the year you need.`
      );
      await User.updateOne({ whatsappNumber: formattedNumber }, { lastInteraction: Date.now(), waitingForItrYear: true });
      return res.status(200).send("ITR year selection request sent.");
    }

    // Step 2: If user is selecting an ITR year
    if (user.waitingForItrYear) {
      const validYears = ["2022", "2023", "2024"];
      
      // If the user has selected an invalid year
      if (!validYears.includes(userMessage)) {
        await sendMessageToUser(
          From,
          `❌ Invalid year selected. Please reply with a valid year (2022, 2023, 2024).`
        );
        return res.status(400).send("Invalid ITR year.");
      }

      console.log(`🔍 User selected ITR year: ${userMessage}`);

      // If the user selects ITR, send default URL and message
      if (validYears.includes(userMessage)) {
        console.log("2222222222222222222");
        await sendMessageToUser(
          From,
          `✅ You have selected ITR for the year ${userMessage}.\n` +
          `Here is the default ITR document URL: [ITR Document](https://res.cloudinary.com/dm2x9xuwa/image/upload/v1733563331/samples/animals/three-dogs.jpg)\n\n` +
          `If you need any further assistance or have questions, feel free to ask!`
        );
        // Reset ITR year selection state
        await User.updateOne({ whatsappNumber: formattedNumber }, { waitingForItrYear: false });
        return res.status(200).send("Static message and URL sent for ITR.");
      }
    }

    if (["2022", "2023", "2024"].includes(userMessage)) {
      await sendMessageToUser(
        From,
        `✅ You have selected ITR for the year ${userMessage}.\n` +
        `Here is the default ITR document PDF for testing: [Download ITR Document PDF](https://res.cloudinary.com/dm2x9xuwa/raw/upload/v1739957947/documents/dj6tiazvv74f8yeyihyt)\n\n` +
        `If you need any further assistance or have questions, feel free to ask!`
      );
    
      await sendMediaMessage(
        From,
        "https://res.cloudinary.com/dm2x9xuwa/raw/upload/v1739957947/documents/dj6tiazvv74f8yeyihyt", // New PDF URL
        "ITR Document.pdf"
      );
    
      await sendMessageToUser(
        From,
        `👋 Hello *${user.username || 'there'}*! How can I assist you?\n\n` +
        `Please select a document type:\n` +
        `1️⃣ PAN\n2️⃣ Aadhar\n3️⃣ ITR\n4️⃣ Passport\n5️⃣ Bank Statement\n6️⃣ Payroll\n7️⃣ Voter ID\n8️⃣ Driving License\n\n` +
        `Reply with the number or document name.`
      );
    }

    // Step 3: Handle normal document requests (Other than ITR)
    if (!["2022", "2023", "2024"].includes(userMessage) && !docTypes[userMessage]) {
      await sendMessageToUser(
        From,
        `👋 Hello *${user.username || 'there'}*! How can I assist you?\n\n` +
        `Please select a document type:\n` +
        `1️⃣ PAN\n2️⃣ Aadhar\n3️⃣ ITR\n4️⃣ Passport\n5️⃣ Bank Statement\n6️⃣ Payroll\n7️⃣ Voter ID\n8️⃣ Driving License\n\n` +
        `Reply with the number or document name.`
      );
      return res.status(200).send("Greeting message sent.");
    }

    const docType = docTypes[userMessage];
    console.log(`🔍 Searching for document: ${docType} for user ${formattedNumber}`);

    await sendMessageToUser(From, `🔍 Searching for your ${docType.toUpperCase()} document...`);

    const document = userDocuments.find(doc => doc.type === docType);

    if (!document) {
      console.log(`❌ No ${docType.toUpperCase()} document found for user ${formattedNumber}`);
      await sendMessageToUser(From, `❌ No ${docType.toUpperCase()} document found for your account.`);
      // No greeting message will be sent here
      return res.status(404).send(`${docType.toUpperCase()} document not found.`);
    }

    console.log(`✅ Sending ${docType.toUpperCase()} document to ${From}`);
    await sendMediaMessage(From, document.fileUrl, `${docType.toUpperCase()} Document.pdf`);
    return res.status(200).send("PDF sent.");
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
