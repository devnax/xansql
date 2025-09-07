import { xt } from ".";
import Schema from "./Schema";
import { ForeignsInfo, RelationInfo, XansqlConfig } from "./type";
import XqlArray from "./Types/fields/Array";
import XqlHasMany from "./Types/fields/HasMany";
import XqlHasOne from "./Types/fields/HasOne";
import XqlJoin from "./Types/fields/Join";
import XqlSchema from "./Types/fields/Schema";
import { freezeObject } from "./utils/index";

class Xansql {
   private _models = new Map<string, Schema>();
   private _config: XansqlConfig;
   private _aliases = new Map<string, string>();
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

   private _modelFormated = false;
   get models() {
      if (this._modelFormated) return this._models;

      for (let [table, model] of Array.from(this._models.entries())) {
         const schema = model.schema;
         for (let column in schema) {
            const val = schema[column]

            if (val instanceof XqlSchema) {
               const FModel = this._models.get(val.table);

               if (!FModel) {
                  throw new Error(`Foreign model ${val.table} not found for ${model.table}.${column}`);
               }

               // check if the foreign column exists in the foreign model
               const exists = val.column in FModel.schema
               if (exists) {
                  // check the foreign column is an array of schemas
                  const foreignCol = FModel.schema[val.column];
                  if (foreignCol instanceof XqlArray && (foreignCol as any).type instanceof XqlSchema) {
                     const foreignType = (foreignCol as any).type as XqlSchema;
                     if (foreignType.table !== model.table || foreignType.column !== column) {
                        throw new Error(`Foreign column ${val.table}.${val.column} does not reference back to ${model.table}.${column}`);
                     }
                  } else {
                     throw new Error(`Foreign column ${val.table}.${val.column} is not an array of schemas`);
                  }
               } else {
                  // add the foreign column as an array of schemas
                  FModel.schema[val.column] = xt.array(xt.schema(model.table, column).optional());
               }
            } else if (val instanceof XqlArray && (val as any).type instanceof XqlSchema) {
               const foreignType = (val as any).type as XqlSchema;
               const FModel = this._models.get(foreignType.table);
               if (!FModel) {
                  throw new Error(`Foreign model ${foreignType.table} not found for ${model.table}.${column}`);
               }

               // check if the foreign column exists in the foreign model
               const exists = foreignType.column in FModel.schema
               if (exists) {
                  const foreignCol = FModel.schema[foreignType.column];
                  if (foreignCol instanceof XqlSchema && foreignCol.table === model.table && foreignCol.column === column) {
                     // all good
                  } else {
                     throw new Error(`Foreign column ${foreignType.table}.${foreignType.column} does not reference back to ${model.table}.${column}`);
                  }
               } else {
                  // add the foreign column as an array of schemas
                  FModel.schema[foreignType.column] = xt.schema(model.table, column).optional();
               }
            }
         }
      }
      this._modelFormated = true;
      // log all are ok
      for (let [table, model] of Array.from(this._models.entries())) {
         console.log(model.schema);

      }
      return this._models;
   }

   get foreigns(): ForeignsInfo {
      if (!this._foreigns) {
         this._foreigns = {};
         for (let [table, model] of Array.from(this._models.entries())) {
            for (let [column, join] of Object.entries(model.schema)) {

               if (join instanceof XqlHasOne || join instanceof XqlHasMany) {
                  const hasMany = join instanceof XqlHasMany;
                  const FModel = this.getSchema(join.table);
                  const main = this._foreigns[model.table] || {};
                  const foreign = this._foreigns[FModel.table] || {};

                  if (join.column in foreign) {
                     throw new Error(`Foreign key already exists for ${FModel.table}.${join.column}`);
                  }

                  main[column] = {
                     type: hasMany ? "hasOne" : "hasMany",
                     table: FModel.table,
                     column: join.column,
                     relation: {
                        main: FModel.IDColumn,
                        target: column,
                     }
                  };

                  foreign[join.column] = {
                     type: hasMany ? "hasOne" : "hasMany",
                     table,
                     column,
                     relation: {
                        main: column,
                        target: FModel.IDColumn,
                     },
                  };

                  this._foreigns[model.table] = main
                  this._foreigns[FModel.table] = foreign
               }
            }
         }
      }
      return this._foreigns
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