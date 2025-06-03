// This file provides AES encryption and decryption for messages and sensitive data

import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// AES-256-GCM settings
const algorithm = "aes-256-gcm"; // Authenticated encryption mode
const key = crypto
  .createHash("sha256")
  .update(String(process.env.ENCRYPTION_SECRET))
  .digest(); // Derives a 256-bit key from the secret
const ivLength = 12; // GCM standard IV length is 12 bytes

// Encrypts plain text using AES-256-GCM
export const encryptText = (text) => {
  try {
    const iv = crypto.randomBytes(ivLength); // Generate a secure random IV
    const cipher = crypto.createCipheriv(algorithm, key, iv); // Create cipher instance

    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag(); // GCM requires auth tag for integrity

    // Return iv + authTag + encrypted text as a single base64 string
    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

// Decrypts encrypted text using AES-256-GCM
export const decryptText = (encryptedText) => {
  try {
    const data = Buffer.from(encryptedText, "base64");

    const iv = data.slice(0, ivLength); // Extract IV
    const authTag = data.slice(ivLength, ivLength + 16); // Extract auth tag (16 bytes)
    const encrypted = data.slice(ivLength + 16); // Extract encrypted data

    const decipher = crypto.createDecipheriv(algorithm, key, iv); // Create decipher instance
    decipher.setAuthTag(authTag); // Set auth tag for verification

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
};

// Hashes data (e.g., password) using SHA-256
export const hashData = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

