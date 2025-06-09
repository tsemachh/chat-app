// exports the paths relevant to the auth process

import express from "express";
import { checkAuth, signIn, logout, signup, updateProfile } from "../controllers/authController.js";
import { protectRoute } from "../middleware/requireAuth.js";
import { logLimiter } from "../middleware/security.js";

const router = express.Router();

router.post("/signup", logLimiter, signup);
router.post("/signIn", logLimiter, signIn);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;