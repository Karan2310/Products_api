import mongoose from "mongoose";

import env from "../src/config/env.js";
import Product from "../src/models/product.model.js";
import products from "./product-seed-data.js";

const run = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`Existing products detected (${existingCount}). They will be removed before seeding.`);
      await Product.deleteMany({});
    }

    const inserted = await Product.insertMany(products);
    console.log(`Inserted ${inserted.length} products.`);
  } catch (error) {
    console.error("Failed to seed products", error);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
  }
};

run();
