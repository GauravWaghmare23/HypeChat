import UserModel from "../models/User.js";

export async function getUsers(req,res){
    try {
        
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized",
            })
        }

        const users = await UserModel.find({_id:{$ne:userId}}).select("_id name email avatar");
        
        if (users.length === 0) {
            return res.status(201).json({
                status: "error",
                message: "User not found",
            });
        }

        return res.status(200).json({
            status: "success",
            data: users,
        });

    } catch (error) {

        console.error("getUsers error:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
}