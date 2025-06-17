import { Buffer } from "buffer";

export async function aesEncryptWithKey(plaintext, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    enc.encode(plaintext)
  );

  return {
    cipherText: Buffer.from(encryptedContent).toString("hex"),
    iv: Buffer.from(iv).toString("hex"),
  };
}

export async function aesDecryptWithKey(cipherTextHex, ivHex, key) {
  const cipherText = Buffer.from(cipherTextHex, "hex");
  const iv = Buffer.from(ivHex, "hex");

  const decryptedContent = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    cipherText
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedContent);
}
