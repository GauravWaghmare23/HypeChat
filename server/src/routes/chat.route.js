import e from "express";
import { protectRoute } from './../middlewares/auth.middleware.js';
import { getChat, getOrCreateChats } from "../controllers/chat.controller.js";

const router = e.Router();

router.get("/",protectRoute,getChat);
router.post("/with/:participantId",protectRoute,getOrCreateChats);

export default router;