// user schema for Mongoose 

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
    avatar: {
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
    lastsignIn: {
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