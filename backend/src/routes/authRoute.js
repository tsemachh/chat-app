// exports the paths relevant to the auth process

import express from "express";
import { checkAuth, signIn, signOut, signup, updateProfile } from "../Handlers/authHandler .js";
import { protectRoute } from "../secureAccess/verifyUser.js";
import { logLimiter } from "../secureAccess/security.js";

const router = express.Router();

router.post("/signup", logLimiter, signup);
router.post("/signIn", logLimiter, signIn);
router.post("/signOut", signOut);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;