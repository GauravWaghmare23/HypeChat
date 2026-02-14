import ChatModel from "../models/Chat.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

export async function getChat(req, res) {
  logger.info("getChat API called", { userId: req.userId });

  try {
    const userId = req.userId;

    if (!userId) {
      logger.warn("Unauthorized access in getChat");
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn("Invalid user ID in getChat", { userId });
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID",
      });
    }

    const chats = await ChatModel.find({ participants: userId })
      .populate("participants", "_id name avatar")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    logger.info("Chats fetched successfully", {
      userId,
      chatCount: chats.length,
    });

    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== userId,
      );

      return {
        _id: chat._id,
        name: otherParticipant?.name || null,
        avatar: otherParticipant?.avatar || null,
        lastMessage: chat.lastMessage || null,
        lastMessageAt: chat.lastMessageAt || null,
      };
    });

    return res.status(200).json({
      status: "success",
      data: formattedChats,
    });
  } catch (error) {
    logger.error("getChat error", {
      error: error.message,
      stack: error.stack,
    });

    console.error("getChat error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}

export async function getOrCreateChats(req, res) {
  logger.info("getOrCreateChats API called", {
    userId: req.userId,
    participantId: req.params?.participantId,
  });

  try {
    const userId = req.userId;
    const { participantId } = req.params;

    if (!userId) {
      logger.warn("Missing user ID in getOrCreateChats");
      return res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn("Invalid user ID in getOrCreateChats", { userId });
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID",
      });
    }

    if (!participantId) {
      logger.warn("Missing participant ID in getOrCreateChats");
      return res.status(400).json({
        status: "error",
        message: "Participant ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      logger.warn("Invalid participant ID", { participantId });
      return res.status(400).json({
        status: "error",
        message: "Invalid participant ID",
      });
    }

    if (userId === participantId) {
      logger.warn("Attempt to create self-chat", { userId });
      return res.status(400).json({
        status: "error",
        message: "Cannot create chat with yourself",
      });
    }

    let chat = await ChatModel.findOne({
      participants: { $all: [userId, participantId] },
    });

    if (!chat) {
      logger.info("Chat not found, creating new chat", {
        userId,
        participantId,
      });

      const newChat = await ChatModel.create({
        participants: [userId, participantId],
      });

      chat = await newChat.populate("participants", "_id name avatar");

      logger.info("New chat created", { chatId: chat._id });
    } else {
      logger.info("Existing chat found", { chatId: chat._id });
    }

    const otherParticipant = chat.participants.find(
      (p) => p._id.toString() !== userId,
    );

    return res.status(200).json({
      status: "success",
      data: {
        _id: chat._id,
        participants: chat.participants || null,
        name: otherParticipant?.name || null,
        avatar: otherParticipant?.avatar || null,
        lastMessage: chat.lastMessage || null,
        lastMessageAt: chat.lastMessageAt || null,
      },
    });
  } catch (error) {
    logger.error("getOrCreateChats error", {
      error: error.message,
      stack: error.stack,
    });

    console.error("getOrCreateChats error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}
