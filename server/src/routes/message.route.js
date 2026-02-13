import e from "express";
import { getMessages } from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = e.Router();

router.get("/chat/:chatId",protectRoute,getMessages);

export default router;