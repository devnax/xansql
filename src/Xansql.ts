import Schema from "./Schema";
import { XansqlConfig } from "./type";
import XqlJoin from "./Types/fields/Join";
import { freezeObject } from "./utils/index";

class Xansql {
   private _models = new Map<string, Schema>();
   private _config: XansqlConfig;
   private _aliases = new Map<string, string>();
   private _relations: Record<string, { [column: string]: any }> | null = null

   constructor(config: XansqlConfig) {
      this._config = config;
   }

   get config() {
      return typeof this._config === 'function' ? this._config() : this._config;
   }

   get dialect() {
      const dialect = this.config.dialect;
      if (typeof dialect === 'function') {
         return dialect(this);
      }
      return dialect;
   }

   getRelations(tableName?: string): Record<string, { [column: string]: any }> {
      if (!this._relations) {
         this._relations = {};
         for (let [table, schema] of Array.from(this._models.entries())) {
            for (let [column, xanv] of Object.entries(schema.schema)) {
               if (xanv instanceof XqlJoin) {
                  const joinSchema = this.getSchema(xanv.table);
                  const main = {
                     single: true,
                     alias: schema.alias,
                     foreginField: xanv.foreginColumn,
                     main: {
                        alias: schema.alias,
                        table,
                        column,
                        field: column,
                     },
                     foregin: {
                        alias: joinSchema.alias,
                        table: xanv.table,
                        column: joinSchema.IDColumn,
                        field: xanv.foreginColumn,
                     }
                  }

                  const foregin = {
                     single: false,
                     main: {
                        alias: joinSchema.alias,
                        table: xanv.table,
                        column: joinSchema.IDColumn,
                        field: xanv.foreginColumn,
                     },
                     foregin: {
                        alias: schema.alias,
                        table,
                        column,
                        field: column,
                     }
                  }

                  const relation = this._relations[main.main.table] || {};
                  relation[main.main.field] = main;
                  this._relations[main.main.table] = relation

                  const foreginRelation = this._relations[foregin.main.table] || {};
                  foreginRelation[foregin.main.field] = foregin;
                  this._relations[foregin.main.table] = foreginRelation
               }
            }
         }
      }
      return tableName ? this._relations[tableName] : this._relations
   }

   getSchema(table: string): Schema {
      if (!this._models.has(table)) {
         throw new Error(`Model for table ${table} does not exist`);
      }
      return this._models.get(table) as Schema;
   }

   private _makeAlias(table: string) {
      let wordLength = 1;
      table = table.toLowerCase().replaceAll(/[^a-z0-9_]/g, '_')
      while (true) {
         let alias = table[wordLength]
         if (!this._aliases.has(alias)) {
            this._aliases.set(table, alias);
            return alias;
         }
         wordLength++;
         if (wordLength > table.length) {
            throw new Error(`Cannot generate alias for table ${table}`);
         }
      }
   }

   model<S extends Schema>(model: S) {
      if (!model.IDColumn) {
         throw new Error("Schema must have an ID column");
      }
      if (this._models.has(model.table)) {
         throw new Error("Model already exists for this table");
      }
      model.alias = this._makeAlias(model.table);
      model.xansql = this;
      this._models.set(model.table, model);
      // freezeObject(model);
      return model
   }

   async migrate(force?: boolean) {
      const models = this._models
      const tables = Array.from(models.keys())
      for (let table of tables) {
         const model = models.get(table) as Schema
         await model.migrate(force)
      }
   }

   async excute(sql: string, model: Schema, requestData?: any): Promise<any> {
      return null
   }

   async excuteClient(sql: string, model: Schema) {

   }

}

export default Xansql