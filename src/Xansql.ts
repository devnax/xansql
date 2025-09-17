import { xt } from ".";
import restrictedColumn from "./RestrictedColumn";
import Schema from "./Schema";
import { XansqlConfig, XansqlConfigOptionsFormated } from "./type";
import XqlArray from "./Types/fields/Array";
import XqlSchema from "./Types/fields/Schema";
import { XqlFields } from "./Types/types";

class Xansql {
   private _models = new Map<string, Schema>();
   private _config: XansqlConfig;
   private _aliases = new Map<string, string>();

   constructor(config: XansqlConfig) {
      this._config = config;
   }

   get config() {
      const isFn = typeof this._config === 'function';
      let config = this._config as XansqlConfigOptionsFormated;
      if (isFn) {
         config = (this._config as Function)();
      }
      if (!config.connection) {
         throw new Error("Connection is required in Xansql config");
      }
      if (!config.dialect) {
         throw new Error("Dialect is required in Xansql config");
      }
      config.cachePlugins = config.cachePlugins || [];
      config.maxLimit = config.maxLimit || {};
      if (!config.maxLimit.find) config.maxLimit.find = 100;
      if (!config.maxLimit.create) config.maxLimit.create = 100;
      if (!config.maxLimit.update) config.maxLimit.update = 100;
      if (!config.maxLimit.delete) config.maxLimit.delete = 100;

      return config;
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
   model<S extends Schema>(model: S) {
      if (!model.IDColumn) {
         throw new Error("Schema must have an ID column");
      }
      if (this._models.has(model.table)) {
         throw new Error("Model already exists for this table");
      }
      model.alias = this.makeAlias(model.table);
      model.xansql = this;
      this._models.set(model.table, model);

      // this will delay the model formatting to allow multiple models to be added before formatting
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
         this.migrate()
      }, 1);
      return model
   }

   private _modelFormated = false;
   get models() {
      if (this._modelFormated) return this._models;
      let models = this._models;

      for (let [table, model] of Array.from(this._models.entries())) {
         const schema = model.schema;
         for (let column in schema) {

            // is column is restricted 
            if (restrictedColumn(column)) {
               throw new Error(`Column name "${column}" is restricted and cannot be used in schema "${table}". Please use a different column name.`);
            }


            const val = schema[column]
            if (this.isForeignSchema(val)) {
               const FModel = models.get(val.table);
               if (!FModel) {
                  throw new Error(`Foreign model ${val.table} not found for ${model.table}.${column}`);
               }

               if (val.column in FModel.schema) {
                  const foreignCol = FModel.schema[val.column];
                  if (this.isForeignArray(foreignCol)) {
                     const foreignType = (foreignCol as any).type as XqlSchema;
                     if (foreignType.table !== model.table || foreignType.column !== column) {
                        throw new Error(`Foreign column ${val.table}.${val.column} does not reference back to ${model.table}.${column}`);
                     }
                  } else {
                     throw new Error(`Foreign column ${val.table}.${val.column} is not an array of schemas`);
                  }
               } else {
                  const n = xt.schema(model.table, column).nullable()
                  n.dynamic = true
                  FModel.schema[val.column] = xt.array(n)
                  models.set(FModel.table, FModel);
               }
            } else if (this.isForeignArray(val)) {
               const foreignType = (val as any).type as XqlSchema;
               const FModel = models.get(foreignType.table);
               if (!FModel) {
                  throw new Error(`Foreign model ${foreignType.table} not found for ${model.table}.${column}`);
               }

               if (foreignType.column in FModel.schema) {
                  const foreignCol = FModel.schema[foreignType.column] as XqlSchema;
                  if (!this.isForeignSchema(foreignCol) || foreignCol.table !== model.table || foreignCol.column !== column) {
                     throw new Error(`Foreign column ${foreignType.table}.${foreignType.column} does not reference back to ${model.table}.${column}`);
                  }
               } else {
                  const n = xt.schema(model.table, column).nullable();
                  n.dynamic = true
                  FModel.schema[foreignType.column] = n
                  models.set(FModel.table, FModel);
               }
            }
         }
      }

      this._modelFormated = true;
      return models;
   }

   isForeign(field: XqlFields) {
      return this.isForeignArray(field) || this.isForeignSchema(field)
   }

   isForeignArray(field: XqlFields) {
      return field instanceof XqlArray && this.isForeignSchema((field as any).type)
   }

   isForeignSchema(field: XqlFields) {
      return field instanceof XqlSchema
   }

   foreignInfo(table: string, column: string) {
      let model = this.getModel(table)
      let schema = model.schema
      let field = schema[column]
      if (!this.isForeign(field)) {
         throw new Error(`${table}.${column} is not a foreign key`);
      }
      if (this.isForeignArray(field)) {
         const foreignType = (field as any).type as XqlSchema;
         return {
            table: foreignType.table,
            column: foreignType.column,
            relation: {
               main: foreignType.column,
               target: model.IDColumn,
            }
         }
      } else if (this.isForeignSchema(field)) {
         const foreignType = field as XqlSchema;
         const FModel = this.getModel(foreignType.table)
         return {
            table: foreignType.table,
            column: foreignType.column,
            relation: {
               main: FModel.IDColumn,
               target: column
            }
         }
      }
      throw new Error(`Unknown foreign key type for ${table}.${column}`);
   }

   getModel(table: string): Schema {
      if (!this.models.has(table)) {
         throw new Error(`Model for table ${table} does not exist`);
      }
      return this.models.get(table) as Schema;
   }

   async migrate(force?: boolean) {
      const models = this.models
      const tables = Array.from(models.keys())
      for (let table of tables) {
         const model = models.get(table) as Schema
         await model.migrate(force)
      }
   }

   async excute(sql: string, model: Schema, requestData?: any): Promise<any> {
      if (typeof window === "undefined") {
         return await this.dialect.excute(sql, model);
      } else {
         return await this.excuteClient(sql, model);
      }
   }

   async excuteClient(sql: string, model: Schema) {

   }

}

export default Xansql