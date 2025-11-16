import { XansqlFileConfig, XansqlFileMeta } from '../core/type';

export type FileInDirectoryOptions = {
   dir?: string;
   maxFilesize?: number;
   checkFileType?: boolean;
   chunkSize?: number;
};

let fs: typeof import('fs');
let path: typeof import('path');

const FileInDirectory = (options: FileInDirectoryOptions): XansqlFileConfig => {
   let dir = options.dir || 'uploads';
   return {
      maxFilesize: options.maxFilesize,
      checkFileType: options.checkFileType,
      chunkSize: options.chunkSize,
      upload: async (chunk: Uint8Array, filemeta: XansqlFileMeta) => {
         fs = fs || await import('fs');
         path = path || await import('path');

         const uploadDir = path.join(process.cwd(), dir);
         if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

         const filePath = path.join(uploadDir, filemeta.fileId);

         fs.appendFileSync(filePath, Buffer.from(chunk));

      },
      delete: async (fileId: string) => {
         const fs = await import('fs');
         const path = await import('path');
         const filePath = path.join(process.cwd(), dir, fileId);
         if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
         }
      }
   };
};


export default FileInDirectory;