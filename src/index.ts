import BaseDialect from "./dialects/BaseDialect";
import MysqlDialect from "./dialects/Mysql";
import Model from "./model";
import Column from "./schema/core/Column";
import Relation from "./schema/core/Relation";
import { DialectDrivers, XansqlConfig, XansqlConfigOptions, XansqlDialectDriver, XansqlDialectExcuteReturn, XansqlDialectsFactory, XansqlModelsFactory } from "./type";
import { arrayMove, isServer } from "./utils";
export * from './schema'

type XansqlsValue = {
   dialects: XansqlDialectsFactory,
   config: XansqlConfigOptions,
   models: XansqlModelsFactory,
   dialect: XansqlDialectDriver | null,
}

const Xansqls = new Map<number, XansqlsValue>();

const getInfo = (instanceId: number) => {
   const info = Xansqls.get(instanceId)
   if (!info) throw new Error("Xansql not initialized")
   return info
}

class xansql {
   private instanceId = Math.floor(Math.random() * 1000) + Date.now()

   constructor(config: XansqlConfig) {
      let _config: XansqlConfigOptions = { connection: "" }
      if (typeof config === "function") config = config()
      _config = typeof config === "string" ? { connection: config } : config
      if (!_config.connection) throw new Error("Connection string is required")

      let dialect = _config.dialect || null
      if (!_config.dialect && typeof _config.connection === 'string') {
         const d = _config.connection.split("://").shift() as any
         if (DialectDrivers.includes(d)) {
            dialect = d
         }
      }

      Xansqls.set(this.instanceId, {
         dialects: new Map(),
         config: _config,
         models: new Map,
         dialect
      })

      this.registerDialect(MysqlDialect);
   }

   private registerDialect(dialect: typeof BaseDialect) {
      const instance = new dialect(this);
      if (!instance.driver) {
         throw new Error(`Dialect must have a driver in ${dialect.constructor.name}`);
      }
      const info = getInfo(this.instanceId)
      info.dialects.set(instance.driver, instance);
   }

   model = (model: typeof Model): Model => {
      const instance = new model(this);
      if (!instance.table) {
         throw new Error(`Model must have a table name in ${model.constructor.name}`);
      }
      const info = getInfo(this.instanceId)
      const aliasKeys = Object.values(info.models).map((model: any) => model.alias)
      let alias = instance.table.split('_').map((word: any) => word[0]).join('');
      if (aliasKeys.includes(alias)) {
         alias = instance.table.split('_').map((word: any) => word.substring(0, 2)).join('');
      }

      instance.alias = alias
      info.models.set(instance.table, instance);
      Xansqls.set(this.instanceId, { ...info })
      this.sortTables()
      return instance
   }

   sortTables() {
      let tables: string[] = []
      const info = getInfo(this.instanceId)
      info.models.forEach((model: Model) => {
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
            }
         }
      })

      const models = new Map()
      tables.forEach((table) => {
         let m = info.models.get(table)
         if (m) {
            models.set(table, info.models.get(table) as any)
         }
      })
      info.models = models
      Xansqls.set(this.instanceId, { ...info })
   }

   getConfig = (): XansqlConfigOptions => {
      return getInfo(this.instanceId).config;
   }

   getModel = (table: string) => {
      const info = getInfo(this.instanceId)
      const model = info.models.get(table)
      if (!model) {
         throw new Error(`Model ${table} not registered`);
      }
      return model
   }

   getDialect = () => {
      const info = getInfo(this.instanceId)
      if (!info.dialect) {
         throw new Error("Invalid Dialect");
      }
      const dialect = info.dialects.get(info.dialect);
      if (!dialect) {
         throw new Error(`Dialect ${info.dialect} not registered`);
      }
      return dialect;
   }

   buildSchema = (model: Model) => {
      const dialect = this.getDialect();
      return dialect.buildSchema(model);
   }

   excute = async (sql: string, model?: Model): Promise<XansqlDialectExcuteReturn<any>> => {
      const dialect = this.getDialect();
      if (isServer) {
         return await dialect.excute(sql);
      } else {
         throw new Error("Client excute not implemented yet");
      }
   }

   migrate = async (force = false) => {
      const info = getInfo(this.instanceId)
      const models = info.models
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
}

export default xansql