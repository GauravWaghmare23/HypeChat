import { requireAuth, getAuth } from "@clerk/express";
import UserModel from "../models/User.js";
import logger from "../utils/logger.js";

export const protectRoute = [
  requireAuth(),

  async (req, res, next) => {
    logger.info("protectRoute middleware triggered");

    try {
      const { userId: clerkId } = getAuth(req);

      if (!clerkId) {
        logger.warn("Unauthorized access in protectRoute");
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      logger.info("Clerk authentication verified", { clerkId });

      const user = await UserModel.findOne({ clerkId }).select("_id");

      if (!user) {
        logger.warn("User not registered in database", { clerkId });
        return res.status(401).json({
          status: "error",
          message: "User not registered",
        });
      }

      req.userId = user._id;

      logger.info("User authorization successful", { userId: user._id });

      next();
    } catch (err) {
      logger.error("protectRoute error", {
        error: err.message,
        stack: err.stack,
      });

      console.error("protectRoute error:", err);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },
];
