import Model from "../model";
import { ExecuterResult, XansqlConfigType, XansqlConfigTypeRequired, XansqlModelOptions, XansqlOnFetchInfo } from "./type";
import XansqlTransaction from "./classes/XansqlTransaction";
import XansqlConfig from "./classes/XansqlConfig";
import ModelFormatter from "./classes/ModelFormatter";
import XansqlFetch from "./classes/XansqlFetch";
import ExecuteMeta from "./ExcuteMeta";
import XansqlMigration from "./classes/Migration";
import { XansqlSchemaObject } from "../Types/types";

class Xansql {
   readonly config: XansqlConfigTypeRequired;
   readonly ModelFactory = new Map<string, Model>()
   readonly XANFETCH_CONTENT_TYPE = 'application/octet-stream';
   private _aliases = new Map<string, string>();
   private ModelFormatter: ModelFormatter;
   private XansqlConfig: XansqlConfig;
   readonly XansqlTransaction: XansqlTransaction;
   private XansqlFetch: XansqlFetch

   // SQL Generator Instances can be added here
   readonly XansqlMigration: XansqlMigration

   constructor(config: XansqlConfigType) {
      this.XansqlConfig = new XansqlConfig(this, config);
      this.config = this.XansqlConfig.parse()
      this.XansqlTransaction = new XansqlTransaction(this);
      this.ModelFormatter = new ModelFormatter(this);

      this.XansqlMigration = new XansqlMigration(this);
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
         self.model(table, model.schema, model.options);
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
   model(table: string, schema: XansqlSchemaObject, options?: Partial<XansqlModelOptions>): Model {
      const model = new Model(table, schema);
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

   getModel(table: string): Model {
      if (!this.ModelFactory.has(table)) {
         throw new Error(`Model for table ${table} does not exist`);
      }
      return this.ModelFactory.get(table) as Model;
   }

   async execute(sql: string, executeId?: string): Promise<ExecuterResult> {
      if (typeof window !== "undefined" && !this.config.fetch) {
         throw new Error("Xansql fetch configuration is required in client side.");
      }

      sql = sql.trim().replaceAll(/\s+/g, ' ');

      if (typeof window !== "undefined") {
         if (!executeId || !ExecuteMeta.has(executeId)) {
            throw new Error(`from client side raw query is not supported.`)
         }
         const res = await this.XansqlFetch.execute(sql, executeId);
         ExecuteMeta.delete(executeId);
         return res
      } else {
         return await this.dialect.execute(sql) as any
      }
   }

   async uploadFile(file: File, executeId?: string) {
      return await this.XansqlFetch.uploadFile(file, executeId);
   }

   async deleteFile(filename: string, executeId?: string) {
      return await this.XansqlFetch.deleteFile(filename, executeId);
   }

   async transaction(callback: () => Promise<any>) {
      return await this.XansqlTransaction.transaction(callback);
   }

   async migrate(force?: boolean) {
      return await this.XansqlMigration.migrate(force);
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