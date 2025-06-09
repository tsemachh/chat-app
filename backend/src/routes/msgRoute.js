// exports the routes related to the messaging 



import express from "express";
import { protectRoute } from "../secureAccess/verifyUser.js";
import { history, UserList, sendMessage } from "../Handlers/msgHandler.js";
import { msgLimiter } from "../secureAccess/security.js";

const router = express.Router();

router.get("/users", protectRoute, UserList);
router.get("/:id", protectRoute, history);

router.post("/send/:id", protectRoute, msgLimiter, sendMessage);

export default router;