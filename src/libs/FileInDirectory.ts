import { XansqlFileMeta } from '../core/type';

export type FileInDirectoryOptions = {
   dir?: string;
};

let fs: typeof import('fs');
let path: typeof import('path');

const FileInDirectory = (options: FileInDirectoryOptions) => {
   let dir = options.dir || 'uploads';
   return {
      upload: async (chunk: Uint8Array, filemeta: XansqlFileMeta) => {
         fs = fs || await import('fs');
         path = path || await import('path');

         const uploadDir = path.join(process.cwd(), dir);
         if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

         const filePath = path.join(uploadDir, filemeta.name);

         fs.appendFileSync(filePath, Buffer.from(chunk));

      },

      delete: async (filename: string) => {
         const fs = await import('fs');
         const path = await import('path');
         const filePath = path.join(process.cwd(), dir, filename);

         if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
         }
         return false;
      }
   };
};


export default FileInDirectory;