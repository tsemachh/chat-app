// This file exports the routes related to the messaging  in the backend API using Express

// - message.route.js creats a list of users for the UserList
// - message.route.js fetchs all messages exchanged with user
// - message.route.js sends new messages to a specific user

import express from "express";
import { protectRoute } from "../middleware/requireAuth.js";
import { getMessages, UserUserList, sendMessage } from "../controllers/messageController.js";
import { messageRateLimit } from "../middleware/security.js";

const router = express.Router();

router.get("/users", protectRoute, UserUserList);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, messageRateLimit, sendMessage);

export default router;