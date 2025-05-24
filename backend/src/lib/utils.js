// This file adds a signed JWT token to the provided user ID and persists it as a secure HTTP-only cookie within the response

import jwt from "jsonwebtoken";

// generate a JWT token and save it as an HTTP-only cookie in the response
export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // save the token as a cookie with name "jwt" in the respon
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development",
  });

  // optionally return the token (optional if cookie is being used)
  return token;
};