import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import ChatModel from "../models/Chat.js";
import UserModel from "../models/User.js";
import MessageModel from "../models/Message.js";
import logger from "../utils/logger.js"; 

// In-memory storage of online users
// Key → userId, Value → socketId
export const onlineUsers = new Map();

export const initializeSocket = (httpServer) => {
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" },
  });

  /**
   * ====================================================
   * SOCKET AUTHENTICATION MIDDLEWARE
   * Runs before any client is allowed to connect.
   * Ensures only verified users can establish real-time
   * communication.
   * ====================================================
   */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger.warn("Socket rejected: No token", {
          ip: socket.handshake.address,
        });
        return next(new Error("Authentication error"));
      }

      // Verify Clerk JWT
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const clerkId = session.sub;

      // Find user in database
      const user = await UserModel.findOne({ clerkId }).lean();

      if (!user) {
        logger.warn("Socket rejected: User not found", { clerkId });
        return next(new Error("User not found"));
      }

      // Attach userId to socket context
      socket.data.userId = user._id.toString();

      logger.info("Socket authenticated", { userId: socket.data.userId });

      next();
    } catch (error) {
      logger.error("Socket auth failed", { error: error.message });
      next(new Error("Authentication error"));
    }
  });

  /**
   * ====================================================
   * CONNECTION HANDLER
   * Triggered every time a user connects.
   * ====================================================
   */
  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    logger.info("User connected", { userId, socketId: socket.id });

    /**
     * Send currently online users to new connection.
     * This helps frontend show online indicators.
     */
    socket.emit("online-users", {
      userIds: Array.from(onlineUsers.keys()),
    });

    /**
     * Store user in memory for presence tracking.
     */
    onlineUsers.set(userId, socket.id);

    /**
     * Notify all other users that this user is online.
     */
    socket.broadcast.emit("user-online", { userId });

    /**
     * Join personal room.
     * Used for notifications and background updates.
     */
    socket.join(`user:${userId}`);

    /**
     * ====================================================
     * CHAT ROOM SUBSCRIPTION
     * Users join a room when they open a chat.
     * ====================================================
     */
    socket.on("join-chat", (chatId) => {
      logger.info("Join chat", { userId, chatId });
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", (chatId) => {
      logger.info("Leave chat", { userId, chatId });
      socket.leave(`chat:${chatId}`);
    });

    /**
     * ====================================================
     * SEND MESSAGE EVENT
     * Flow:
     * 1. Validate user participation
     * 2. Save message to DB
     * 3. Update chat metadata
     * 4. Emit to active chat participants
     * ====================================================
     */
    socket.on("send-message", async (data) => {
      try {
        const { chatId, text } = data;

        logger.info("Send message request", { userId, chatId });

        // Authorization
        const chat = await ChatModel.findOne({
          _id: chatId,
          participants: userId,
        });

        if (!chat) {
          logger.warn("Unauthorized message attempt", {
            userId,
            chatId,
          });

          socket.emit("socket-error", { message: "Chat not found" });
          return;
        }

        // Persist message
        const message = await MessageModel.create({
          chat: chatId,
          sender: userId,
          text,
        });

        // Update chat metadata
        chat.lastMessage = message._id;
        chat.lastMessageAt = new Date();
        await chat.save();

        await message.populate("sender", "_id name avatar");

        logger.info("Message saved", {
          messageId: message._id,
          chatId,
        });

        /**
         * Emit to users currently inside the chat.
         */
        io.to(`chat:${chatId}`).emit("new-message", message);

        /**
         * Emit to personal rooms for background updates.
         */
        for (const participantId of chat.participants) {
          io.to(`user:${participantId}`).emit("new-message", message);
        }
      } catch (error) {
        logger.error("Message send failed", {
          error: error.message,
        });

        socket.emit("socket-error", {
          message: "Failed to send message",
        });
      }
    });

    /**
     * ====================================================
     * TYPING INDICATOR
     * Temporary event, not stored in DB.
     * ====================================================
     */
    socket.on("typing", async (data) => {
      const payload = {
        userId,
        chatId: data.chatId,
        isTyping: data.isTyping,
      };

      logger.debug("Typing event", payload);

      socket.to(`chat:${data.chatId}`).emit("typing", payload);

      try {
        const chat = await ChatModel.findById(data.chatId);

        if (chat) {
          const other = chat.participants.find(
            (p) => p.toString() !== userId
          );

          if (other) {
            socket.to(`user:${other}`).emit("typing", payload);
          }
        }
      } catch (error) {
        logger.warn("Typing lookup failed", {
          error: error.message,
        });
      }
    });

    /**
     * ====================================================
     * DISCONNECT HANDLER
     * Updates online status when user leaves.
     * ====================================================
     */
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);

      logger.info("User disconnected", { userId });

      socket.broadcast.emit("user-offline", { userId });
    });
  });

  return io;
};
