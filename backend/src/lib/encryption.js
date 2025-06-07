import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = process.env.ENCRYPTION_SECRET
  ? Buffer.from(process.env.ENCRYPTION_SECRET, "hex")
  : crypto.randomBytes(32);
const IV_LENGTH = 16;

// Encrypt sensitive text data
export const encText = (text) => {
  try {
    if (!text) throw new Error("No data to encrypt");

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    cipher.setAAD(Buffer.from("chat-app"));

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return {
      encrypted: encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

// decrypt sensitive text data
export const decText = (encryptedData) => {
  try {
    if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.tag) {
      throw new Error("Incomplete encrypted data");
    }

    const { encrypted, iv, tag } = encryptedData;

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, "hex"));
    decipher.setAAD(Buffer.from("chat-app"));
    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
};

export const hashData = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

export const secureToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};
