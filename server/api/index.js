import app from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";

// Connect once when the function is initialized (cold start)
await connectDatabase();

// Export the Express app directly for Vercel
export default app;
