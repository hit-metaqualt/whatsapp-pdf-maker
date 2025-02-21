require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client"); 
const prisma = new PrismaClient(); // Initialize Prisma

const adminRoutes = require("./routes/adminRoutes");


const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true })); 





async function testDBConnection() {
  try {
    await prisma.$connect();
    console.log("✅ MySQL Database Connected Successfully!");
  } catch (error) {
    console.error("❌ MySQL Connection Error:", error);
  }
}
testDBConnection();



// MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.log(err));




// Routes

app.use("/api/admin", adminRoutes);

app.get("/test", (req, res) => {
  res.status(200).json({ message: "Server is working correctly with Prisma & MySQL!" });
});
  





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));