// -----------------------------
// SHA-256 Pure JS
// -----------------------------
const sha256 = (str: string): string => {
   function rightRot(n: number, x: number) {
      return (x >>> n) | (x << (32 - n));
   }

   const msg: number[] = [];

   for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 128) msg.push(c);
      else if (c < 2048) msg.push((c >> 6) | 192, (c & 63) | 128);
      else msg.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
   }

   msg.push(0x80);
   while (msg.length % 64 !== 56) msg.push(0);

   const bitLen = str.length * 8;
   for (let i = 7; i >= 0; i--) msg.push((bitLen >>> (i * 8)) & 255);

   const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
   ];

   let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

   for (let i = 0; i < msg.length; i += 64) {
      const chunk = msg.slice(i, i + 64);
      const w: number[] = new Array(64).fill(0);
      for (let j = 0; j < 16; j++) w[j] = (chunk[j * 4] << 24) | (chunk[j * 4 + 1] << 16) | (chunk[j * 4 + 2] << 8) | chunk[j * 4 + 3];
      for (let j = 16; j < 64; j++) {
         const s0 = rightRot(7, w[j - 15]) ^ rightRot(18, w[j - 15]) ^ (w[j - 15] >>> 3);
         const s1 = rightRot(17, w[j - 2]) ^ rightRot(19, w[j - 2]) ^ (w[j - 2] >>> 10);
         w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      let [a, b, c, d, e, f, g, h] = H;
      for (let j = 0; j < 64; j++) {
         const S1 = rightRot(6, e) ^ rightRot(11, e) ^ rightRot(25, e);
         const ch = (e & f) ^ (~e & g);
         const temp1 = (h + S1 + ch + K[j] + w[j]) | 0;
         const S0 = rightRot(2, a) ^ rightRot(13, a) ^ rightRot(22, a);
         const maj = (a & b) ^ (a & c) ^ (b & c);
         const temp2 = (S0 + maj) | 0;
         h = g; g = f; f = e; e = (d + temp1) | 0; d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }
      H = H.map((v, i) => (v + [a, b, c, d, e, f, g, h][i]) | 0);
   }

   return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

export default sha256;