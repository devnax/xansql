import Model from "./model";
import Column from "./Schema/core/Column";
import { DialectOptions, XansqlCacheOptions, XansqlConfig, XansqlConfigOptions, XansqlDialectExcuteReturn, XansqlModelsFactory } from "./type";
import { arrayMove, isServer } from "./utils";
import { ListenerInfo } from "securequ/server/types";
import youid from "youid";
export * from './Schema'

let securequ: any = {
   server: null,
   client: null
}

class xansql {
   private models: XansqlModelsFactory = new Map()
   private raw_config: XansqlConfig;
   private _config: XansqlConfigOptions | null = null;
   private cachePlugins: XansqlCacheOptions[] = []
   private securequ = { server: null, client: null }
   private dialect: any = null;
   isServer: boolean = isServer()

   constructor(config: XansqlConfig) {
      this.raw_config = config;
   }

   async getConfig(): Promise<XansqlConfigOptions> {
      if (this._config) return this._config;
      if (!this.raw_config) throw new Error("Xansql configuration is not set");
      let _config: XansqlConfigOptions = this.raw_config as XansqlConfigOptions
      if (typeof this.raw_config === "function") _config = await this.raw_config()
      if (!_config.connection) throw new Error("Connection string is required")
      if (!_config.dialect) throw new Error("Dialect is required")
      this._config = {
         maxFindLimit: 50,
         cachePlugins: [],
         ..._config
      }
      return this._config;
   }

   async getDialect(): Promise<DialectOptions> {
      const { dialect } = await this.getConfig();
      return this.dialect = this.dialect || await dialect(this);
   }

   private async getCachePlugins(): Promise<XansqlCacheOptions[]> {
      if (!this.cachePlugins.length) {
         const { cachePlugins } = await this.getConfig();
         for (const cachePlugin of (cachePlugins || [])) {
            const cacheOptions = await cachePlugin(this);
            if (!cacheOptions.onCache || !cacheOptions.onFind) {
               throw new Error("Cache plugin must implement onCache and onFind method");
            }
            this.cachePlugins.push(cacheOptions);
         }
      }
      return this.cachePlugins;
   }

   registerModel<DATA extends {} = {}>(model: typeof Model<DATA>) {
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
      for (let table of tables) {
         const model = this.getModel(table)
         await model.migrate(force)
      }
   }


   async excute(sql: string, model: Model, requestData?: any): Promise<XansqlDialectExcuteReturn<any>> {
      let type = sql.split(' ')[0].toUpperCase();
      const cachePlugins = await this.getCachePlugins();
      if (type === "SELECT") {
         for (const cachePlugin of cachePlugins) {
            const cachedData = await cachePlugin.onCache({ sql, model, requestData });
            if (cachedData) return cachedData
         }
      }

      const dialect = await this.getDialect()
      const result = await dialect.excute(sql, model);

      for (const cachePlugin of cachePlugins) {
         if (type === "SELECT") {
            await cachePlugin.onFind({ sql, result, model, requestData });
         } else if (type === "INSERT" && cachePlugin.onCreate) {
            await cachePlugin.onCreate({ sql, result, model, requestData });
         } else if (type === "UPDATE" && cachePlugin.onUpdate) {
            await cachePlugin.onUpdate({ sql, result, model, requestData });
         } else if (type === "DELETE" && cachePlugin.onDelete) {
            await cachePlugin.onDelete({ sql, result, model, requestData });
         }
      }
      return result
   }

   async excuteClient(sql: string, model: Model): Promise<XansqlDialectExcuteReturn<any>> {
      const config = await this.getConfig();
      if (!config.client) {
         throw new Error("Client configuration is not set. Please provide a client configuration in the XansqlConfig.");
      }
      let type = sql.split(' ')[0].toUpperCase();
      securequ.client = securequ.client || (await import("securequ/client")).default;
      const client = this.securequ.client = this.securequ.client || new securequ.client({
         basepath: config.client?.basepath || '/data',
         secret: youid(),
         cache: false
      });

      let info = { table: model.table, sql }
      if (type === "CREATE" || type === "ALTER" || type === "DROP") {
         throw new Error(`${type}, This method is not allowed in client side.`);
      } else if (type == "INSERT") {
         return await client.post('/insert', { body: info })
      } else if (type == "UPDATE") {
         return await client.put('/update', { body: info })
      } else if (type == "DELETE") {
         return await client.delete('/delete', { params: info })
      } else {
         return await client.get('/find', { params: info })
      }
   }


   async handleClient(options: ListenerInfo, requestData?: any): Promise<any> {
      if (!this.isServer) {
         throw new Error("This method can only be used on the server side.");
      }
      const config = await this.getConfig();
      securequ.server = securequ.server || (await import("securequ/server")).default;
      const server = this.securequ.server = this.securequ.server || new securequ.server({
         basepath: config.client?.basepath || '/data'
      });

      server.get('/find', async (info: any) => {
         const params: any = info.searchParams
         const model = this.getModel(params.table || '');
         if (!model) throw new Error(`Model ${params.table} not registered`)
         throw await this.excute(params.sql, model, requestData);
      })

      server.post('/insert', async (info: any) => {
         const params: any = info.body
         const model = this.getModel(params.table || '');
         if (!model) throw new Error(`Model ${params.table} not registered`)
         throw await this.excute(params.sql, model, requestData);
      })

      server.put('/update', async (info: any) => {
         const params: any = info.body
         const model = this.getModel(params.table || '');
         if (!model) throw new Error(`Model ${params.table} not registered`)
         throw await this.excute(params.sql, model, requestData);
      })

      server.delete('/delete', async (info: any) => {
         const params: any = info.searchParams
         const model = this.getModel(params.table || '');
         if (!model) throw new Error(`Model ${params.table} not registered`)
         throw await this.excute(params.sql, model, requestData);
      })
      return await server.listen(options)
   }
}

export default xansql