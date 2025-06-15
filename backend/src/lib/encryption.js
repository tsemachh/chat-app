import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

// Store shared keys for each user pair
const sharedKeys = new Map();

// Generate Diffie-Hellman parameters
export const generateDHKeyPair = () => {
  try {
    // Create DH with prime length of 2048 bits
    const dh = crypto.createDiffieHellman(2048);
    dh.generateKeys();

    return {
      publicKey: dh.getPublicKey('hex'),
      privateKey: dh.getPrivateKey('hex'),
      prime: dh.getPrime('hex'),
      generator: dh.getGenerator('hex')
    };
  } catch (error) {
    console.error("Error generating DH key pair:", error);
    throw new Error("Failed to generate key pair");
  }
};

// Compute shared secret from our private key and their public key
export const computeSharedKey = (myPrivateKey, theirPublicKey, prime, generator) => {
  try {
    const dh = crypto.createDiffieHellman(Buffer.from(prime, 'hex'), Buffer.from(generator, 'hex'));
    dh.setPrivateKey(Buffer.from(myPrivateKey, 'hex'));

    const sharedSecret = dh.computeSecret(Buffer.from(theirPublicKey, 'hex'));
    // Derive a key of appropriate length for AES-256
    return crypto.createHash('sha256').update(sharedSecret).digest();
  } catch (error) {
    console.error("Error computing shared key:", error);
    throw new Error("Failed to compute shared key");
  }
};

// Store the shared key for a user pair
export const storeSharedKey = (userId1, userId2, sharedKey) => {
  // Create a consistent key regardless of order
  const pairKey = [userId1, userId2].sort().join('_');
  sharedKeys.set(pairKey, sharedKey);
};

// Get the shared key for a user pair
export const getSharedKey = (userId1, userId2) => {
  const pairKey = [userId1, userId2].sort().join('_');
  return sharedKeys.get(pairKey);
};

// Check if a shared key exists for a user pair
export const hasSharedKey = (userId1, userId2) => {
  const pairKey = [userId1, userId2].sort().join('_');
  return sharedKeys.has(pairKey);
};

// Remove shared key for a user
export const removeSharedKeysForUser = (userId) => {
  for (const pairKey of sharedKeys.keys()) {
    if (pairKey.includes(userId)) {
      sharedKeys.delete(pairKey);
    }
  }
};

// Encrypt text data with shared key
export const encryptWithSharedKey = (text, userId1, userId2) => {
  try {
    if (!text) throw new Error("No data to encrypt");

    const sharedKey = getSharedKey(userId1, userId2);
    if (!sharedKey) {
      throw new Error("No shared key available");
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, sharedKey, iv);
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

// Decrypt text data with shared key
export const decryptWithSharedKey = (encData, userId1, userId2) => {
  try {
    if (!encData || !encData.encrypted || !encData.iv || !encData.tag) {
      throw new Error("Incomplete encrypted data");
    }

    const sharedKey = getSharedKey(userId1, userId2);
    if (!sharedKey) {
      throw new Error("No shared key available");
    }

    const { encrypted, iv, tag } = encData;

    const decipher = crypto.createDecipheriv(ALGORITHM, sharedKey, Buffer.from(iv, "hex"));
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
