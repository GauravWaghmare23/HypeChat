import ChatModel from "../models/Chat.js";
import MessageModel from "../models/Message.js";


export async function getMessages(req, res) {
    try {

        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized",
            });
        }

        const {chatId} = req.params;

        if (!chatId) {
            return res.status(400).json({
                status: "error",
                message: "Chat ID is required",
            });
        }

        const chat = await ChatModel.findOne({
            _id:chatId,
            participants:userId
        });

        if (!chat) {
            return res.status(404).json({
                status: "error",
                message: "Chat not found",
            });
        }

        const messages = await MessageModel.find({chat:chatId}).populate("sender","_id name email avatar").sort({createdAt:1});

        return res.status(200).json({
            status: "success",
            data: messages,
        });
        
    } catch (error) {
        console.error("getMessages error:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
}