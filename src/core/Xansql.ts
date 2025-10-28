import { ArgsInfo, ListenerInfo } from "securequ";
import Schema from "../Schema";
import { ExecuterResult, XansqlCacheOptions, XansqlConfigOptionsRequired, XansqlConfigType, XansqlModelOptions } from "./type";
import ExecuteClient from "./classes/ExecuteClient";
import XansqlTransaction from "./classes/XansqlTransaction";
import ExecuteQuery from "./classes/ExecuteQuery";
import XansqlConfig from "./classes/XansqlConfig";
import ExecuteServer from "./classes/ExecuteServer";
import ModelFormatter from "./classes/ModelFormatter";

class Xansql {
   readonly config: XansqlConfigOptionsRequired;
   private _models = new Map<string, Schema>();
   private _aliases = new Map<string, string>();
   private ModelFormatter: ModelFormatter | null = null;
   private ExecuteClient: ExecuteClient;
   private ExecuteServer: ExecuteServer
   private ExecuteQuery: ExecuteQuery;
   private XansqlConfig: XansqlConfig;
   private XansqlTransaction: XansqlTransaction;

   constructor(config: XansqlConfigType) {

      this.XansqlConfig = new XansqlConfig(this);
      this.config = this.XansqlConfig.parse(config)

      this.ExecuteClient = new ExecuteClient(this);
      this.ExecuteServer = new ExecuteServer(this);
      this.XansqlTransaction = new XansqlTransaction(this);
      this.ExecuteQuery = new ExecuteQuery(this);

   }

   private _dialect: any = null;
   get dialect() {
      if (this._dialect) return this._dialect;
      let dialect: any = this.config.dialect;
      if (typeof dialect === 'function') {
         dialect = dialect(this);
      }
      this._dialect = dialect;
      return dialect;
   }

   get models() {
      if (!this.ModelFormatter) {
         this.ModelFormatter = new ModelFormatter(this._models);
      }
      return this.ModelFormatter.models()
   }

   clone(config?: Partial<XansqlConfigType>) {
      const self = new XansqlClone({ ...this.config, ...(config || {}) });
      for (let [table, model] of this._models) {
         self.model(new Schema(table, model.schema));
      }
      return self;
   }

   private _cachePlugins: XansqlCacheOptions[] = [];
   async cachePlugins() {
      if (this._cachePlugins.length) return this._cachePlugins;
      const config = this.config;
      if (config.cachePlugins.length > 0) {
         const self = this.clone({
            cachePlugins: []
         });
         const cachePlugins: XansqlCacheOptions[] = []
         for (let plugin of config.cachePlugins) {
            if (typeof plugin === 'function') {
               cachePlugins.push(await plugin(self));
            }
         }
         this._cachePlugins = cachePlugins;
      }
      return this._cachePlugins;
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
      if (this._models.has(model.table)) {
         throw new Error(`Model already exists for this table ${model.table}`);
      }
      model.alias = this.makeAlias(model.table);
      model.xansql = this;
      model.options = options || {};
      this._models.set(model.table, model);

      // this will delay the model formatting to allow multiple models to be added before formatting
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
         this.migrate()
      }, 1);
      return model
   }

   getModel(table: string): Schema {
      if (!this.models.has(table)) {
         throw new Error(`Model for table ${table} does not exist`);
      }
      return this.models.get(table) as Schema;
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
      const tables = Array.from(this.models.keys())
      for (let table of tables) {
         const model = this.models.get(table) as Schema
         await model.migrate(force)
      }
   }

   async execute(sql: string, model: Schema, args?: ArgsInfo): Promise<ExecuterResult> {
      return await this.ExecuteQuery.execute(sql, model, args);
   }

   async executeClient(sql: string, model: Schema): Promise<any> {
      return await this.ExecuteClient.fetch(sql, model);
   }

   async listen(options: ListenerInfo, args?: ArgsInfo) {
      return await this.ExecuteServer.listen(options, args);
   }

}

class XansqlClone extends Xansql { }


export default Xansql