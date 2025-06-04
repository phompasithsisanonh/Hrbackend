require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const http = require("http");
const mongoose = require("mongoose");
const server = http.createServer(app);
const methodOverride = require("method-override");
const connectDB = require("./database/db");
const authrouter = require("./routers/authRouter");
const hrrouter = require("./routers/HRrouter");
const PORT = process.env.PORT || 8080;
const fs = require("fs").promises;
const path = require("path");
app.use(
  cors({
    origin: ["http://localhost:3000","https://e8f6c409.hr-5cy.pages.dev"],
    credentials: true,
    methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, "uploads");
fs.mkdir(uploadDir, { recursive: true })
  .then(() => console.log("Created uploads directory"))
  .catch((err) => console.error("Error creating uploads directory:", err));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

app.use("/api", authrouter);
app.use("/api/informationEmplyee", hrrouter);

const startServer = async () => {
  try {
    // เชื่อมต่อ MongoDB
    await connectDB(process.env.MONGODB_URL);
    console.log("MongoDB connected successfully");

    // รันเซิร์ฟเวอร์
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Connection error:", error);
    process.exit(1);
  }
};

// เรียกใช้งาน
startServer();
