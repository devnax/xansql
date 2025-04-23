import youid from "youid";

/**
 * Encodes a Uint8Array to Base64 (for browser or Node.js).
 * @param data - The Uint8Array data to encode.
 * @returns The Base64-encoded string.
 */
const id = youid("$")
function encode(data: Uint8Array): string {
   let base64 = "";
   if (typeof window !== "undefined") {
      base64 = btoa(String.fromCharCode(...Array.from(data)));
   } else {
      base64 = Buffer.from(data).toString("base64");
   }
   let paddingCount = (base64.match(/=+$/) || [''])[0].length;
   if (paddingCount > 0) {
      // base64 = base64.replace(/=+$/, () => `${id}${paddingCount}`);
   }
   return base64
}

/**
 * Decodes a Base64 string to a Uint8Array (for browser or Node.js).
 * @param base64String - The Base64 string to decode.
 * @returns The decoded Uint8Array.
 */
function decode(base64: string): Uint8Array {
   try {
      // base64 = base64.replace(/\$(\d)/, (_match, count) => '='.repeat(parseInt(count)));
      if (typeof window !== "undefined") {
         const binaryString = atob(base64);
         const byteArray = new Uint8Array(binaryString.length);
         for (let i = 0; i < binaryString.length; i++) {
            byteArray[i] = binaryString.charCodeAt(i);
         }
         return byteArray;
      } else {
         return Uint8Array.from(Buffer.from(base64, "base64"));
      }
   } catch (error) {
      throw new Error("Invalid Base64 string.");
   }
}

const base64 = {
   encode,
   decode
}

export default base64;