import ChatModel from "../models/Chat.js";
import mongoose from "mongoose";

export async function getChat(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID",
      });
    }

    const chats = await ChatModel.find({ participants: userId })
      .populate("participants", "_id name avatar")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

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
    console.error("getChat error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}

export async function getOrCreateChats(req, res) {
  try {
    const userId = req.userId;
    const { participantId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID",
      });
    }

    if (!participantId) {
      return res.status(400).json({
        status: "error",
        message: "Participant ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid participant ID",
      });
    }

    if (userId === participantId) {
      return res.status(400).json({
        status: "error",
        message: "Cannot create chat with yourself",
      });
    }

    let chat = await ChatModel.findOne({
      participants: { $all: [userId, participantId] },
    });

    if (!chat) {
      const newChat = await ChatModel.create({
        participants: [userId, participantId],
      });
      chat = await newChat.populate("participants", "_id name avatar");
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
    console.error("getOrCreateChats error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}
