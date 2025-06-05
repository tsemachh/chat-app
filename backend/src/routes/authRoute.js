// This file exports the paths relevant to the auth process that are in the backend API using Express.

// - auth.route.js creates endpoints for signing up, logging in, and logging out 
// - auth.route.js allows users to update their profile picture and the background (only if they are authenticated)

import express from "express";
import { userSession, SignIn, SignOut, signup, changeAvatar } from "../controllers/authControl.js";
import { protectRoute } from "../middleware/requireAuth.js";
import { SignInRateLimit } from "../middleware/security.js";

const router = express.Router();

router.post("/signup", SignInRateLimit, signup);
router.post("/SignIn", SignInRateLimit, SignIn);
router.post("/SignOut", SignOut);

router.put("/update-profile", protectRoute, changeAvatar);

router.get("/check", protectRoute, userSession);

export default router;