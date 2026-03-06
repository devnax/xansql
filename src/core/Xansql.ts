import Model from "../model";
import { ExecuterResult, XansqlConfigType, XansqlConfigTypeRequired, XansqlFileMeta, XansqlFileUploadArgs } from "./types";
import XansqlTransaction from "./classes/XansqlTransaction";
import XansqlConfig from "./classes/XansqlConfig";
import XansqlError from "./XansqlError";
import { ModelClass } from "../model/types";
import { chunkFile, getFileId, totalChunks } from "../utils/file";
import Migration from "./Migration";
import fileScaner from "../utils/fileScaner";

class Xansql {
   private XansqlConfig: XansqlConfig;
   readonly config: XansqlConfigTypeRequired;
   readonly XansqlTransaction: XansqlTransaction;
   readonly models = new Map<ModelClass<any>, Model>()
   readonly Migration: Migration

   constructor(config: XansqlConfigType) {
      this.XansqlConfig = new XansqlConfig(this, config);
      this.config = this.XansqlConfig.parse()
      this.XansqlTransaction = new XansqlTransaction(this);
      this.Migration = new Migration(this)
   }

   get dialect() {
      return this.config.dialect;
   }

   model<M extends Model<any>>(model: ModelClass<M>, hooks?: any) {
      if (this.models.has(model)) {
         return this.models.get(model) as Model<ReturnType<M['schema']>>
      }
      const _model = new model(this)
      this.models.set(model, _model)
      return _model as Model<ReturnType<M['schema']>>
   }

   async execute(sql: string, debug = this.config.debug): Promise<ExecuterResult> {
      const query = sql.trim().replace(/\s+/g, ' ');
      const isDebug = debug ?? false

      if (isDebug) {
         console.log(`[DB] Executing → ${query}`);
      }

      try {
         const execute = await this.dialect.execute(query, this) as ExecuterResult;
         if (isDebug) {
            console.log(`[DB] Executed ✓`);
            console.dir(execute.results, { depth: null });
         }
         return execute;
      } catch (error) {
         if (isDebug) {
            console.error(`[DB] Execution failed ✗`);
            console.error(query);
         }
         throw error
      }
   }

   async uploadFile(file: XansqlFileUploadArgs) {
      const fileConfig = this.config.file
      if (!fileConfig?.upload) {
         throw new XansqlError({
            code: "NOT_FOUND",
            message: `File upload is not supported by the current dialect.`
         });
      }
      if (file instanceof File) {
         // make chunk
         const fileId = await getFileId(file);

         const maxFileSize = fileConfig?.maxFilesize
         if (maxFileSize && file.size > maxFileSize * 1024) {
            throw new Error(`File size exceeds the limit of ${maxFileSize / 1024} MB`)
         }

         const chunkSize = fileConfig?.chunkSize

         // send metadata
         const filemeta: XansqlFileMeta = {
            fileId: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            totalChunks: totalChunks(file, chunkSize),
            chunkIndex: 0,
            isFinish: false
         }
         for await (let { chunk, chunkIndex } of chunkFile(file, chunkSize)) {
            filemeta.chunkIndex = chunkIndex;
            filemeta.isFinish = chunkIndex + 1 === filemeta.totalChunks;
            filemeta.chunkIndex = chunkIndex
            await this.uploadFile({
               chunk,
               meta: filemeta
            })
         }
         return filemeta
      }

      if (file.meta.chunkIndex === 0 && !fileScaner(file.chunk).valid) {
         throw new XansqlError({
            code: "FILE_ERROR",
            message: `Failed to process file "${file.meta.name}".`
         });
      }
      return await this.config.file.upload(file.chunk, file.meta, this);
   }

   async deleteFile(fileId: string) {
      if (!this.config.file?.delete) {
         throw new XansqlError({
            code: "INTERNAL_ERROR",
            message: `File delete is not supported by the current dialect.`
         });
      }
      return await this.config.file.delete(fileId, this);
   }

   async migrate(force?: boolean) {
      const models = Array.from(this.models.values())
      for (let model of models) {
         await this.Migration.migrate(model, force)
      }
   }
}

export default Xansql