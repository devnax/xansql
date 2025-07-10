// import SecurequClient from "securequ/client";
import BaseDialect from "./dialects/BaseDialect";
import CacheDialect from "./dialects/Cache";
import Cache from "./dialects/Cache/Cache";
import MysqlDialect from "./dialects/Mysql";
import SqliteDialect from "./dialects/Sqlite";
import Model from "./model";
import Column from "./schema/core/Column";
import { DialectDrivers, XansqlConfig, XansqlConfigOptions, XansqlDialectDriver, XansqlDialectExcuteReturn, XansqlDialectsFactory, XansqlModelsFactory } from "./type";
import { arrayMove, isServer } from "./utils";
export * from './schema'

class xansql {
   private models: XansqlModelsFactory = new Map()
   config: XansqlConfigOptions
   // private securequClient: SecurequClient | null = null;

   constructor(config: XansqlConfig) {
      if (typeof config === "function") config = config()
      if (!config.connection) throw new Error("Connection string is required")
      if (!config.dialect) throw new Error("Dialect is required")
      this.config = config
   }

   migrate = async (force = false) => {
      const models = this.getModels()
      const tables = Array.from(models.keys())
      if (isServer) {
         if (force) {
            for (let table of [...tables].reverse()) {
               const model = this.getModel(table)
               await this.excute(`DROP TABLE IF EXISTS ${model.table}`)
            }
         }
         for (let table of tables) {
            const model = this.getModel(table)
            const sql = this.buildSchema(model);
            await this.excute(sql)
         }
      }
   }

   excute = async (sql: string): Promise<XansqlDialectExcuteReturn<any>> => {
      if (isServer) {
         const dialect = this.config.dialect;
         const res = await dialect.excute(sql);
         return res
      } else {

         // let cb = sqclietn.get
         // if (sql.startsWith("INSERT")) {
         //    cb = sqclietn.post
         // } else if (sql.startsWith("UPDATE")) {
         //    cb = sqclietn.put
         // } else if (sql.startsWith("DELETE")) {
         //    cb = sqclietn.delete
         // }

         // console.log(cb);


         return {
            result: [],
            affectedRows: 0,
            insertId: 0,
         }
      }
   }

   model = (model: typeof Model<any>): Model => {
      const instance = new model(this);
      if (!instance.table) {
         throw new Error(`Model must have a table name in ${model.constructor.name}`);
      }
      const aliasKeys = Object.values(this.models).map((model: any) => model.alias)
      let alias = instance.table.split('_').map((word: any) => word[0]).join('');
      if (aliasKeys.includes(alias)) {
         alias = instance.table.split('_').map((word: any) => word.substring(0, 2)).join('');
      }

      instance.alias = alias
      this.models.set(instance.table, instance);
      return instance
   }

   getModels() {
      let tables: string[] = []
      this.models.forEach((model: Model) => {
         const schema = model.schema.get()

         for (const column in schema) {
            const schemaVal = schema[column]
            if (schemaVal instanceof Column) {
               const references = schemaVal.constraints.references
               if (references) {
                  const mainIndex = tables.indexOf(model.table)
                  const foreginIndex = tables.indexOf(references.table)
                  let hasMain = mainIndex !== -1
                  let hasForegin = foreginIndex !== -1
                  if (!hasMain && !hasForegin) {
                     tables.push(references.table)
                     tables.push(model.table)
                  } else if (!hasMain && hasForegin) {
                     tables.splice(foreginIndex + 1, 0, model.table)
                  } else if (hasMain && !hasForegin) {
                     tables.splice(mainIndex, 0, references.table)
                  } else if (hasMain && hasForegin && foreginIndex > mainIndex) {
                     tables = arrayMove(tables, foreginIndex, mainIndex)
                  }
               }
            } else {
               if (!tables.includes(model.table)) {
                  tables.push(model.table)
               }
            }
         }
      })

      const models = new Map()
      for (let table of tables) {
         const model = this.models.get(table)
         if (model) {
            models.set(table, model)
         }
      }
      return models
   }

   getModel = (table: string) => {
      const model = this.models.get(table)
      if (!model) {
         throw new Error(`Model ${table} not registered`);
      }
      return model
   }

   buildSchema = (model: Model) => {
      const dialect = this.config.dialect;
      return dialect.migrate(model);
   }


}

export default xansql