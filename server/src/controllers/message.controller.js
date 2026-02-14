import ChatModel from "../models/Chat.js";
import MessageModel from "../models/Message.js";
import logger from "../utils/logger.js";

export async function getMessages(req, res) {
  logger.info("getMessages API called", {
    userId: req.userId,
    chatId: req.params?.chatId,
  });

  try {
    const userId = req.userId;

    if (!userId) {
      logger.warn("Unauthorized access in getMessages");
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const { chatId } = req.params;

    if (!chatId) {
      logger.warn("Missing chatId in getMessages", { userId });
      return res.status(400).json({
        status: "error",
        message: "Chat ID is required",
      });
    }

    const chat = await ChatModel.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      logger.warn("Chat not found or user not participant", {
        userId,
        chatId,
      });
      return res.status(404).json({
        status: "error",
        message: "Chat not found",
      });
    }

    const messages = await MessageModel
      .find({ chat: chatId })
      .populate("sender", "_id name email avatar")
      .sort({ createdAt: 1 });

    logger.info("Messages fetched successfully", {
      userId,
      chatId,
      messageCount: messages.length,
    });

    return res.status(200).json({
      status: "success",
      data: messages,
    });

  } catch (error) {
    logger.error("getMessages error", {
      error: error.message,
      stack: error.stack,
    });

    console.error("getMessages error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}
