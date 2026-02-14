import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authLimiter, globalLimiter } from "./middlewares/rateLimiter.js";
import logger from "./utils/logger.js";
import client from "./utils/metrics.js";
import { metricsMiddleware } from "./middlewares/metricsMiddleware.js";

const app = express();

logger.info("Initializing Express application");

app.use(helmet());
logger.info("Helmet middleware applied");

app.use(cors({ origin: "*" }));
logger.info("CORS middleware configured");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
logger.info("Body parsers configured");

app.use(cookieParser());
logger.info("Cookie parser middleware applied");

app.use(clerkMiddleware());
logger.info("Clerk middleware initialized");

app.use(globalLimiter);
logger.info("Global rate limiter enabled");

app.use(metricsMiddleware);
logger.info("Prometheus metrics middleware enabled");

app.get("/metrics", async (req, res) => {
  logger.info("Metrics endpoint accessed");
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.get("/health", (req, res) => {
  logger.info("Health check endpoint accessed");
  res.json({
    status: "ok",
    message: "server is running!",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authLimiter, authRoutes);
logger.info("Auth routes registered");

app.use("/api/chats", chatRoutes);
logger.info("Chat routes registered");

app.use("/api/messages", messageRoutes);
logger.info("Message routes registered");

app.use("/api/users", userRoutes);
logger.info("User routes registered");

app.use(errorHandler);
logger.info("Global error handler configured");

export default app;
