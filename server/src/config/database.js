import mongoose from "mongoose";

import env from "./env.js";

export const connectDatabase = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error", error);
    process.exit(1);
  }
};
