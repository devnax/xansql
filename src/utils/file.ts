
/**
 * 
 * @param fileSize in bytes
 * @returns 
 */

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


/**
 * 
 * @param file File object
 * @param chunkSize in bytes
 * @returns number of chunks
 */
export const countFileChunks = (file: File, chunkSize?: number) => Math.ceil(file.size / (chunkSize || getChunkSize(file.size)));

/**
 * Generate file chunks as Uint8Array
 * @param file File object
 * @param chunkSize 
 */
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