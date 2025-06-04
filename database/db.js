const mongoose = require("mongoose");
require("dotenv").config();

const options = {
  serverSelectionTimeoutMS: 5000,
  autoIndex: false,
  maxPoolSize: 10,
  socketTimeoutMS: 45000,
  family: 4,
  
};
// Function to connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose
      .connect(process.env.MONGODB_URL, options)
      .then(() => console.log("DB is connected"))
      .catch((err) => console.error("DB connection error:", err));
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};



module.exports = connectDB;