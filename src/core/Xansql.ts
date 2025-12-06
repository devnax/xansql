import Model from "../model";
import { ExecuterResult, XansqlConfigType, XansqlConfigTypeRequired } from "./types";
import XansqlTransaction from "./classes/XansqlTransaction";
import XansqlConfig from "./classes/XansqlConfig";
import ModelFormatter from "./classes/ModelFormatter";
import XansqlMigration from "./classes/Migration";
import EventManager, { EventHandler, EventPayloads } from "./classes/EventManager";
import XansqlError from "./XansqlError";
import Schema from "../model/Schema";
import { XansqlModelHooks } from "../model/types";

class Xansql {
   readonly config: XansqlConfigTypeRequired;
   readonly ModelFactory = new Map<string, Model>()
   readonly XANFETCH_CONTENT_TYPE = 'application/octet-stream';
   private _aliases = new Map<string, string>();
   private ModelFormatter: ModelFormatter;
   private XansqlConfig: XansqlConfig;
   readonly XansqlTransaction: XansqlTransaction;
   readonly EventManager: EventManager

   // SQL Generator Instances can be added here
   readonly XansqlMigration: XansqlMigration

   constructor(config: XansqlConfigType) {
      this.XansqlConfig = new XansqlConfig(this, config);
      this.config = this.XansqlConfig.parse()
      this.XansqlTransaction = new XansqlTransaction(this);
      this.ModelFormatter = new ModelFormatter(this);

      this.XansqlMigration = new XansqlMigration(this);
      this.EventManager = new EventManager();
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
         const schema = new Schema(table, model.schema)
         for (let hook in model.hooks) {
            schema.addHook(hook as any, model.hooks[hook as keyof XansqlModelHooks] as any)
         }
         self.model(schema);
      }
      return self;
   }

   private makeAlias(table: string) {
      let wordLength = 1;
      table = table.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      let alias = table.slice(0, wordLength)
      while (true) {
         if (!this._aliases.has(alias) || wordLength > table.length) break;
         wordLength++;
         alias = table.slice(0, wordLength);
      }
      if (this._aliases.has(alias)) {
         throw new XansqlError({
            message: `Cannot create alias for table ${table}, please rename the table to avoid conflicts.`,
            model: table,
         });
      }
      this._aliases.set(table, alias);
      return alias;
   }

   _timer: any = null;
   model(schema: Schema): Model {
      const model = new Model(schema.table, schema.schema);
      if (!model.IDColumn) {
         throw new XansqlError({
            message: `Model ${schema.table} must have an ID column.`,
            model: schema.table,
         });
      }
      if (this.ModelFactory.has(schema.table)) {
         throw new XansqlError({
            message: `Model for table ${schema.table} already exists.`,
            model: schema.table,
         });
      }
      model.alias = this.makeAlias(schema.table);
      model.xansql = this;
      model.hooks = schema.hooks;
      this.ModelFactory.set(schema.table, model);

      // this will delay the model formatting to allow multiple models to be added before formatting
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
         this.ModelFormatter.format()
      }, 5);
      return model
   }

   getModel(table: string): Model {
      if (!this.models.has(table)) {
         throw new XansqlError({
            message: `Model for table ${table} does not exist.`,
            model: table,
         });
      }
      return this.models.get(table) as Model;
   }

   async execute(sql: string): Promise<ExecuterResult> {
      sql = sql.trim().replace(/\s+/g, ' ');
      return await this.dialect.execute(sql, this) as any
   }

   async getRawSchema() {
      return await this.dialect.getSchema(this);
   }

   async uploadFile(file: File) {
      if (!this.dialect.file?.upload) {
         throw new XansqlError(`File upload is not supported by the current dialect.`);
      }
      return await this.dialect.file.upload(file, this);
   }

   async deleteFile(filename: string) {
      if (!this.dialect.file?.delete) {
         throw new XansqlError(`File delete is not supported by the current dialect.`);
      }
      return await this.dialect.file.delete(filename, this);
   }

   async transaction(callback: () => Promise<any>) {
      return await this.XansqlTransaction.transaction(callback);
   }

   async migrate(force?: boolean) {
      return await this.XansqlMigration.migrate(force);
   }

   async generateMigration() {
      return await this.XansqlMigration.generate();
   }

   on<K extends keyof EventPayloads>(event: K, handler: EventHandler<K>) {
      this.EventManager.on(event, handler);
   }

}

class XansqlClone extends Xansql { }


export default Xansql