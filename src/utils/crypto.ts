import nacl from "tweetnacl";
import base64 from "./base64";
import pako from "./pako";

/**
 * Encrypts data using TweetNaCl, compresses it with Pako (Gzip), and encodes it in Base64.
 * @param data - The plaintext data to encrypt.
 * @param secret - The secret key as a string.
 * @returns A Base64 encoded string (nonce + compressed ciphertext).
 */
function encrypt(data: string | object, secret: string): string {
   data = typeof data === "object" ? JSON.stringify(data) : data
   secret = hash(secret).substring(0, 32)
   const key = new TextEncoder().encode(secret);
   const nonce: any = nacl.randomBytes(nacl.secretbox.nonceLength);
   const compressed = pako.compress(data, true) as Uint8Array // Ensure it returns Uint8Array
   const encrypted: any = nacl.secretbox(compressed, nonce, key);
   return base64.encode(new Uint8Array([...nonce, ...encrypted]));
}

/**
 * Decrypts a Base64-encoded NaCl-encrypted data, decompresses it with Pako (Gzip).
 * @param data - The Base64 encoded string (nonce + compressed ciphertext).
 * @param secret - The secret key as a string.
 * @returns The decrypted plaintext string.
 */
function decrypt(data: string, secret: string): string {
   try {
      secret = hash(secret).substring(0, 32)
      const key = new TextEncoder().encode(secret);
      const encryptedBytes = base64.decode(data);
      const nonce = encryptedBytes.slice(0, nacl.secretbox.nonceLength);
      const ciphertext = encryptedBytes.slice(nacl.secretbox.nonceLength);
      const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
      if (!decrypted) throw new Error("Decryption failed!");
      const decompressed = pako.decompress(decrypted); // Decompress as string
      try {
         return JSON.parse(decompressed);
      } catch (error) {
         return decompressed;
      }
   } catch (error) {
      throw new Error("Invalid encrypted data.");
   }
}

/**
 * Hashes a string using NaCl's hash function.
 * @param data - The input string to hash.
 * @returns The hash of the input string.
 */
let hashed = new Map<string, string>();
function hash(data: string): string {
   if (hashed.has(data)) return hashed.get(data) as string
   const inputBytes = new TextEncoder().encode(data);
   const hashedData = nacl.hash(inputBytes);
   const d = Array.from(hashedData)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
   hashed.set(data, d)
   return d
}

const makeSecret = (secret: string) => {
   return hash(secret).substring(0, 32);
}

const crypto = {
   encrypt,
   decrypt,
   hash,
   makeSecret
};

export default crypto;