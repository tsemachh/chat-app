// This file exports controller functions that handle user authentication and profile

import { generateToken } from "../lib/tools.js"; // set it in the cookie
import User from "../models/accountModel.js";
import bcrypt from "bcryptjs"; // hashing and verifying passwords
import cloudinary from "../lib/cloudinary.js";

// registers new users and stores them in the database
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Oops! Don’t forget to complete all the fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Oops! Make sure your password has 8 or more character" });
    }

    // password validation
    const validation = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!validation.test(password)) {
      return res.status(400).json({ 
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
      });
    }

    const user  = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Looks like there's already an account with this email" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = new User({ fullName, email, password: hashed });

    if (newUser) {
      // generate jwt 
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

// logs in and returns a JWT token 
export const signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user  = await User.findOne({ email }); // check if user exist

    if (!user ) {
      return res.status(400).json({ message: "Hmm... that email doesn’t seem to be registered" });
    }

    // Check if account is locked
    if (user.tempLock && user.tempLock > Date.now()) {
      return res.status(423).json({ 
        message: "Oops! You've tried to log in too many times. Please wait a bit and try again" 
      });
    }

    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      // inc signIn attempts
      const updates = { $inc: { attempts: 1 } };
      
      // Lock account for 10 minutes
      if (user.attempts >= 4) {
        updates.$set = {
          tempLock: Date.now() + 10 * 60 * 1000, // 10 minutes
          attempts: 0
        };
      }
      
      await User.findByIdAndUpdate(user._id, updates);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Mongoose method used to find a document by its _id
    await User.findByIdAndUpdate(user._id, {
      $unset: { attempts: 1, tempLock: 1 },
      $set: { lastsignIn: new Date() }
    });

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (error) {
    console.log("Error in signIn controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// logs out the user by clearing the JWT cookie
export const signOut = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "See you next time!" });
  } catch (error) {
    console.log("Error in signOut controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// updates user's profile picture (with Cloudinary)
export const updateProfile = async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user._id;

    if (!avatar) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadRes = await cloudinary.uploader.upload(avatar);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: uploadRes.secure_url },
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