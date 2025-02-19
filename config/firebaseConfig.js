const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "firebaseAdmin.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "your-project-id.appspot.com", // Replace with your Firebase Storage bucket
});

const bucket = admin.storage().bucket();

module.exports = bucket;
