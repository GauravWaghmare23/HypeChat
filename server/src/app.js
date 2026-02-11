import dotenv from "dotenv";
dotenv.config();
import e from "express";
import { clerkMiddleware } from '@clerk/express'
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = e();

app.use(clerkMiddleware());

app.get("/health", (req, res) => {
  res.json({ status: "ok" ,message:"server is running!", time: new Date().toISOString()});
});

app.use("/api/auth",authRoutes);
app.use("/api/chats",chatRoutes);
app.use("/api/messages",messageRoutes);
app.use("/api/users",userRoutes);

app.use(errorHandler)

export default app;