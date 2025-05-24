// This file is used to secure routes that should only be accessed by logged-in users
 
// - auth.middleware.js checks if the request contains a valid JWT token
// - auth.middleware.js verifies the JWT and retrieves the matching user
// - auth.middleware.js rejects the request if the token is invalid

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; // tries to read the JWT from cookies

    if (!token) { // if no token is found this file will deny access
      return res.status(401).json({ message: "Unauthorized - No Token Provided" }); 
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {  // if the token is invalid 
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) { // if thr user is not found
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};