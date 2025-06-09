// Token generator and cookie setter
import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const tokenData = { userId };
  const jwtOpts = { expiresIn: "7d" };
  const cookieOpts = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // Protects against XSS
    sameSite: "strict", // prevent CSRF
    secure: process.env.NODE_ENV !== "development",
  };

  const token = jwt.sign(tokenData, process.env.JWT_SECRET, jwtOpts);

  res.cookie("jwt", token, cookieOpts);

  return token;
};
