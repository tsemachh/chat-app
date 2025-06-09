// this file specifies controller methods to retrieve chat users, get messages between users, and transmit new messages

import User from "../models/userModel.js"
import Message from "../models/messageModel.js";

import { userSocketId, io } from "../lib/socket.js";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import { encText, decText } from "../lib/encryption.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// returns a list of all users except the currently user
export const UserUserList = async (req, res) => {
  try {
    const loggedId = req.user._id;
        // finds all the users except the currently one making the request 
    const filtere = await User.find({ _id: { $ne: loggedId } }).select("-password");

    res.status(200).json(filtere);
  } catch (error) {
    console.error("Error in UserUserList: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// returns the full message history between the currently user and another user
export const getMessages = async (req, res) => {
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

    // Decrypt messages for client
    const decrypted = messages.map(message => {
      try {
        if (message.text && message.encryptedData) {
          return {
            ...message.toObject(),
            text: decText(message.encryptedData),
            encryptedData: undefined
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
    console.log("Error in getMessages controller: ", error.message);
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
      // Use worker thread for image processing to avoid blocking main thread
      const workerPath = path.join(__dirname, "../workers/imageProcessor.js");
      const worker = new Worker(workerPath);
      
      // Process image in worker thread
      const imageProce = new Promise((resolve, reject) => {
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
      
      imageUrl = await imageProce;
    }

    // Encrypt sensitive text data before saving
    let encryptedData;
    if (text) {
      try {
        encryptedData = encText(text);
      } catch (error) {
        console.error("Encryption error:", error);
        return res.status(500).json({ error: "Failed to secure message" });
      }
    }

    // create a new message document
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text ? "[Encrypted]" : undefined, // Store placeholder
      encryptedData: encryptedData,
      image: imageUrl,
    });

    await newMessage.save();

    // if the recipient is online, send them the new message via Socket.IO
    const receiverSocketId = userSocketId(receiverId);
    if (receiverSocketId) {
      // Send decrypted message to real-time socket
      const socketMessage = {
        ...newMessage.toObject(),
        text: text, // Send original text for real-time display
        encryptedData: undefined
      };
      io.to(receiverSocketId).emit("newMessage", socketMessage);
    }

    // Return decrypted message to sender
    const responseMessage = {
      ...newMessage.toObject(),
      text: text,
      encryptedData: undefined
    };

    res.status(201).json(responseMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};