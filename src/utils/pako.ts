import pako from "pako";
import base64 from "./base64";

/**
 * Compresses a string message using Pako (Gzip).
 * @param message - The plaintext string message to compress.
 * @returns A Base64 encoded string of the compressed data.
 */
export function compress(data: string, returnUnit8?: boolean): string | Uint8Array {
   const encoded = new TextEncoder().encode(data);
   const compressed = pako.gzip(encoded);
   if (returnUnit8) return compressed;
   return base64.encode(compressed);
}

/**
 * Decompresses a Base64 encoded compressed message using Pako (Gzip).
 * @param data - The Base64 encoded compressed data.
 * @returns The decompressed plaintext string.
 */
export function decompress(data: string | Uint8Array): string {
   if (typeof data === 'string') {
      data = base64.decode(data);
   }
   const decompressed = pako.ungzip(data);
   return new TextDecoder().decode(decompressed);
}

export default {
   compress,
   decompress
}