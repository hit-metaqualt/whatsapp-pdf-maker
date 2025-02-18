require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const { sendMessage } = require("./controllers/sendMessageController");

const app = express();
app.use(express.json());
app.use(cors());


// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Routes
app.use("/api/admin", adminRoutes);

app.get("/test", (req, res) => {
    res.status(200).json({ message: "Server is working correctly!" });
  });
  



  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
