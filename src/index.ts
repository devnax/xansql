import youid from "youid";
import BaseDialect from "./dialects/BaseDialect";
import CacheDialect from "./dialects/Cache";
import Cache from "./dialects/Cache/Cache";
import MysqlDialect from "./dialects/Mysql";
import SqliteDialect from "./dialects/Sqlite";
import Model from "./model";
import Column from "./schema/core/Column";
import { DialectDrivers, XansqlConfig, XansqlConfigOptions, XansqlDialectDriver, XansqlDialectExcuteReturn, XansqlDialectsFactory, XansqlModelsFactory } from "./type";
import { arrayMove, isServer } from "./utils";
import pako from "./utils/pako";
export * from './schema'

class xansql {
   private dialects: XansqlDialectsFactory = new Map();
   private models: XansqlModelsFactory = new Map()
   private dialect: XansqlDialectDriver | null;
   config: XansqlConfigOptions

   private cacheDB: xansql | null = null;
   private cache: Cache | null = null;

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

      _config = {
         dialect: dialect || "mysql",
         cache: _config.cache || true,
         maxDataLimit: 100,
         ..._config
      }

      this.config = _config
      this.dialect = dialect || null

      this.registerDialect(MysqlDialect);
      this.registerDialect(SqliteDialect);
   }

   async Cache() {
      if (this.config.cache) {
         if (this.cache) return this.cache
         this.cacheDB = new xansql({
            dialect: "cache" as any,
            connection: ":memory:",
            cache: false,
         })
         this.cacheDB.registerDialect(CacheDialect)
         this.cache = this.cacheDB.model(Cache)
         await this.cacheDB.migrate()
         return this.cache
      }
   }

   migrate = async (force = false) => {
      const models = this.getModels()
      const tables = Array.from(models.keys())
      if (isServer) {
         if (force) {
            for (let table of [...tables].reverse()) {
               const model = this.getModel(table)
               await this.excute(`DROP TABLE IF EXISTS ${model.table}`, model)
            }
         }
         for (let table of tables) {
            const model = this.getModel(table)
            const sql = this.buildSchema(model);
            await this.excute(sql, model)
         }
      }
   }

   excute = async (sql: string, model: Model): Promise<XansqlDialectExcuteReturn<any>> => {
      const cache = await this.Cache()
      const isCache = cache && (model as any).xansql.dialect !== 'cache'
      if (isCache) {
         let key = youid(sql) as string
         const find: any = await cache.findOne({
            where: {
               cache_key: key,
            }
         })

         if (find) {
            const cacheValue = find.cache_value
            const decompress = pako.decompress(cacheValue) as string
            return JSON.parse(decompress)
         }
      }

      const dialect = this.getDialect();
      if (isServer) {
         const res = await dialect.excute(sql);

         if (isCache) {
            const cacheKey = youid(sql) as string
            const cacheValue = JSON.stringify(res)
            const compress = pako.compress(cacheValue) as string
            await cache.create({
               data: {
                  cache_key: cacheKey,
                  cache_value: compress,
                  expire: "0",
                  created_at: new Date().toISOString()
               }
            })
         }

         return res
      } else {
         throw new Error("Client excute not implemented yet");
      }
   }

   registerDialect(dialect: typeof BaseDialect) {
      const instance = new dialect(this);
      if (!instance.driver) {
         throw new Error(`Dialect must have a driver in ${dialect.constructor.name}`);
      }
      this.dialects.set(instance.driver, instance);
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

   getDialect = () => {
      if (!this.dialect) {
         throw new Error("Invalid Dialect");
      }
      const dialect = this.dialects.get(this.dialect);
      if (!dialect) {
         throw new Error(`Dialect ${this.dialect} not registered`);
      }
      return dialect;
   }

   buildSchema = (model: Model) => {
      const dialect = this.getDialect();
      return dialect.buildSchema(model);
   }


}

export default xansql