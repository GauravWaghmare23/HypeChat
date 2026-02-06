import mongoose from "mongoose";

const mongo_uri = process.env.MONGO_URI;

if (!mongo_uri) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

export const connectDB = async () => {
  try {
    await mongoose.connect(mongo_uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};