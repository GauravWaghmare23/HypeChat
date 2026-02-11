import { clerkClient, getAuth } from "@clerk/express";
import UserModel from "../models/User";

export async function getMe(req, res) {
  try {
    const user = await UserModel
      .findById(req.userId)
      .select("_id name email avatar createdAt")

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: user,
    });

  } catch (err) {
    console.error("getMe error:", err);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}

export async function authCallback(req, res) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    let user = await UserModel
      .findOne({ clerkId })
      .select("_id name email avatar createdAt")

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;

      if (!primaryEmail) {
        return res.status(400).json({
          status: "error",
          message: "No email associated with Clerk account",
        });
      }

      try {
        const createdUser = await UserModel.create({
          clerkId,
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
            : primaryEmail.split("@")[0],
          email: primaryEmail,
          avatar: clerkUser.imageUrl,
        });

        user = {
          _id: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          avatar: createdUser.avatar,
          createdAt: createdUser.createdAt,
        };

      } catch (createErr) {
        user = await UserModel
          .findOne({ clerkId })
          .select("_id name email avatar createdAt")
      }
    }

    return res.status(200).json({
      status: "success",
      data: user,
    });

  } catch (error) {
    console.error("authCallback error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}
