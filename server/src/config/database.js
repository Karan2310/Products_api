import mongoose from "mongoose";

import env from "./env.js";

const globalCache = globalThis.__mongoose ?? { conn: null, promise: null };
globalThis.__mongoose = globalCache;

export const connectDatabase = async () => {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(env.MONGODB_URI).then(() => {
      console.log("Connected to MongoDB");
      return mongoose.connection;
    });
  }

  try {
    globalCache.conn = await globalCache.promise;
    return globalCache.conn;
  } catch (error) {
    globalCache.promise = null;
    console.error("MongoDB connection error", error);
    throw error;
  }
};
