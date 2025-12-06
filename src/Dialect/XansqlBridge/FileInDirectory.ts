import { XansqlFileMeta } from '../../core/types';
import fs from 'fs';
import path from 'path';

export type FileInDirectoryOption = {
   dir: string;
   maxFilesize?: number;
   checkFileType?: boolean;
   chunkSize?: number;
}

const FileInDirectory = ({ dir, ...rest }: FileInDirectoryOption) => {
   return {
      ...rest,
      upload: async (chunk: Uint8Array, filemeta: XansqlFileMeta) => {
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
   }
}

export default FileInDirectory;