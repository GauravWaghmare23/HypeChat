import e from "express";
import { protectRoute } from "../middlewares/auth.middleware";
import { getMe } from "../controllers/auth.controller";

const router = e.Router();

router.get("/me",protectRoute,getMe);

export default router;