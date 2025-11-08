import Schema from "../Schema";
import { ExecuterResult, XansqlConfigType, XansqlConfigTypeRequired, XansqlFetchDefault, XansqlModelOptions, XansqlOnFetchInfo } from "./type";
import XansqlTransaction from "./classes/XansqlTransaction";
import XansqlConfig from "./classes/XansqlConfig";
import ModelFormatter from "./classes/ModelFormatter";
import Migration from "./classes/Migration";
import XansqlFetch from "./classes/XansqlFetch";

class Xansql {
   readonly config: XansqlConfigTypeRequired;
   readonly ModelFactory = new Map<string, Schema>()
   readonly XANFETCH_CONTENT_TYPE = 'application/octet-stream';
   private _aliases = new Map<string, string>();
   private ModelFormatter: ModelFormatter;
   private XansqlConfig: XansqlConfig;
   private XansqlTransaction: XansqlTransaction;
   private XansqlFetch: XansqlFetch

   // SQL Generator Instances can be added here
   readonly Migration: Migration

   constructor(config: XansqlConfigType) {
      this.XansqlConfig = new XansqlConfig(this, config);
      this.config = this.XansqlConfig.parse()
      this.XansqlTransaction = new XansqlTransaction(this);
      this.ModelFormatter = new ModelFormatter(this);

      this.Migration = new Migration(this);

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
      }, 1);
      return model
   }

   getModel(table: string): Schema {
      if (!this.ModelFactory.has(table)) {
         throw new Error(`Model for table ${table} does not exist`);
      }
      return this.ModelFactory.get(table) as Schema;
   }

   async execute(sql: string): Promise<ExecuterResult> {
      sql = sql.trim().replaceAll(/\s+/g, ' ');
      if (typeof window !== "undefined") {
         if (!this.config.fetch) throw new Error("Xansql fetch configuration is not set.")
         if (typeof this.config.fetch === "string" || typeof (this.config.fetch as XansqlFetchDefault).url === "string") {
            return await this.XansqlFetch.execute(sql);
         }
         return await (this.config.fetch as any).execute(this, sql);
      }
      return await this.dialect.execute(sql) as any
   }

   async beginTransaction() {
      return await this.XansqlTransaction.begin();
   }

   async commitTransaction() {
      return await this.XansqlTransaction.commit();
   }

   async rollbackTransaction() {
      return await this.XansqlTransaction.rollback();
   }

   async transaction(callback: () => Promise<any>) {
      return await this.XansqlTransaction.transaction(callback);
   }

   async migrate(force?: boolean) {
      const { options, tables, indexes } = this.Migration.statements();
      if (force) {
         const models = Array.from(this.ModelFactory.values()).reverse();
         for (let model of models) {
            const dsql = this.Migration.buildDrop(model);
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
   }

   async onFetch(url: string, info: XansqlOnFetchInfo) {
      if (typeof window !== "undefined") {
         throw new Error("Xansql onFetch method is not available in client side.");
      }
      if (!this.config.fetch) throw new Error("Xansql fetch configuration is not set.")
      if (typeof this.config.fetch === "string" || typeof (this.config.fetch as XansqlFetchDefault).url === "string") {
         return await this.XansqlFetch.onFetch(url, info);
      }
      return await (this.config.fetch as any).onFetch(this, url, info);
   }

}

class XansqlClone extends Xansql { }


export default Xansql