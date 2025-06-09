// this file specifies controller methods to retrieve chat users, get messages between users, and transmit new messages

import User from "../models/userModel.js"
import Message from "../models/msgModel.js";

import { userSocketId, io } from "../lib/socket.js";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import { encText, decText } from "../lib/encryption.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// returns a list of all users except the currently user
export const UserList = async (req, res) => {
  try {
    const loggedId = req.user._id;
        // all the users except the currently
    const filter = await User.find({ _id: { $ne: loggedId } }).select("-password");

    res.status(200).json(filter);
  } catch (error) {
    console.error("Error in UserList: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// history between the currently user and another user
export const history = async (req, res) => {
  try {
    const { id: userToChatId } = req.params; // other user
    const myId = req.user._id;

    // get all messages where sender is me or the other person
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // dec messages for client
    const decrypted = messages.map(message => {
      try {
        if (message.text && message.encData) {
          return {
            ...message.toObject(),
            text: decText(message.encData),
            encData: undefined
          };
        }
        return message.toObject();
      } catch (error) {
        console.error("Error decrypting message:", error);
        return {
          ...message.toObject(),
          text: "[Message could not be decrypted]"
        };
      }
    });

    res.status(200).json(decrypted);
  } catch (error) {
    console.log("Error in history controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // worker thread for image processing to avoid blocking main thread
      const workerPath = path.join(__dirname, "../workers/imgHandler.js");
      const worker = new Worker(workerPath);
      
      // Process image in worker thread
      const imgProcess = new Promise((resolve, reject) => {
        worker.postMessage({ image });
        
        worker.on("message", (result) => {
          worker.terminate();
          if (result.success) {
            resolve(result.url);
          } else {
            reject(new Error(result.error));
          }
        });
        
        worker.on("error", (error) => {
          worker.terminate();
          reject(error);
        });
      });
      
      imageUrl = await imgProcess;
    }

    // Encrypt sensitive text data before saving
    let encData;
    if (text) {
      try {
        encData = encText(text);
      } catch (error) {
        console.error("Encryption error:", error);
        return res.status(500).json({ error: "Failed to secure message" });
      }
    }

    // create a new message document
    const newMsg = new Message({
      senderId,
      receiverId,
      text: text ? "[Encrypted]" : undefined, // Store placeholder
      encData: encData,
      image: imageUrl,
    });

    await newMsg.save();

    // if the recipient is online, send them the new message via Socket.IO
    const recvSockId = userSocketId(receiverId);
    if (recvSockId) {
      // Send decrypted message to real-time socket
      const socketMessage = {
        ...newMsg.toObject(),
        text: text, // Send original text for real-time display
        encData: undefined
      };
      io.to(recvSockId).emit("newMsg", socketMessage);
    }

    // Return decrypted message to sender
    const responseMsg = {
      ...newMsg.toObject(),
      text: text,
      encData: undefined
    };

    res.status(201).json(responseMsg);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};