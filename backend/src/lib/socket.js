// This file creates a Socket.IO server to manage real-time connections,
  // track online users, and push updates to connected clients

import { Server } from "socket.io";
import http from "http";
import express from "express";
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import crypto from 'crypto';

const app = express(); 
const server = http.createServer(app); // create an HTTP server using Express

// create new Socket.IO server and attach it to the HTTP server
// configure CORS to allow the frontend (localhost:5173) to connect to it
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
  // Add security options
  pingTimeout: 60000, // Close connection after 60s of inactivity
  pingInterval: 25000, // Check connection every 25s
});

// Encryption key for socket communications
const ENCRYPTION_KEY = process.env.SOCKET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; // For AES, this is always 16

// Utility function to encrypt data
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Utility function to decrypt data
export function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// eported utility function to get a user's socket ID by user ID
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// contains a map of userId : socketId, used to know which users are online
const userSocketMap = {}; // {userId: socketId}

// Worker pool for handling socket connections
const NUM_WORKERS = 4;
const workers = [];

// Initialize worker threads if this is the main thread
if (isMainThread) {
  for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = new Worker(__filename, {
      workerData: { workerId: i }
    });
    workers.push(worker);

    // Handle messages from workers
    worker.on('message', (message) => {
      if (message.type === 'updateUserSocketMap') {
        // Update the user socket map
        if (message.action === 'add') {
          userSocketMap[message.userId] = message.socketId;
        } else if (message.action === 'remove') {
          delete userSocketMap[message.userId];
        }
        // Broadcast updated online users
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
      }
    });
  }

  // Handle new socket connections in the main thread
  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    // Validate connection with token
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("Connection rejected: No token provided");
      socket.disconnect(true);
      return;
    }

    const userId = socket.handshake.query.userId;
    if (userId) {
      // Assign this connection to a worker thread
      const workerIndex = Math.floor(Math.random() * NUM_WORKERS);
      workers[workerIndex].postMessage({
        type: 'newConnection',
        userId: userId,
        socketId: socket.id
      });

      userSocketMap[userId] = socket.id;
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("A user disconnected", socket.id);

      if (userId) {
        // Notify workers about disconnection
        workers.forEach(worker => {
          worker.postMessage({
            type: 'disconnection',
            userId: userId
          });
        });

        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
      }
    });
  });
} else {
  // Worker thread code
  parentPort.on('message', (message) => {
    if (message.type === 'newConnection') {
      // Handle new connection in worker thread
      console.log(`Worker ${workerData.workerId} handling connection for user ${message.userId}`);

      // Notify main thread to update user socket map
      parentPort.postMessage({
        type: 'updateUserSocketMap',
        action: 'add',
        userId: message.userId,
        socketId: message.socketId
      });
    } else if (message.type === 'disconnection') {
      // Handle disconnection in worker thread
      console.log(`Worker ${workerData.workerId} handling disconnection for user ${message.userId}`);

      // Notify main thread to update user socket map
      parentPort.postMessage({
        type: 'updateUserSocketMap',
        action: 'remove',
        userId: message.userId
      });
    }
  });
}

export { io, app, server }; // export the instances setup to be used in the main server
