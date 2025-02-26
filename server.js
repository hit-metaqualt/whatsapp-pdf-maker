require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client"); 
const prisma = new PrismaClient(); // Initialize Prisma
const path = require("path");


const adminRoutes = require("./routes/adminRoutes");
const authRoutes= require("./routes/authRoutes");
const superAdminRoutes =require("./routes/superAdminRoutes")


const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true })); 

BigInt.prototype.toJSON = function () {
  return this.toString();
};




async function testDBConnection() {
  try {
    await prisma.$connect();
    console.log("✅ MySQL Database Connected Successfully!");
  } catch (error) {
    console.error("❌ MySQL Connection Error:", error);
  }
}
testDBConnection();


// Routes

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", superAdminRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve files





app.get("/test", (req, res) => {
  res.status(200).json({ message: "Server is working correctly with Prisma & MySQL!" });
});
  





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));