import { SecurequClient, SecurequServer } from "securequ";
import Model from "./model";
import Column from "./Schema/core/Column";
import { XansqlConfig, XansqlConfigOptions, XansqlDialectExcuteReturn, XansqlModelsFactory } from "./type";
import { arrayMove, isServer } from "./utils";
import { ListenerInfo } from "securequ/server/types";
import youid from "youid";

export * from './Schema'

let securequ: { server: SecurequServer | null, client: SecurequClient | null } = {
   server: null,
   client: null
}

class xansql {
   private models: XansqlModelsFactory = new Map()
   private config: XansqlConfigOptions


   constructor(config: XansqlConfig) {
      let _config: XansqlConfigOptions = config as XansqlConfigOptions
      if (typeof config === "function") config = config()
      if (!config.connection) throw new Error("Connection string is required")
      if (!config.dialect) throw new Error("Dialect is required")
      this.config = {
         maxFindLimit: 50,
         cache: [],
         ..._config
      }
   }

   getConfig(): XansqlConfigOptions {
      return this.config;
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
      if (isServer()) {
         const { dialect } = this.getConfig()
         for (let table of tables) {
            const model = this.getModel(table)
            if (force) {
               await this.excute(`DROP TABLE IF EXISTS ${model.table}`, model);
            }
            const sql = dialect.buildSchema(model);
            await this.excute(sql, model)
         }
      }
   }

   async excute(sql: string, model: Model): Promise<XansqlDialectExcuteReturn<any>> {

      let type = sql.split(' ')[0].toUpperCase();
      if (isServer()) {
         const { dialect } = this.getConfig()
         const result = await dialect.excute(sql, this.getConfig());
         return result;

      } else {

         if (!this.config.client) {
            throw new Error("Client configuration is not set. Please provide a client configuration in the XansqlConfig.");
         }

         if (!securequ.client) {
            const _securequ = await import("securequ");
            securequ.client = new _securequ.SecurequClient({
               basepath: this.config.client?.basepath || '/data',
               secret: youid(),
               cache: false
            });
         }

         const sqclient = securequ.client
         let info = { table: model.table, sql }
         let response: any = null

         if (type === "CREATE" || type === "ALTER" || type === "DROP") {
            throw new Error(`${type}, This method is not allowed in client side.`);
         } else if (type == "INSERT") {
            response = await sqclient.post('/insert', { body: info })
         } else if (type == "UPDATE") {
            response = await sqclient.put('/update', { body: info })
         } else if (type == "DELETE") {
            response = await sqclient.delete('/delete', { params: info })
         } else {
            response = await sqclient.get('/find', { params: info })
         }

         return response
      }
   }


   async excuteClient(options: ListenerInfo): Promise<any> {
      if (!isServer()) {
         throw new Error("This method can only be used on the server side.");
      }

      if (!securequ.server) {
         const _securequ = await import("securequ");
         securequ.server = new _securequ.SecurequServer({
            basepath: this.config.client?.basepath || '/data'
         });

         securequ.server.get('/find', async (info) => {
            const params: any = info.searchParams
            const model = this.getModel(params.table || '');
            if (!model) {
               throw new Error(`Model ${params.table} not registered`);
            }
            const res = await this.excute(params.sql, model);
            throw res
         })

         securequ.server.post('/insert', async (info) => {
            const params: any = info.body
            const model = this.getModel(params.table || '');
            if (!model) {
               throw new Error(`Model ${params.table} not registered`);
            }
            const res = await this.excute(params.sql, model);
            throw res
         })

         securequ.server.put('/update', async (info) => {
            const params: any = info.body
            const model = this.getModel(params.table || '');
            if (!model) {
               throw new Error(`Model ${params.table} not registered`);
            }
            const res = await this.excute(params.sql, model);
            throw res
         })

         securequ.server.delete('/delete', async (info) => {
            const params: any = info.searchParams
            const model = this.getModel(params.table || '');
            if (!model) {
               throw new Error(`Model ${params.table} not registered`);
            }
            const res = await this.excute(params.sql, model);
            throw res
         })
      }
      return await securequ.server.listen(options)
   }


}

export default xansql