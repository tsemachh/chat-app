// This file exports the paths relevant to the auth process that are in the backend API using Express.

// - auth.route.js creates endpoints for signing up, logging in, and logging out 
// - auth.route.js allows users to update their profile picture and the background (only if they are authenticated)

import express from "express";
import { checkAuth, login, logout, signup, updateProfile } from "../controllers/authControl.js";
import { protectRoute } from "../middleware/requireAuth.js";
import { loginRateLimit } from "../middleware/security.js";

const router = express.Router();

router.post("/signup", loginRateLimit, signup);
router.post("/login", loginRateLimit, login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;