import app from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";

export default async function handler(req, res) {
  try {
    await connectDatabase();
  } catch (error) {
    res.status(500).json({ error: "Failed to connect to database" });
    return;
  }

  await new Promise((resolve, reject) => {
    res.on("close", resolve);
    res.on("finish", resolve);
    res.on("error", reject);
    try {
      app(req, res);
    } catch (error) {
      reject(error);
    }
  }).catch((error) => {
    console.error("Unhandled error in request handler", error);
  });
}
