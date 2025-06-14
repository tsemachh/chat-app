const subtle = window.crypto.subtle;
const DH_PARAMS = {
  name: "ECDH",
  namedCurve: "P-256", 
};

// generate DH Key Pair
export async function generateDHKeyPair() {
  return await subtle.generateKey(
    DH_PARAMS,
    true, // extractable
    ["deriveKey"]
  );
}

// export public key to send over socket
export async function exportPublicKey(publicKey) {
  return await subtle.exportKey("raw", publicKey); // Uint8Array
}

// import peer's raw public key
export async function importPeerPublicKey(publicKeyBytes) {
  return await subtle.importKey(
    "raw",
    publicKeyBytes,
    DH_PARAMS,
    true,
    []
  );
}

// derive AES-GCM key (256-bit) from private + peer public key
export async function deriveSharedKey(privateKey, peerPublicKey) {
  return await subtle.deriveKey(
    {
      name: "ECDH",
      public: peerPublicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false, // not extractable
    ["encrypt", "decrypt"]
  );
}
