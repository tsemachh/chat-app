// exports the routes related to the messaging 



import express from "express";
import { protectRoute } from "../middleware/requireAuth.js";
import { history, UserList, sendMessage } from "../controllers/messageController.js";
import { msgLimiter } from "../middleware/security.js";

const router = express.Router();

router.get("/users", protectRoute, UserList);
router.get("/:id", protectRoute, history);

router.post("/send/:id", protectRoute, msgLimiter, sendMessage);

export default router;