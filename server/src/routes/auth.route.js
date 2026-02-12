import e from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { authCallback, getMe } from "../controllers/auth.controller.js";

const router = e.Router();

router.get("/me",protectRoute,getMe);
router.post("/callback",authCallback);

export default router;