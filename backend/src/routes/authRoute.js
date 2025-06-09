// exports the paths relevant to the auth process

import express from "express";
import { checkAuth, signIn, signOut, signup, updateProfile } from "../controllers/authController.js";
import { protectRoute } from "../middleware/requireAuth.js";
import { logLimiter } from "../middleware/security.js";

const router = express.Router();

router.post("/signup", logLimiter, signup);
router.post("/signIn", logLimiter, signIn);
router.post("/signOut", signOut);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;