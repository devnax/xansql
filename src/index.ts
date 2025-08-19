import Schema from "./Schema";
import { XansqlConfig } from "./type";
import { freezeObject } from "./utils/index";

class xansql {
   private models = new Map<string, Schema>();
   private _config: XansqlConfig;
   private aliases = new Map<string, string>();

   constructor(config: XansqlConfig) {
      this._config = config;
   }

   get config() {
      return typeof this._config === 'function' ? this._config() : this._config;
   }

   get dialect() {
      return this.config.dialect;
   }

   makeAlias(table: string) {
      let wordLength = 1;
      table = table.toLowerCase().replaceAll(/[^a-z0-9_]/g, '_')
      while (true) {
         let alias = table[wordLength]
         if (!this.aliases.has(alias)) {
            this.aliases.set(table, alias);
            return alias;
         }
         wordLength++;

         if (wordLength > table.length) {
            throw new Error(`Cannot generate alias for table ${table}`);
         }
      }
   }

   model(model: Schema) {
      if (!model.IDColumn) {
         throw new Error("Schema must have an ID column");
      }
      if (this.models.has(model.table)) {
         throw new Error("Model already exists for this table");
      }
      model.alias = this.makeAlias(model.table);
      model.xansql = this;
      this.models.set(model.table, model);
      freezeObject(model);
      return model
   }

   async migrate(force?: boolean) {
      const models = this.models
      const tables = Array.from(models.keys())
      for (let table of tables) {
         const model = models.get(table) as Schema
         await model.migrate(force)
      }

   }

   excute(sql: string, model: Schema, requestData?: any): any {
      return null
   }

}

export default xansql