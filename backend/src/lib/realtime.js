//  handle real-time chat, track who's online, and send updates

import { Server } from "socket.io";
import http from "http";
import express from "express";
import { 
  generateDHKeyPair, 
  computeSharedKey, 
  storeSharedKey, 
  removeSharedKeysForUser,
  hasSharedKey
} from "./encryption.js";

const app = express(); 
const server = http.createServer(app); // create an HTTP server using Express

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
  // Add security options
  maxHttpBufferSize: 1e6, // 1MB max buffer size
  pingTimeout: 60000,
  pingInterval: 25000,
});

export function userSocketId(userId) {
  return socketMap[userId];
}

// in order to know which users are online
const socketMap = {}; // {userId: socketId}

// Store DH key pairs for each user
const userKeyPairs = new Map(); // {userId: {publicKey, privateKey, prime, generator}}

io.on("connection", (socket) => {  // handle new client connections
  console.log("user connected", socket.id);

  const userId = socket.handshake.query.userId;

  // Validate userId before storing
  if (userId && typeof userId === "string" && userId.match(/^[0-9a-fA-F]{24}$/)) {
    socketMap[userId] = socket.id;

    // Limit concurrent connections per user
    const userCon = Object.values(socketMap).filter(id => id === socket.id).length;
    if (userCon > 3) {
      socket.emit("error", "Looks like you are connected in multiple places. Please disconnect one connection to continue");
      socket.disconnect();
      return;
    }

    // Generate DH key pair for this user
    try {
      const keyPair = generateDHKeyPair();
      userKeyPairs.set(userId, keyPair);

      // Notify other users that this user is online and send public key
      Object.keys(socketMap).forEach(otherUserId => {
        if (otherUserId !== userId) {
          const otherSocketId = socketMap[otherUserId];

          // Send our public key to the other user
          io.to(otherSocketId).emit("dhKeyExchange", {
            fromUserId: userId,
            publicKey: keyPair.publicKey,
            prime: keyPair.prime,
            generator: keyPair.generator
          });
        }
      });
    } catch (error) {
      console.error("Error generating key pair:", error);
      socket.emit("error", "Failed to establish secure connection");
    }
  } else {
    socket.emit("error", "Invalid user ID");
    socket.disconnect();
    return;
  }

  // send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(socketMap));

  // Rate limit for socket events
  let msgCount = 0;
  const resetInterval = setInterval(() => {
    msgCount = 0;
  }, 60000); // Reset every minute

  // Handle receiving a public key from another user
  socket.on("dhKeyExchange", (data) => {
    try {
      const { fromUserId, publicKey, prime, generator } = data;

      // Validate the data
      if (!fromUserId || !publicKey || !prime || !generator) {
        socket.emit("error", "Invalid key exchange data");
        return;
      }

      // Get our key pair
      const myKeyPair = userKeyPairs.get(userId);
      if (!myKeyPair) {
        socket.emit("error", "Key pair not found");
        return;
      }

      // Compute shared key
      const sharedKey = computeSharedKey(
        myKeyPair.privateKey,
        publicKey,
        prime,
        generator
      );

      // Store the shared key
      storeSharedKey(userId, fromUserId, sharedKey);

      // Acknowledge the key exchange
      socket.emit("dhKeyExchangeComplete", { withUserId: fromUserId });

      // Send our public key back if we haven't already
      if (!hasSharedKey(userId, fromUserId)) {
        io.to(socketMap[fromUserId]).emit("dhKeyExchange", {
          fromUserId: userId,
          publicKey: myKeyPair.publicKey,
          prime: myKeyPair.prime,
          generator: myKeyPair.generator
        });
      }
    } catch (error) {
      console.error("Error in key exchange:", error);
      socket.emit("error", "Failed to complete key exchange");
    }
  });

  socket.on("newMsg", () => {
    msgCount++;
    if (msgCount > 30) { // Max 30 messages per minute
      socket.emit("error", "Rate limit exceeded");
      return;
    }
  });

  socket.on("disconnect", () => { // remove the disconnected user's socket ID from map
    console.log("A user disconnected", socket.id);

    // Clean up resources
    delete socketMap[userId];
    userKeyPairs.delete(userId);
    removeSharedKeysForUser(userId);

    clearInterval(resetInterval);
    io.emit("getOnlineUsers", Object.keys(socketMap)); // update the list of online users for all connected clients
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

export { io, app, server }; 
