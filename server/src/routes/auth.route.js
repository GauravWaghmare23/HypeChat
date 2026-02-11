import e from "express";
import { protectRoute } from "../middlewares/auth.middleware";
import { authCallback, getMe } from "../controllers/auth.controller";

const router = e.Router();

router.get("/me",protectRoute,getMe);
router.post("/callback",authCallback);

export default router;