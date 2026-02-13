import ChatModel from "../models/Chat.js";

export async function getChat(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized",
            });
        }

        const chats = await ChatModel.find({ participants: userId })
            .populate("participants", "_id name avatar")
            .populate("lastMessage")
            .sort({ lastMessageAt: -1 })

        const formattedChats = chats.map((chat) => {
            const otherParticipant = chat.participants.find(
                (p) => p._id.toString() !== userId
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

export async function getOrCreateChats(req, res) {}
