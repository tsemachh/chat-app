// exports the routes related to the messaging 



import express from "express";
import { protectRoute } from "../secureAccess/verifyUser.js";
import { history, UserList, sendMsg } from "../Handlers/msgHandler.js";
import { msgLimiter } from "../secureAccess/security.js";

const msgEndpoint = express.Router();

msgEndpoint.get("/users", protectRoute, UserList);
msgEndpoint.get("/:id", protectRoute, history);

msgEndpoint.post("/send/:id", protectRoute, msgLimiter, sendMsg);

export default msgEndpoint;