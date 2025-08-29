import Schema from "./Schema";
import { ForeignsInfo, RelationInfo, XansqlConfig } from "./type";
import XqlJoin from "./Types/fields/Join";
import { freezeObject } from "./utils/index";

class Xansql {
   private _models = new Map<string, Schema>();
   private _config: XansqlConfig;
   private _aliases = new Map<string, string>();
   private _relations: Record<string, { [column: string]: any }> | null = null
   private _foreigns: ForeignsInfo | null = null

   constructor(config: XansqlConfig) {
      this._config = config;
   }

   get config() {
      return typeof this._config === 'function' ? this._config() : this._config;
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

   get foreigns(): ForeignsInfo {
      if (!this._foreigns) {
         this._foreigns = {};
         for (let [table, schema] of Array.from(this._models.entries())) {
            for (let [column, instance] of Object.entries(schema.schema)) {
               if (instance instanceof XqlJoin) {
                  const joinSchema = this.getSchema(instance.table);

                  const main = this._foreigns[schema.table] || {};
                  main[column] = {
                     table: joinSchema.table,
                     column: instance.foreginColumn,
                     relation: {
                        main: joinSchema.IDColumn,
                        target: column,
                     }
                  };
                  this._foreigns[schema.table] = main

                  const foreign = this._foreigns[joinSchema.table] || {};
                  foreign[instance.foreginColumn] = {
                     table,
                     column,
                     relation: {
                        main: column,
                        target: joinSchema.IDColumn,
                     },
                  };
                  this._foreigns[joinSchema.table] = foreign
               }
            }
         }
      }
      return this._foreigns
   }

   getRelations(tableName?: string): Record<string, { [column: string]: any }> {
      if (!this._relations) {
         this._relations = {};
         for (let [table, schema] of Array.from(this._models.entries())) {
            for (let [column, instance] of Object.entries(schema.schema)) {
               if (instance instanceof XqlJoin) {
                  const joinSchema = this.getSchema(instance.table);

                  const relation = this._relations[schema.table] || {};
                  relation[column] = {
                     single: true,
                     main: {
                        table,
                        column,
                     },
                     foregin: {
                        table: joinSchema.table,
                        column: instance.foreginColumn,
                     }
                  };
                  this._relations[schema.table] = relation

                  const foreginRelation = this._relations[joinSchema.table] || {};
                  foreginRelation[instance.foreginColumn] = {
                     single: false,
                     main: {
                        table: joinSchema.table,
                        column: instance.foreginColumn,
                     },
                     foregin: {
                        table,
                        column,
                     }
                  };
                  this._relations[joinSchema.table] = foreginRelation
               }
            }
         }
      }
      return tableName ? this._relations[tableName] : this._relations
   }

   getRelation(table: string, column: string) {
      const relations = this.getRelations(table);
      return relations[column] as RelationInfo
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

   async excute(sql: string, schema: Schema, requestData?: any): Promise<any> {
      if (typeof window === "undefined") {
         return await this.dialect.excute(sql, schema);
      } else {
         return await this.excuteClient(sql, schema);
      }
   }

   async excuteClient(sql: string, model: Schema) {

   }

}

export default Xansql