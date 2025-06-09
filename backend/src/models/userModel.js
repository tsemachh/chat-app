// This file defines the user schema and exports the Mongoose mode
    //  for managing users in MongoDB

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8, // security requirement
    },
    profilePic: {
      type: String,
      default: "",
    },
    attempts: {
      type: Number,
      default: 0
    },
    tempLock: {
      type: Date
    },
    lastLogin: {
      type: Date
    },
    securityHash: {
      type: String 
    },
  },
  { timestamps: true } // for createdAt and updatedAt
);

const User = mongoose.model("User", userSchema);

export default User;