// This file sets up Cloudinary using credentials from .env 

// Cloudinary is used to manage images in the chat (for now only images but I believe I will work on using videos)

import { v2 as cloudinary } from "cloudinary";

import { config } from "dotenv";

config(); // loads the variables from .env

// configure Cloudinary with credentials stored in environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;