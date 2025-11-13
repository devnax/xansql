import { hash } from "../../utils";
import { chunkFile, countFileChunks, getChunkSize } from "../../utils/file";
import ExecuteMeta from "../ExcuteMeta";
import { XansqlFileMeta } from "../type";
import Xansql from "../Xansql";
import XansqlFetch from "./XansqlFetch";

class FileHandler {
   xansql: Xansql;
   fetch: XansqlFetch

   constructor(xansql: Xansql, fetch: XansqlFetch) {
      this.xansql = xansql;
      this.fetch = fetch;
   }

   async uploadFile(file: File, executeId?: string) {
      const xansql = this.xansql;
      if (!xansql.config.file || !xansql.config.file.upload) {
         throw new Error("Xansql file upload configuration is not provided.");
      }

      if (typeof window !== "undefined" && !xansql.config.fetch) {
         throw new Error("Xansql fetch configuration is required in client side.");
      }

      const total_chunks = countFileChunks(file);
      let ext = file.name.split('.').pop() || '';
      const name = `${hash(32)}${ext ? '.' + ext : ''}`;
      const filemeta: XansqlFileMeta = {
         name,
         original_name: file.name,
         size: file.size,
         mime: file.type,
         isFinish: false,
         total_chunks,
         chunkSize: getChunkSize(file.size),
         chunkIndex: 0,
      };

      for await (let { chunk, chunkIndex } of chunkFile(file)) {
         const isFinish = chunkIndex + 1 === filemeta.total_chunks;
         filemeta.isFinish = isFinish;
         filemeta.chunkIndex = chunkIndex;
         if (typeof window !== "undefined") {
            try {
               await this.fetch.uploadFile(chunk, filemeta, executeId);
               ExecuteMeta.delete(executeId!);
            } catch (error) {
               await this.fetch.deleteFile(name, executeId);
               ExecuteMeta.delete(executeId!);
               throw error;
            }
         } else {
            try {
               await xansql.config.file.upload(chunk, filemeta);
            } catch (error) {
               await xansql.config.file.delete(name);
               throw error;
            }
         }
      }

      return {
         name,
         total_chunks,
         original_name: file.name,
         size: file.size,
         mime: file.type,
      }
   }

   async deleteFile(filename: string, executeId?: string) {
      const xansql = this.xansql;
      if (!xansql.config.file || !xansql.config.file.delete) {
         throw new Error("Xansql file delete configuration is not provided.");
      }
      if (typeof window !== "undefined" && !xansql.config.fetch) {
         throw new Error("Xansql fetch configuration is required in client side.");
      }
      if (typeof window !== "undefined") {
         const res = await this.fetch.deleteFile(filename, executeId);
         ExecuteMeta.delete(executeId!);
         return res;
      } else {
         return await xansql.config.file.delete(filename);
      }
   }

}

export default FileHandler;