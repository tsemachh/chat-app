// This file adds a signed JWT token to the provided user ID and persists it as a secure HTTP-only cookie within the response

import jwt from "jsonwebtoken";
import crypto from "crypto";

// Generate a more secure JWT token and save it as an HTTP-only cookie in the response
export const generateToken = (userId, res) => {
  // Add a random token ID to prevent token reuse
  const jti = crypto.randomBytes(16).toString('hex');

  // Add more claims for better security
  const token = jwt.sign(
    { 
      userId,
      jti,
      iat: Math.floor(Date.now() / 1000)
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: "7d",
      algorithm: "HS256" // Explicitly set the algorithm
    }
  );

  // Save the token as a cookie with name "jwt" in the response with enhanced security
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // Prevent XSS attacks (cross-site scripting attacks)
    sameSite: "strict", // Prevent CSRF attacks (cross-site request forgery attacks)
    secure: process.env.NODE_ENV !== "development",
    path: "/", // Restrict cookie to root path
  });

  // Optionally return the token (optional if cookie is being used)
  return token;
};

// Encrypt sensitive data
export const encryptData = (data) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(typeof data === 'object' ? JSON.stringify(data) : data.toString());
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex')
  };
};

// Decrypt sensitive data
export const decryptData = (encryptedData, iv) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));

  let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};
