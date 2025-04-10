const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use a different environment variable for the local and production MongoDB URLs
    const mongoURI = process.env.NODE_ENV === "production"
      ? process.env.PRODUCTION_MONGODB_URI
      : process.env.LOCAL_MONGODB_URI;

    await mongoose.connect(mongoURI);
    console.log(`Connected to MongoDB at ${mongoURI}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

module.exports = connectDB;



