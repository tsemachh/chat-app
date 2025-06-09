// Mongoose schema and model for messages in the db


import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    encData: { // store encrypted message data
      encrypted: String,
      iv: String,
      tag: String
    },
    image: { // store as a URL or base64 string
      type: String, 
    },
  },
  { timestamps: true } // createdAt and updatedAt fields
);

const Message = mongoose.model("Message", messageSchema); 

export default Message;