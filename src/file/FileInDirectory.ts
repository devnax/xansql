import { XansqlFileMeta } from '../core/type';

export type FileInDirectoryOptions = {
   dir?: string;
};

let fs: typeof import('fs');
let path: typeof import('path');
let open: typeof import('fs/promises').open;

const FileInDirectory = (options: FileInDirectoryOptions) => {
   const uploadsInProgress = new Map<string, { fileHandle: any, receivedChunks: number }>();
   let dir = options.dir || 'uploads';
   return {
      upload: async (chunk: Uint8Array, chunkIndex: number, filemeta: XansqlFileMeta) => {
         fs = fs || await import('fs');
         path = path || await import('path');
         open = open || (await import('fs/promises')).open;

         const uploadDir = path.join(process.cwd(), dir);
         if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

         const filePath = path.join(uploadDir, filemeta.name);

         let upload = uploadsInProgress.get(filemeta.name);
         if (!upload) {
            const fileHandle = await open(filePath, 'w');
            upload = { fileHandle, receivedChunks: 0 };
            uploadsInProgress.set(filemeta.name, upload);
         }

         const offset = chunkIndex * chunk.length;
         await upload.fileHandle.write(chunk, 0, chunk.length, offset);
         upload.receivedChunks++;

         if (filemeta.isFinish && upload.receivedChunks === filemeta.total_chunks) {
            await upload.fileHandle.close();
            uploadsInProgress.delete(filemeta.name);
         }
      },

      delete: async (filename: string) => {
         const fs = await import('fs');
         const path = await import('path');
         const filePath = path.join(process.cwd(), dir, filename);

         if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            uploadsInProgress.delete(filename);
            return true;
         }
         return false;
      }
   };
};


export default FileInDirectory;