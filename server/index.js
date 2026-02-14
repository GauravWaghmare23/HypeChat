import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";
import { createServer } from "http";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 4000;

logger.info("Initializing HTTP server", { port: PORT });

const httpServer = createServer(app);

connectDB()
  .then(() => {
    logger.info("MongoDB connection established successfully");

    httpServer.listen(PORT, () => {
      logger.info("Server started successfully", { port: PORT });
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("Database connection failed", {
      error: error.message,
      stack: error.stack,
    });

    console.error("Error connecting to MongoDB:", error);
    console.error("Server failed to start.");
    process.exit(1);
  });
