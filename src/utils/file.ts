
let counter = 0;
export function makeFileUID(file: File): string {
   counter = (counter + 1) % 1000;
   const ext = file.name.split('.').pop();
   const uid = Math.random().toString(36).slice(2, 10)
      + Date.now().toString(36)
      + counter.toString(36).padStart(3, '0')
      + Math.random().toString(36).slice(2, 10);

   return `${uid}${ext ? `.${ext}` : ''}`;
}


/**
 * 
 * @param fileSize in bytes
 * @returns 
 */

function getChunkSize(fileSize: number): number {
   // fileSize in bytes
   if (fileSize <= 5 * 1024 * 1024) {
      // <= 5MB → 128KB
      return 128 * 1024;
   } else if (fileSize <= 50 * 1024 * 1024) {
      // 5–50MB → 256KB
      return 256 * 1024;
   } else if (fileSize <= 200 * 1024 * 1024) {
      // 50–200MB → 512KB
      return 512 * 1024;
   } else {
      // > 200MB → 1MB (max)
      return 1024 * 1024;
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