import UserModel from "../models/User.js";
import logger from "../utils/logger.js";

export async function getUsers(req, res) {
  logger.info("getUsers API called", { userId: req.userId });

  try {
    const userId = req.userId;

    if (!userId) {
      logger.warn("Unauthorized access in getUsers");
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const users = await UserModel
      .find({ _id: { $ne: userId } })
      .select("_id name email avatar");

    logger.info("Users fetched successfully", {
      userId,
      userCount: users.length,
    });

    return res.status(200).json({
      status: "success",
      data: users,
    });

  } catch (error) {
    logger.error("getUsers error", {
      error: error.message,
      stack: error.stack,
    });

    console.error("getUsers error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}
