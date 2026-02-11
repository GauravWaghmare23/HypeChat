import { requireAuth, getAuth } from "@clerk/express";
import UserModel from "../models/User";

export const protectRoute = [
  requireAuth(),

  async (req, res, next) => {
    try {
      const { userId: clerkId } = getAuth(req);

      if (!clerkId) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      const user = await UserModel.findOne({ clerkId }).select("_id");

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not registered",
        });
      }

      req.userId = user._id;
      next();
    } catch (err) {
      console.error("protectRoute error:", err);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },
];
