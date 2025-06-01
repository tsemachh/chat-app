// this file specifies controller methods to retrieve chat users, get messages between users, and transmit new messages

import User from "../models/user.model.js"
import Message from "../models/message.model.js";
import { Worker, isMainThread, parentPort, workerData, threadId } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io, encrypt, decrypt } from "../lib/socket.js";

// Worker pool for message processing
const NUM_MESSAGE_WORKERS = 2;
const messageWorkers = [];

// Initialize message worker pool
if (isMainThread) {
  const __filename = fileURLToPath(import.meta.url);
  const workerPath = path.resolve(__filename);

  for (let i = 0; i < NUM_MESSAGE_WORKERS; i++) {
    const worker = new Worker(workerPath, {
      workerData: { workerId: i, type: 'message-worker' }
    });
    messageWorkers.push(worker);
  }
}

// returns a list of all users except the currently user
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // finds all the users except the currently one making the request 
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
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

    // Decrypt messages before sending to client
    const decryptedMessages = messages.map(message => {
      const msg = message.toObject();
      if (msg.encryptedText) {
        try {
          msg.text = decrypt(msg.encryptedText);
          delete msg.encryptedText;
        } catch (err) {
          console.error("Error decrypting message:", err);
          msg.text = "Message could not be decrypted";
        }
      }
      return msg;
    });

    res.status(200).json(decryptedMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Process message in a worker thread
const processMessageInWorker = (data) => {
  return new Promise((resolve, reject) => {
    // Select a worker from the pool
    const workerIndex = Math.floor(Math.random() * NUM_MESSAGE_WORKERS);
    const worker = messageWorkers[workerIndex];

    // Create a unique ID for this request
    const requestId = Date.now() + Math.random().toString(36).substring(2, 15);

    // Set up a one-time listener for this specific request
    const messageHandler = (message) => {
      if (message.requestId === requestId) {
        worker.removeListener('message', messageHandler);
        if (message.error) {
          reject(new Error(message.error));
        } else {
          resolve(message.result);
        }
      }
    };

    worker.on('message', messageHandler);

    // Send the data to the worker
    worker.postMessage({
      type: 'processMessage',
      requestId,
      data
    });
  });
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Validate input
    if (!text && !image) {
      return res.status(400).json({ error: "Message text or image is required" });
    }

    let imageUrl;
    if (image) {
      // Validate image before uploading
      if (!image.startsWith('data:image/')) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      try {
        // Upload image in a separate thread if in main thread
        if (isMainThread) {
          const uploadResult = await processMessageInWorker({
            action: 'uploadImage',
            image
          });
          imageUrl = uploadResult.secure_url;
        } else {
          // Direct upload if already in a worker thread
          const uploadResponse = await cloudinary.uploader.upload(image, {
            resource_type: 'image',
            folder: 'chat-app-secure',
            access_mode: 'authenticated',
            type: 'authenticated'
          });
          imageUrl = uploadResponse.secure_url;
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }

    // Encrypt the message text
    const encryptedText = text ? encrypt(text) : null;

    // Create a new message document
    const newMessage = new Message({
      senderId,
      receiverId,
      text: null, // Don't store plaintext
      encryptedText, // Store encrypted text instead
      image: imageUrl,
    });

    await newMessage.save();

    // Create a safe version to send to the client (with decrypted text)
    const safeMessage = newMessage.toObject();
    safeMessage.text = text;
    delete safeMessage.encryptedText;

    // If the recipient is online, send them the new message via Socket.IO
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", safeMessage);
    }

    res.status(201).json(safeMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Handle worker thread messages if this is a worker
if (!isMainThread && workerData?.type === 'message-worker') {
  console.log(`Message worker ${workerData.workerId} started`);

  parentPort.on('message', async (message) => {
    if (message.type === 'processMessage') {
      try {
        const { data, requestId } = message;
        let result;

        if (data.action === 'uploadImage') {
          // Upload image to cloudinary
          const uploadResponse = await cloudinary.uploader.upload(data.image, {
            resource_type: 'image',
            folder: 'chat-app-secure',
            access_mode: 'authenticated',
            type: 'authenticated'
          });
          result = uploadResponse;
        }

        // Send the result back to the main thread
        parentPort.postMessage({
          requestId,
          result
        });
      } catch (error) {
        // Send the error back to the main thread
        parentPort.postMessage({
          requestId: message.requestId,
          error: error.message
        });
      }
    }
  });
}
