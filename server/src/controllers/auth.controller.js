import { clerkClient, getAuth } from "@clerk/express";
import UserModel from "../models/User.js";
import logger from "../utils/logger.js";

export async function getMe(req, res) {
  logger.info("getMe API called", { userId: req.userId });

  try {
    const user = await UserModel
      .findById(req.userId)
      .select("_id name email avatar createdAt");

    if (!user) {
      logger.warn("User not found in getMe", { userId: req.userId });

      return res.status(404).json({
        status: "error",
        message: "User not found, please register",
      });
    }

    logger.info("User fetched successfully", { userId: req.userId });

    return res.status(200).json({
      status: "success",
      data: user,
    });

  } catch (err) {
    logger.error("getMe error", { error: err.message, stack: err.stack });

    console.error("getMe error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}

export async function authCallback(req, res) {
  logger.info("authCallback API called");

  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      logger.warn("Unauthorized access in authCallback");

      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    logger.info("Clerk authentication successful", { clerkId });

    let user = await UserModel
      .findOne({ clerkId })
      .select("_id name email avatar createdAt");

    if (!user) {
      logger.info("User not found in DB, creating new user", { clerkId });

      const clerkUser = await clerkClient.users.getUser(clerkId);

      const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;

      if (!primaryEmail) {
        logger.warn("No email associated with Clerk account", { clerkId });

        return res.status(400).json({
          status: "error",
          message: "No email associated with Clerk account",
        });
      }

      const createdUser = new UserModel({
        clerkId,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
          : primaryEmail.split("@")[0],
        email: primaryEmail,
        avatar: clerkUser.imageUrl,
      });

      await createdUser.save();

      logger.info("New user created successfully", { userId: createdUser._id });

      user = {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        avatar: createdUser.avatar,
        createdAt: createdUser.createdAt,
      };
    } else {
      logger.info("Existing user logged in", { userId: user._id });
    }

    return res.status(200).json({
      status: "success",
      data: user,
    });

  } catch (error) {
    logger.error("authCallback error", {
      error: error.message,
      stack: error.stack,
    });

    console.error("authCallback error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}
