// This file creates a Socket.IO server to manage real-time connections,
  // track online users, and push updates to connected clients

import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express(); 
const server = http.createServer(app); // create an HTTP server using Express

// create new Socket.IO server and attach it to the HTTP server
// configure CORS to allow the frontend (localhost:5173) to connect to it
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// eported utility function to get a user's socket ID by user ID
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// contains a map of userId : socketId, used to know which users are online
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {  // handle new client connections
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => { // remove the disconnected user's socket ID from map
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap)); // update the list of online users for all connected clients
  });
});

export { io, app, server }; // export the instances setup to be used in the main server 