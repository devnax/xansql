
export function getChunkSize(fileSize: number): number {
   // fileSize in bytes
   const MB = 1024 * 1024;

   if (fileSize <= 1 * MB) {
      // Very small files (<1MB): single small chunk
      return 64 * 1024; // 64 KB
   } else if (fileSize <= 10 * MB) {
      // Small files (1–10MB): medium chunks
      return 256 * 1024; // 256 KB
   } else if (fileSize <= 100 * MB) {
      // Medium files (10–100MB): faster upload, moderate size
      return 512 * 1024; // 512 KB
   } else if (fileSize <= 500 * MB) {
      // Large files (100–500MB): larger chunks to reduce overhead
      return 1 * MB; // 1 MB
   } else if (fileSize <= 2 * 1024 * MB) {
      // Very large files (500MB–2GB): fewer but larger parts
      return 2 * MB; // 2 MB
   } else {
      // Extremely large files (>2GB)
      return 4 * MB; // 4 MB max chunk size
   }
}

export const totalChunks = (file: File, chunkSize?: number) => Math.ceil(file.size / (chunkSize || getChunkSize(file.size)));

export async function* chunkFile(file: File, chunkSize?: number) {
   const fileSize = file.size;
   chunkSize = chunkSize || getChunkSize(fileSize);
   let offset = 0;

   while (offset < fileSize) {
      const chunk = file.slice(offset, offset + chunkSize);
      const buffer = new Uint8Array(await chunk.arrayBuffer());
      yield { chunk: buffer, chunkIndex: Math.floor(offset / chunkSize) };
      offset += chunkSize;
   }
}

export function generateFileId(str: string) {
   let h1 = 0xdeadbeef ^ str.length
   let h2 = 0x41c6ce57 ^ str.length

   for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
   }

   h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
   h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)

   h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
   h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

   const hex =
      (h1 >>> 0).toString(16).padStart(8, "0") +
      (h2 >>> 0).toString(16).padStart(8, "0") +
      ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0") +
      ((h1 + h2) >>> 0).toString(16).padStart(8, "0")

   return hex.slice(0, 32)
}

export async function getFileId(file: File): Promise<string> {
   let data: any[] = [];
   if (typeof window !== 'undefined') {
      data = [
         navigator.userAgent,
         navigator.language,
         screen.width,
         screen.height,
         screen.colorDepth,
         new Date().getTimezoneOffset(),
         Intl.DateTimeFormat().resolvedOptions().timeZone || ""
      ]
   }

   const meta = `${file.name}||${file.size}||${file.lastModified}||${data.join("||")}`
   const ext = file.name.split('.').pop() || ''
   const id = generateFileId(meta);
   return `${id}.${ext}`;
}