// exports the routes related to the messaging 



import express from "express";
import { protectRoute } from "../secureAccess/verifyUser.js";
import { history, UserList, sendMsg } from "../Handlers/msgHandler.js";
import { msgLimiter } from "../secureAccess/security.js";

const accRouter = express.Router();

accRouter.get("/users", protectRoute, UserList);
accRouter.get("/:id", protectRoute, history);

accRouter.post("/send/:id", protectRoute, msgLimiter, sendMsg);

export default accRouter;