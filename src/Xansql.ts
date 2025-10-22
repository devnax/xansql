import { ArgsInfo, ListenerInfo } from "securequ";
import { xt } from ".";
import Schema from "./Schema";
import { ExcuterResult, XansqlCacheOptions, XansqlConfig, XansqlConfigOptionsRequired } from "./type";
import XansqlServer from "./XansqlServer";
import youid from "youid";
import ModelFormatter from "./Schema/include/ModelFormatter";

class Xansql {
   private _models = new Map<string, Schema>();
   config: XansqlConfigOptionsRequired = {} as XansqlConfigOptionsRequired;
   private _aliases = new Map<string, string>();
   private XansqlServer: XansqlServer | null = null;
   private XansqlClient: any = null;
   readonly log: Schema | null = null;
   private ModelFormatter: ModelFormatter | null = null;

   constructor(config: XansqlConfig) {
      let format = (typeof config === 'function' ? config() : config)
      if (!format.connection) throw new Error("Connection is required in Xansql config")
      if (!format.dialect) throw new Error("Dialect is required in Xansql config")

      this.config = {
         ...format,
         maxLimit: {
            find: format.maxLimit?.find || 100,
            create: format.maxLimit?.create || 100,
            update: format.maxLimit?.update || 100,
            delete: format.maxLimit?.delete || 100,
         },
         cachePlugins: format.cachePlugins || [],
         listenerConfig: format.listenerConfig || null,
         logging: format.logging !== undefined ? format.logging : true,
      }

      if (this.config.logging) {
         const logSchema = new Schema('xanlogs', {
            id: xt.id(),
            model: xt.string().max(100).index(),
            action: xt.enum(['create', 'update', 'delete', 'drop']),
            rows: xt.array(xt.number()), // array of affected row ids
            expires_at: xt.number().index().default(() => Date.now() + 3 * 24 * 60 * 60 * 1000), // 7 days
         });

         this.log = this.model(logSchema);
      }
   }

   clone(config?: Partial<XansqlConfig>) {
      const self = new XansqlClone({
         ...this.config,
         ...(config || {})
      });

      // assign models to self
      for (let [table, model] of this._models) {
         self.model(new Schema(table, model.schema));
      }
      return self;
   }

   private _cachePlugins: XansqlCacheOptions[] = [];
   async cachePlugins() {

      if (this._cachePlugins.length) return this._cachePlugins;
      const config = this.config;
      if (config.cachePlugins.length > 0) {
         const self = this.clone({
            cachePlugins: []
         });
         const cachePlugins: XansqlCacheOptions[] = []
         for (let plugin of config.cachePlugins) {
            if (typeof plugin === 'function') {
               cachePlugins.push(await plugin(self));
            }
         }
         this._cachePlugins = cachePlugins;
      }
      return this._cachePlugins;
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

   get models() {
      if (!this.ModelFormatter) {
         this.ModelFormatter = new ModelFormatter(this._models);
      }
      return this.ModelFormatter.models()
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
         throw new Error(`Model already exists for this table ${model.table}`);
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

   getModel(table: string): Schema {
      if (!this.models.has(table)) {
         throw new Error(`Model for table ${table} does not exist`);
      }
      return this.models.get(table) as Schema;
   }

   async migrate(force?: boolean) {
      const tables = Array.from(this.models.keys())
      for (let table of tables) {
         const model = this.models.get(table) as Schema
         await model.migrate(force)
      }
   }

   async excute(sql: string, model: Schema, args?: ArgsInfo): Promise<ExcuterResult> {
      sql = sql.trim().replaceAll(/\s+/g, ' ');

      let type = sql.split(' ')[0].toUpperCase();
      const cachePlugins = await this.cachePlugins();
      if (model.options?.log && type === "SELECT") {
         for (let plugin of cachePlugins) {
            const cache = await plugin.cache(sql, model);
            if (cache) {
               return {
                  result: cache,
                  affectedRows: cache.length,
                  insertId: null
               };
            }
         }
      }

      // execute query
      let res: ExcuterResult | null = null;

      if (typeof window === "undefined") {
         res = await this.dialect.excute(sql, model);
      } else if (this.config.listenerConfig) {
         res = await this.excuteClient(sql, model);
      }

      if (model.options?.log && res && cachePlugins.length > 0) {
         for (let plugin of cachePlugins) {
            if (type === "SELECT") {
               res.result?.length && await plugin.onFind(sql, model, res.result)
            } else if (type === "INSERT") {
               res.insertId && await plugin.onCreate(model, res.insertId);
            } else if (type === "UPDATE") {
               res.result?.length && await plugin.onUpdate(model, res.result);
            } else if (type === "DELETE") {
               res.result?.length && await plugin.onDelete(model, res.result);
            } else if (['DROP', 'CREATE', 'ALTER', 'REPLACE'].includes(type)) {
               await plugin.clear(model);
            }
         }
      }


      // clear logs of model
      // if (model.options?.log && this.log && !this.isLogModel(model)) {
      //    if (res && ['DROP', 'CREATE', 'ALTER', 'REPLACE'].includes(type)) {
      //       await this.log.delete({
      //          where: {
      //             model: model.table,
      //          }
      //       })
      //    } else if (res?.affectedRows && ['INSERT', 'UPDATE', 'DELETE'].includes(type)) {
      //       await this.log.delete({
      //          where: {
      //             model: model.table,
      //             expires_at: {
      //                lt: Date.now()
      //             }
      //          }
      //       })

      //    }
      // }

      return res as any
   }

   async excuteClient(sql: string, model: Schema): Promise<any> {
      if (!this.XansqlClient && this.config.listenerConfig?.client) {
         const mod = await import("securequ/client");
         this.XansqlClient = new mod.default(this.config.listenerConfig.client);
      }
      if (!this.XansqlClient) {
         throw new Error("Xansql client configuration is not set. Please provide a client configuration in the XansqlConfig.");
      }

      let type = sql.split(' ')[0].toUpperCase();
      const client = this.XansqlClient;

      let info = { table: model.table, sql };
      if (type === "CREATE" || type === "ALTER" || type === "DROP") {
         throw new Error(`${type}, This method is not allowed in client side.`);
      } else if (type == "INSERT") {
         let res = await client.post(`/${youid('insert')}`, { body: info })
         !res.success && console.error(res);
         return res.data || null
      } else if (type == "UPDATE") {
         let res = await client.put(`/${youid('update')}`, { body: info })
         !res.success && console.error(res);
         return res.data || null
      } else if (type == "DELETE") {
         let res = await client.delete(`/${youid('delete')}`, { params: info })
         !res.success && console.error(res);
         return res.data || null
      } else {
         let res = await client.get(`/${youid('find')}`, { params: info })
         !res.success && console.error(res);
         return res.data || null
      }
   }

   async listen(options: ListenerInfo, args?: ArgsInfo) {
      if (typeof window !== "undefined") {
         throw new Error("listen method is not available in client side.");
      }
      if (!this.XansqlServer && this.config.listenerConfig?.server) {
         const mod = await import('./XansqlServer');
         this.XansqlServer = new mod.default(this, this.config.listenerConfig?.server);
      }
      if (!this.XansqlServer) {
         throw new Error("Xansql server configuration is not set. Please provide a server configuration in the XansqlConfig.");
      }
      return await this.XansqlServer.listen(options, args)
   }

}

class XansqlClone extends Xansql { }


export default Xansql