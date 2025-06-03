// This file exports controller functions that handle user authentication and profile

import { generateToken, encryptData, decryptData } from "../lib/utils.js"; // set it in the cookie
import User from "../models/user.model.js";
import bcrypt from "bcryptjs"; // hashing and verifying passwords
import cloudinary from "../lib/cloudinary.js";
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

// Worker pool for auth operations
const NUM_AUTH_WORKERS = 2;
const authWorkers = [];

// Rate limiting for authentication attempts
const loginAttempts = {};
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Initialize auth worker pool
if (isMainThread) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const workerPath = path.resolve(__filename);

    for (let i = 0; i < NUM_AUTH_WORKERS; i++) {
      const worker = new Worker(workerPath, {
        workerData: { workerId: i, type: 'auth-worker' }
      });
      authWorkers.push(worker);

      console.log(`Auth worker ${i} initialized`);
    }
  } catch (error) {
    console.error("Error initializing auth workers:", error);
  }
}

// Process auth operation in a worker thread
const processAuthInWorker = (data) => {
  return new Promise((resolve, reject) => {
    if (authWorkers.length === 0) {
      // Fallback to direct processing if workers aren't available
      console.log("No auth workers available, processing directly");
      return processAuthDirectly(data).then(resolve).catch(reject);
    }

    // Select a worker from the pool
    const workerIndex = Math.floor(Math.random() * authWorkers.length);
    const worker = authWorkers[workerIndex];

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
      type: 'processAuth',
      requestId,
      data
    });
  });
};

// Fallback direct processing function
const processAuthDirectly = async (data) => {
  if (data.action === 'hashPassword') {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    return { hashedPassword };
  } else if (data.action === 'verifyPassword') {
    const isPasswordCorrect = await bcrypt.compare(data.password, data.hashedPassword);
    return { isPasswordCorrect };
  } else if (data.action === 'uploadProfilePic') {
    const uploadResponse = await cloudinary.uploader.upload(data.profilePic, {
      resource_type: 'image',
      folder: 'chat-app-secure-profiles',
      access_mode: 'authenticated',
      type: 'authenticated'
    });
    return uploadResponse;
  }
  throw new Error("Unknown action");
};

// Check if IP is locked out due to too many failed attempts
const isIpLockedOut = (ip) => {
  if (!loginAttempts[ip]) return false;

  const { count, lastAttempt } = loginAttempts[ip];
  const timeSinceLastAttempt = Date.now() - lastAttempt;

  // If lockout time has passed, reset the counter
  if (count >= MAX_LOGIN_ATTEMPTS && timeSinceLastAttempt > LOCKOUT_TIME) {
    loginAttempts[ip].count = 0;
    return false;
  }

  return count >= MAX_LOGIN_ATTEMPTS;
};

// Record a failed login attempt
const recordFailedAttempt = (ip) => {
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, lastAttempt: Date.now() };
  }

  loginAttempts[ip].count += 1;
  loginAttempts[ip].lastAttempt = Date.now();
};

// Reset login attempts counter on successful login
const resetLoginAttempts = (ip) => {
  if (loginAttempts[ip]) {
    loginAttempts[ip].count = 0;
  }
};

// Validate password strength
const isPasswordStrong = (password) => {
  // At least 8 characters, containing uppercase, lowercase, number, and special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

// registers new users and stores them in the database
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    // Check if IP is locked out
    if (isIpLockedOut(clientIp)) {
      return res.status(429).json({ 
        message: "Too many failed attempts. Please try again later." 
      });
    }

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Enhanced password validation
    if (!isPasswordStrong(password)) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character" 
      });
    }

    // Check if email already exists
    const user = await User.findOne({ email });
    if (user) {
      recordFailedAttempt(clientIp);
      return res.status(400).json({ message: "Email already exists" });
    }

    // Process in worker thread if in main thread
    let hashedPassword;
    if (isMainThread && authWorkers.length > 0) {
      try {
        const result = await processAuthInWorker({
          action: 'hashPassword',
          password
        });
        hashedPassword = result.hashedPassword;
      } catch (error) {
        console.error("Error in worker thread, falling back to direct processing:", error);
        const salt = await bcrypt.genSalt(12);
        hashedPassword = await bcrypt.hash(password, salt);
      }
    } else {
      const salt = await bcrypt.genSalt(12);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create new user with hashed password
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // Generate JWT token
      generateToken(newUser._id, res);
      await newUser.save();

      // Reset login attempts on successful signup
      resetLoginAttempts(clientIp);

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// logs in a user and returns a JWT token (if credentials are ok)
export const login = async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    // Check if IP is locked out
    if (isIpLockedOut(clientIp)) {
      return res.status(429).json({ 
        message: "Too many failed attempts. Please try again later." 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      recordFailedAttempt(clientIp);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password in worker thread if in main thread
    let isPasswordCorrect;
    if (isMainThread && authWorkers.length > 0) {
      try {
        const result = await processAuthInWorker({
          action: 'verifyPassword',
          password,
          hashedPassword: user.password
        });
        isPasswordCorrect = result.isPasswordCorrect;
      } catch (error) {
        console.error("Error in worker thread, falling back to direct processing:", error);
        isPasswordCorrect = await bcrypt.compare(password, user.password);
      }
    } else {
      isPasswordCorrect = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordCorrect) {
      recordFailedAttempt(clientIp);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    generateToken(user._id, res);

    // Reset login attempts on successful login
    resetLoginAttempts(clientIp);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// logs out the user by clearing the JWT cookie
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// updates user's profile picture (with Cloudinary)
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;
    const clientIp = req.ip || req.connection.remoteAddress;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // Validate image before uploading
    if (!profilePic.startsWith('data:image/')) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    // Process in worker thread if in main thread
    let uploadResponse;
    if (isMainThread && authWorkers.length > 0) {
      try {
        uploadResponse = await processAuthInWorker({
          action: 'uploadProfilePic',
          profilePic
        });
      } catch (error) {
        console.error("Error in worker thread, falling back to direct processing:", error);
        // Upload with enhanced security settings
        uploadResponse = await cloudinary.uploader.upload(profilePic, {
          resource_type: 'image',
          folder: 'chat-app-secure-profiles',
          access_mode: 'authenticated',
          type: 'authenticated'
        });
      }
    } else {
      // Upload with enhanced security settings
      uploadResponse = await cloudinary.uploader.upload(profilePic, {
        resource_type: 'image',
        folder: 'chat-app-secure-profiles',
        access_mode: 'authenticated',
        type: 'authenticated'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// returns the authenticated user's data (frontend)
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Handle worker thread messages if this is a worker
if (!isMainThread && workerData?.type === 'auth-worker') {
  console.log(`Auth worker ${workerData.workerId} started`);

  parentPort.on('message', async (message) => {
    if (message.type === 'processAuth') {
      try {
        const { data, requestId } = message;
        let result;

        if (data.action === 'hashPassword') {
          // Hash password
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(data.password, salt);
          result = { hashedPassword };
        } else if (data.action === 'verifyPassword') {
          // Verify password
          const isPasswordCorrect = await bcrypt.compare(data.password, data.hashedPassword);
          result = { isPasswordCorrect };
        } else if (data.action === 'uploadProfilePic') {
          // Upload profile picture
          const uploadResponse = await cloudinary.uploader.upload(data.profilePic, {
            resource_type: 'image',
            folder: 'chat-app-secure-profiles',
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