// exports the paths relevant to the auth process

import express from "express";
import { checkAuth, signIn, signOut, signup, updateProfile } from "../Handlers/authHandler .js";
import { protectRoute } from "../secureAccess/verifyUser.js";
import { logLimiter } from "../secureAccess/security.js";

const accRouter = express.Router();

accRouter.post("/signup", logLimiter, signup);
accRouter.post("/signIn", logLimiter, signIn);
accRouter.post("/signOut", signOut);

accRouter.put("/update-profile", protectRoute, updateProfile);

accRouter.get("/check", protectRoute, checkAuth);

export default accRouter;