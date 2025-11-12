import Schema from "../Schema";
import { ExecuterResult, XansqlConfigType, XansqlConfigTypeRequired, XansqlFetchConfig, XansqlFileMeta, XansqlModelOptions, XansqlOnFetchInfo } from "./type";
import XansqlTransaction from "./classes/XansqlTransaction";
import XansqlConfig from "./classes/XansqlConfig";
import ModelFormatter from "./classes/ModelFormatter";
import TableMigration from "./classes/TableMigration";
import XansqlFetch from "./classes/XansqlFetch";
import { chunkFile, countFileChunks } from "../utils/file";
import { crypto } from "securequ";
import { hash } from "../utils";
import XqlFile from "../Types/fields/File";

class Xansql {
   readonly config: XansqlConfigTypeRequired;
   readonly ModelFactory = new Map<string, Schema>()
   readonly XANFETCH_CONTENT_TYPE = 'application/octet-stream';
   private _aliases = new Map<string, string>();
   private ModelFormatter: ModelFormatter;
   private XansqlConfig: XansqlConfig;
   readonly XansqlTransaction: XansqlTransaction;
   private XansqlFetch: XansqlFetch

   // SQL Generator Instances can be added here
   readonly TableMigration: TableMigration

   constructor(config: XansqlConfigType) {
      this.XansqlConfig = new XansqlConfig(this, config);
      this.config = this.XansqlConfig.parse()
      this.XansqlTransaction = new XansqlTransaction(this);
      this.ModelFormatter = new ModelFormatter(this);

      this.TableMigration = new TableMigration(this);

      this.XansqlFetch = new XansqlFetch(this);
   }

   get dialect() {
      return this.config.dialect;
   }

   get models() {
      return this.ModelFormatter.format()
   }

   clone(config?: Partial<XansqlConfigType>) {
      const self = new XansqlClone({ ...this.config, ...(config || {}) });
      for (let [table, model] of this.ModelFactory) {
         self.model(new Schema(table, model.schema));
      }
      return self;
   }

   private makeAlias(table: string) {
      let wordLength = 1;
      table = table.toLowerCase().replaceAll(/[^a-z0-9_]/g, '_')
      let alias = table.slice(0, wordLength)
      while (true) {
         if (!this._aliases.has(alias) || wordLength > table.length) break;
         wordLength++;
         alias = table.slice(0, wordLength);
      }
      if (this._aliases.has(alias)) {
         throw new Error(`Alias ${alias} already exists for table ${table}`);
      }
      this._aliases.set(table, alias);
      return alias;
   }

   private _timer: any;
   model<S extends Schema>(model: S, options?: Partial<XansqlModelOptions>): S {
      if (!model.IDColumn) {
         throw new Error("Schema must have an ID column");
      }
      if (this.ModelFactory.has(model.table)) {
         throw new Error(`Model already exists for this table ${model.table}`);
      }
      model.alias = this.makeAlias(model.table);
      model.xansql = this;
      model.options = options || {};
      this.ModelFactory.set(model.table, model);

      // this will delay the model formatting to allow multiple models to be added before formatting
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
         this.migrate()
      }, 5);
      return model
   }

   getModel(table: string): Schema {
      if (!this.ModelFactory.has(table)) {
         throw new Error(`Model for table ${table} does not exist`);
      }
      return this.ModelFactory.get(table) as Schema;
   }

   async execute(sql: string): Promise<ExecuterResult> {

      if (typeof window !== "undefined" && !this.config.fetch) {
         throw new Error("Xansql fetch configuration is required in client side.");
      }

      sql = sql.trim().replaceAll(/\s+/g, ' ');

      if (typeof window !== "undefined") {
         return await this.XansqlFetch.execute(sql);
      } else {
         return await this.dialect.execute(sql) as any
      }
   }

   async uploadFile(file: File) {
      if (!this.config.file || !this.config.file.upload) {
         throw new Error("Xansql file upload configuration is not provided.");
      }

      if (typeof window !== "undefined" && !this.config.fetch) {
         throw new Error("Xansql fetch configuration is required in client side.");
      }

      const total_chunks = countFileChunks(file);
      let ext = file.name.split('.').pop() || '';
      const name = `${hash(32)}${ext ? '.' + ext : ''}`;
      const filemeta: XansqlFileMeta = {
         total_chunks,
         name,
         original_name: file.name,
         size: file.size,
         mime: file.type,
         isFinish: false
      };

      for await (let { chunk, chunkIndex } of chunkFile(file)) {
         const isFinish = chunkIndex + 1 === filemeta.total_chunks;
         filemeta.isFinish = isFinish;
         if (typeof window !== "undefined") {
            await this.XansqlFetch.uploadFile(chunk, chunkIndex, filemeta);
         } else {
            await this.config.file.upload(chunk, chunkIndex, filemeta);
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

   async deleteFile(filename: string) {
      if (!this.config.file || !this.config.file.delete) {
         throw new Error("Xansql file delete configuration is not provided.");
      }
      if (typeof window !== "undefined" && !this.config.fetch) {
         throw new Error("Xansql fetch configuration is required in client side.");
      }
      if (typeof window !== "undefined") {
         return await this.XansqlFetch.deleteFile(filename);
      } else {
         return await this.config.file.delete(filename);
      }
   }


   async transaction(callback: () => Promise<any>) {
      return await this.XansqlTransaction.transaction(callback);
   }

   async migrate(force?: boolean) {
      const { options, tables, indexes } = this.TableMigration.statements();
      if (force) {
         const models = Array.from(this.ModelFactory.values()).reverse();

         for (let model of models) {
            const fileWhere: any[] = [];
            for (let column in model.schema) {
               const field = model.schema[column];
               if (field instanceof XqlFile) {
                  fileWhere.push({ [column]: { isNotNull: true } });
               }
            }

            if (Object.keys(fileWhere).length > 0) {
               try {
                  await model.delete({
                     where: fileWhere,
                     select: { [model.IDColumn]: true }
                  });
               } catch (error) { }
            }
         }

         for (let model of models) {
            const dsql = this.TableMigration.buildDrop(model);
            await this.config.dialect.execute(dsql);
         }
      }

      for (let table of [...options, ...tables]) {
         await this.config.dialect.execute(table);
      }

      for (let index of indexes) {
         try {
            await this.config.dialect.execute(index);
         } catch (error) { }
      }

      return true;
   }

   async onFetch(url: string, info: XansqlOnFetchInfo) {
      if (typeof window !== "undefined") throw new Error("Xansql onFetch method is not available in client side.")
      const hasUrl = typeof this.config.fetch === "string" || typeof this.config.fetch.url === "string"
      if (!this.config.fetch || !hasUrl) throw new Error("Xansql fetch configuration does not have a valid url.")
      return await this.XansqlFetch.onFetch(url, info);
   }

}

class XansqlClone extends Xansql { }


export default Xansql