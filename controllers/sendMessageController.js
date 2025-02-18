const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const mongoose = require("mongoose");
const axios = require("axios");
const { PDFDocument } = require("pdf-lib");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const Document = require("../models/documentModel"); // Adjust path if needed

// Your Twilio client setup here

const sendMessage = async (req, res) => {
    try {
      const { userId } = req.body;
  
      // Ensure userId is a valid string (phone number)
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ success: false, msg: "Invalid userId (phone number)" });
      }
  
      // Fetch the document based on phone number (userId)
      const document = await Document.findOne({ userId: userId });
  
      if (!document) {
        return res.status(404).json({ success: false, msg: "Document not found" });
      }
  
      // Fetch fileUrl and other properties
      const { fileUrl } = document;
  
      if (!fileUrl) {
        return res.status(400).json({ success: false, msg: "File URL not found" });
      }
  
      // Step 1: Download the image from the URL using axios
      const imageResponse = await axios.get(fileUrl, { responseType: "arraybuffer" });
  
      // Step 2: Convert image to PDF using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const img = await pdfDoc.embedJpg(imageResponse.data);
      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0 });
  
      // Step 3: Save the PDF to a temporary file
      const pdfBytes = await pdfDoc.save();
      const pdfPath = path.join(__dirname, "temp.pdf");
      fs.writeFileSync(pdfPath, pdfBytes);
  
      // Step 4: Create a form-data object to send the PDF to Twilio via WhatsApp
      const form = new FormData();
      form.append("MediaUrl", `data:application/pdf;base64,${pdfBytes.toString("base64")}`);
      form.append("From", process.env.TWILIO_WHATSAPP_NUMBER);
      form.append("To", `whatsapp:${userId}`);
  
      // Step 5: Send the PDF as a WhatsApp message via Twilio API
      client.messages
        .create({
          body: "Here is your requested document as a PDF.",
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${userId}`,
          mediaUrl: pdfPath // Send the media URL (PDF file)
        })
        .then((message) => {
          console.log("Message sent successfully", message);
          return res.status(200).json({ success: true, msg: "Message sent successfully" });
        })
        .catch((error) => {
          console.error("Error sending message:", error);
          return res.status(400).json({ success: false, msg: "Failed to send the message" });
        });
    } catch (error) {
      console.error("Error during PDF creation or sending message:", error);
      return res.status(400).json({ success: false, msg: error.message });
    }
  };
  


const processReceivedMessages = async (req, res) => {
    try {
      const incomingMessage = req.body.Body; // The body of the incoming message
      const fromNumber = req.body.From; // The number from which the message was sent
  
      console.log(`Received message: "${incomingMessage}" from: ${fromNumber}`);
  
      // Create a Twilio response to reply to the user
      const response = new MessagingResponse();
  
      // Add a message to the response
      response.message("Thank you for your message! We received: " + incomingMessage);
  
      // Send the response back to Twilio
      res.set("Content-Type", "text/xml");
      res.status(200).send(response.toString());
    } catch (error) {
      console.error("Error handling incoming message", error);
      res.status(500).send("Error handling incoming message");
    }
  };

module.exports = {
  sendMessage,
  processReceivedMessages
};



// const twilio = require("twilio");
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");
// const mongoose = require("mongoose");
// const Document = require("../models/documentModel"); // Assuming your Document model is in the models folder

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = twilio(accountSid, authToken);

// // Function to send messages via WhatsApp using Twilio
// const sendMessage = async (to, body, filePath = "") => {
//   try {
//     if (filePath) {
//       // Send the PDF file
//       await client.messages.create({
//         mediaUrl: [filePath], // Media URL to the file
//         body: body,
//         from: process.env.TWILIO_WHATSAPP_NUMBER,
//         to: `whatsapp:${to}`,
//       });
//     } else {
//       await client.messages.create({
//         body: body,
//         from: process.env.TWILIO_WHATSAPP_NUMBER,
//         to: `whatsapp:${to}`,
//       });
//     }
//     console.log("Message sent successfully.");
//   } catch (error) {
//     console.error("Error sending message:", error.message);
//   }
// };

// // Function to send options for document types (PAN, Aadhar, etc.)
// const sendDocumentOptions = async (to) => {
//   const message = `Hi, please choose a document you would like to receive:\n\n1. PAN Card\n2. Aadhar Card\n\nReply with the document number (e.g., '1' for PAN Card).`;
//   await sendMessage(to, message);
// };

// // Function to handle the user response and send the document in PDF format
// const handleUserResponse = async (req, res) => {
//   const from = req.body.From; // User's WhatsApp number
//   const body = req.body.Body.trim(); // User's response

//   if (body === "1") {
//     // Fetch PAN Card from MongoDB
//     const document = await Document.findOne({ type: "PAN", userId: from });

//     if (document) {
//       // Generate PDF and send to user
//       const pdfPath = await createPDF(document.fileUrl, from);
//       await sendMessage(from, "Here is your PAN Card as PDF", pdfPath);
//     } else {
//       await sendMessage(from, "Sorry, PAN card not found.");
//     }
//   } else if (body === "2") {
//     // Handle other options like Aadhar card
//     const document = await Document.findOne({ type: "Aadhar", userId: from });

//     if (document) {
//       // Generate PDF and send to user
//       const pdfPath = await createPDF(document.fileUrl, from);
//       await sendMessage(from, "Here is your Aadhar Card as PDF", pdfPath);
//     } else {
//       await sendMessage(from, "Sorry, Aadhar card not found.");
//     }
//   } else {
//     await sendMessage(from, "Invalid option. Please reply with 1 for PAN Card or 2 for Aadhar Card.");
//   }

//   res.sendStatus(200); // Respond to Twilio's request
// };

// // Function to generate a PDF from the document URL
// const createPDF = async (documentUrl, userNumber) => {
//   const doc = new PDFDocument();
//   const fileName = "document.pdf";
//   const filePath = path.join(__dirname, fileName);

//   doc.pipe(fs.createWriteStream(filePath));

//   // Add image (using the provided URL)
//   doc.image(documentUrl, { fit: [250, 300], align: "center", valign: "center" });

//   doc.end();

//   // Wait for the PDF to be generated, then send it to the user
//   setTimeout(async () => {
//     await sendMessage(userNumber, "Here is your document as a PDF", filePath);
//   }, 2000); // Wait for PDF to be generated

//   return filePath;
// };

// // Main function to handle the incoming message
// const processIncomingMessage = async (req, res) => {
//   const from = req.body.From; // User's WhatsApp number
//   const body = req.body.Body.trim(); // User's response

//   console.log("Received message:", body);

//   // If it's the first interaction, send document options
//   if (body.toLowerCase() === "start" || body === "") {
//     await sendDocumentOptions(from);
//   } else if (body.toLowerCase() === "help") {
//     // If user asks for help, send instructions
//     const helpMessage = `You can request the following documents by typing the corresponding number:\n\n1. PAN Card\n2. Aadhar Card\n\nJust reply with the number (e.g., '1' for PAN Card).`;
//     await sendMessage(from, helpMessage);
//   } else if (body.toLowerCase() === "cancel") {
//     // If user cancels, send a confirmation
//     await sendMessage(from, "Your request has been canceled. You can type 'start' to begin again.");
//   } else {
//     // Handle the user response (PAN, Aadhar, etc.)
//     await handleUserResponse(req, res);
//   }

//   res.sendStatus(200); // Respond to Twilio's request
// };



// module.exports = {
//   processIncomingMessage,
 
// };

