// This file defines the Mongoose schema and model for messages in the db

// Mongoose schema defines the structure of documents within a MongoDB

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      // Text can be null if we're using encrypted text instead
    },
    encryptedText: {
      type: String,
      // Store the encrypted version of the message
    },
    image: { // store as a URL or base64 string
      type: String, 
    },
    // Add metadata for security tracking
    securityMetadata: {
      encryptionVersion: {
        type: Number,
        default: 1
      },
      encryptionMethod: {
        type: String,
        default: 'aes-256-cbc'
      }
    }
  },
  { timestamps: true } // allows automatic createdAt and updatedAt fields
);

// Add index for faster querying
messageSchema.index({ senderId: 1, receiverId: 1 });

const Message = mongoose.model("Message", messageSchema); // export the created model

export default Message;
