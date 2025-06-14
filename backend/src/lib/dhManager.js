// backend/src/dhManager.js
import crypto from "crypto";

const userKeys = {}; // userId -> { publicKey, privateKey }
const sharedKeys = {}; // senderId -> { receiverId: sharedKey }

export function storePublicKey(userId, publicKeyHex) {
  if (!userKeys[userId]) userKeys[userId] = {};
  userKeys[userId].publicKey = Buffer.from(publicKeyHex, "hex");
}

export function storePrivateKey(userId, privateKey) {
  if (!userKeys[userId]) userKeys[userId] = {};
  userKeys[userId].privateKey = privateKey;
}

export function computeSharedKey(userA, userB) {
  const A = userKeys[userA];
  const B = userKeys[userB];
  if (!A || !B) return null;

  const dh = crypto.createDiffieHellman(A.publicKey.length * 8);
  dh.setPrivateKey(A.privateKey);
  dh.setPublicKey(A.publicKey);

  const sharedKey = dh.computeSecret(B.publicKey);
  if (!sharedKeys[userA]) sharedKeys[userA] = {};
  sharedKeys[userA][userB] = sharedKey;
  return sharedKey;
}

export function getSharedKey(senderId, receiverId) {
  return sharedKeys[senderId]?.[receiverId] ?? null;
}
