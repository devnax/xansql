import Model from "./model";
import Column from "./schema/core/Column";
import { XansqlConfig, XansqlConfigOptions, XansqlDialectExcuteReturn, XansqlModelsFactory } from "./type";
import { arrayMove, isServer } from "./utils";
export * from './schema'
import sqclietn from "./securequ/client";

class xansql {
   private models: XansqlModelsFactory = new Map()
   private config: XansqlConfig


   constructor(config: XansqlConfig) {
      this.config = config
   }

   getConfig(): XansqlConfigOptions {
      let config: XansqlConfigOptions = this.config as XansqlConfigOptions
      if (typeof this.config === "function") config = this.config()
      if (!config.connection) throw new Error("Connection string is required")
      if (!config.dialect) throw new Error("Dialect is required")
      return {
         maxFindLimit: 50,
         cache: [],
         ...config
      }
   }

   registerModel(model: typeof Model<any>): Model {
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

   getModel(table: string) {
      const model = this.models.get(table)
      if (!model) {
         throw new Error(`Model ${table} not registered`);
      }
      return model
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

   async migrate(force = false) {
      const models = this.getModels()
      const tables = Array.from(models.keys())
      if (isServer()) {
         const { dialect } = this.getConfig()
         for (let table of tables) {
            const model = this.getModel(table)
            if (force) {
               await this.excute(`DROP TABLE IF EXISTS ${model.table}`);
            }
            const sql = dialect.buildSchema(model);
            await this.excute(sql)
         }
      }
   }

   async excute(sql: string): Promise<XansqlDialectExcuteReturn<any>> {

      if (isServer()) {
         const { dialect } = this.getConfig()
         const res = await dialect.excute(sql, this.getConfig());
         return res
      } else {
         let cb = sqclietn.get
         if (sql.startsWith("INSERT")) {
            cb = sqclietn.post
         } else if (sql.startsWith("UPDATE")) {
            cb = sqclietn.put
         } else if (sql.startsWith("DELETE")) {
            cb = sqclietn.delete
         }

         cb = cb.bind(sqclietn)

         const response = await sqclietn.get("/test", {

         })
         const val = await response.text()

         return {
            result: [
               val
            ],
            affectedRows: 0,
            insertId: 0,
         }
      }
   }





}

export default xansql