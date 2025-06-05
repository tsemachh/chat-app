// This file exports controller functions that handle user authentication and profile

import { generateToken } from "../lib/helpers.js"; // set it in the cookie
import User from "../models/userModel.js";
import bcrypt from "bcryptjs"; // hashing and verifying passwords
import cloudinary from "../lib/cloudinary.js";
import { hashData, generateSecureToken } from "../lib/encryption.js";

// registers new users and stores them in the database
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Enhanced password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
      });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        avatar: newUser.avatar,
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
export const SignIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ 
        message: "Account temporarily locked due to too many failed SignIn attempts" 
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      // Increment SignIn attempts
      const updates = { $inc: { SignInAttempts: 1 } };
      
      // Lock account after 5 failed attempts for 15 minutes
      if (user.SignInAttempts >= 4) {
        updates.$set = {
          lockUntil: Date.now() + 15 * 60 * 1000, // 15 minutes
          SignInAttempts: 0
        };
      }
      
      await User.findByIdAndUpdate(user._id, updates);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Reset SignIn attempts and update last SignIn on successful SignIn
    await User.findByIdAndUpdate(user._id, {
      $unset: { SignInAttempts: 1, lockUntil: 1 },
      $set: { lastSignIn: new Date() }
    });

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (error) {
    console.log("Error in SignIn controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// logs out the user by clearing the JWT cookie
export const SignOut = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in SignOut controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// updates user's profile picture (with Cloudinary)
export const changeAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user._id;

    if (!avatar) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(avatar);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// returns the authenticated user's data (frontend)
export const userSession = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in userSession controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};