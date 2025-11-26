import { crypto, SecurequClient, SecurequServer } from "securequ";
import Xansql from "../Xansql"
import { ExecuterResult, XansqlFetchConfig, XansqlFileMeta, XansqlOnFetchInfo } from "../type";
import ExecuteMeta, { ExecuteMetaData } from "../ExcuteMeta";
import Model from "../../model";
import XansqlError from "../XansqlError";

let clientModule: typeof import("securequ/client").default | null = null;
let serverModule: typeof import("securequ/server").default | null = null;


class XansqlFetch {
   xansql: Xansql
   private _client: SecurequClient | null = null
   private _server: SecurequServer | null = null
   private secretCache: string | null = null
   private fetchConfig: XansqlFetchConfig

   constructor(xansql: Xansql) {
      this.xansql = xansql
      let config = xansql.config.fetch as XansqlFetchConfig
      if (config) {
         if (typeof config === 'string') {
            config = {
               url: config
            }
         }
      }
      this.fetchConfig = config
   }

   async client() {
      if (!this._client) {
         const secret = await this.makeSecret()
         const config = this.fetchConfig as XansqlFetchConfig
         clientModule = clientModule || (await import("securequ/client")).default
         this._client = new clientModule({
            url: config.url,
            secret
         });
      }
      return this._client;
   }

   async server() {
      if (!this._server) {
         const xansql = this.xansql
         const config = xansql.config
         const fetchConfig = this.fetchConfig as XansqlFetchConfig
         const secret = await this.makeSecret()
         serverModule = serverModule || (await import("securequ/server")).default;
         const url = new URL(fetchConfig.url)
         this._server = new serverModule({
            mode: fetchConfig.mode,
            basepath: `/${url.pathname.replace(/^\/+/, '')}`,
            file: config.file,
            clients: [
               {
                  origin: `*`,
                  secret
               }
            ]
         });
      }
      return this._server;
   }

   async execute(sql: string, executeId: string): Promise<ExecuterResult> {

      const client = await this.client()
      const meta = ExecuteMeta.get(executeId) as ExecuteMetaData
      const data = {
         sql,
         table: meta.model.table,
         action: meta.action,
         modelType: meta.modelType,
         args: meta.args
      };

      if (meta.action === "SELECT" || meta.action === "AGGREGATE") {
         let res = await client.get(await this.makePath('find'), { params: data })
         !res.success && console.error(res);
         return res.data || null
      } else if (meta.action === "INSERT") {
         let res = await client.post(await this.makePath('insert'), { body: data })
         !res.success && console.error(res);
         return res.data || null
      } else if (meta.action === "UPDATE") {
         let res = await client.put(await this.makePath('update'), { body: data })
         !res.success && console.error(res);
         return res.data || null
      } else if (meta.action === "DELETE") {
         let res = await client.delete(await this.makePath('delete'), { params: data })
         !res.success && console.error(res);
         return res.data || null
      } else {
         let res = await client.post(await this.makePath('executer'), { body: data })
         !res.success && console.error(res);
         return res.data || null
      }
   }

   async getSchema(): Promise<any> {
      const client = await this.client()
      const res = await client.get(await this.makePath('raw_schema'))
      if (!res.success) {
         throw new XansqlError({
            message: `Failed to fetch schema: ${res.message || 'Unknown error'}`
         })
      }
      return res.data
   }

   private loaded = false
   async onFetch(url: string, info: XansqlOnFetchInfo) {
      const xansql = this.xansql
      const config = xansql.config

      if (typeof window !== "undefined") throw new XansqlError({
         message: `XansqlFetch.onFetch cannot be called in browser environment.`,
      })
      const hasUrl = typeof config.fetch === "string" || typeof config.fetch.url === "string"
      if (!config.fetch || !hasUrl) throw new XansqlError({
         message: `Xansql fetch configuration is not provided.`,
      })

      let server = await this.server()

      if (!this.loaded) {
         this.loaded = true
         server.get(await this.makePath('find'), async (req: any) => {
            const params: any = req.searchParams
            if (info.isAuthorized) {
               const isPermit = await info.isAuthorized({
                  method: "GET",
                  model: xansql.models.get(params.table) as Model,
                  action: params.action,
                  modelType: params.modelType,
                  args: params.args
               })
               if (!isPermit) throw new XansqlError({
                  message: "isAuthorized denied for fetch request.",
                  model: params.table,
               })
            }
            throw await xansql.execute(params.sql);
         })
         server.post(await this.makePath('insert'), async (req: any) => {
            const params: any = req.body
            if (info.isAuthorized) {
               const isPermit = await info.isAuthorized({
                  method: "POST",
                  model: xansql.models.get(params.table) as Model,
                  action: params.action,
                  modelType: params.modelType,
                  args: params.args,
               })
               if (!isPermit) throw new XansqlError({
                  message: "isAuthorized denied for fetch request.",
                  model: params.table,
               })
            }
            throw await xansql.execute(params.sql);
         })
         server.put(await this.makePath('update'), async (req: any) => {
            const params: any = req.body
            if (info.isAuthorized) {
               const isPermit = await info.isAuthorized({
                  method: "PUT",
                  model: xansql.models.get(params.table) as Model,
                  action: params.action,
                  modelType: params.modelType,
                  args: params.args,
               })
               if (!isPermit) throw new XansqlError({
                  message: "isAuthorized denied for fetch request.",
                  model: params.table,
               })
            }
            throw await xansql.execute(params.sql);
         })
         server.delete(await this.makePath('delete'), async (req: any) => {
            const params: any = req.searchParams
            if (info.isAuthorized) {
               const isPermit = await info.isAuthorized({
                  method: "DELETE",
                  model: xansql.models.get(params.table) as Model,
                  action: params.action,
                  modelType: params.modelType,
                  args: params.args,
               })
               if (!isPermit) throw new XansqlError({
                  message: "isAuthorized denied for fetch request.",
                  model: params.table,
               })
            }
            throw await xansql.execute(params.sql);
         })
         server.post(await this.makePath('executer'), async (req: any) => {
            const params: any = req.body
            if (info.isAuthorized) {
               const isPermit = await info.isAuthorized({
                  method: "POST",
                  model: xansql.models.get(params.table) as Model,
                  action: params.action,
                  modelType: params.modelType,
                  args: params.args,
               })
               if (!isPermit) throw new XansqlError({
                  message: "isAuthorized denied for fetch request.",
                  model: params.table,
               })
            }
            throw await xansql.execute(params.sql);
         })
         server.get(await this.makePath('raw_schema'), async (req: any) => {
            if (info.isAuthorized) {
               const isPermit = await info.isAuthorized({
                  method: "GET",
                  action: "getSchema",
                  model: null as any,
                  modelType: "main",
                  args: {},
               })
               if (!isPermit) throw new XansqlError({
                  message: "isAuthorized denied for fetch request.",
               })
            }
            throw await xansql.dialect.getSchema();
         })
      }

      try {
         const res = await server.listen(url, {
            body: info.body,
            headers: info.headers,
         })

         return {
            status: res.status,
            body: res.content,
         }
      } catch (error: any) {
         const secret = await this.makeSecret()
         return {
            status: 500,
            body: await crypto.encryptBuffer({
               success: false,
               message: error.message || 'Internal Server Error'
            }, secret)
         }
      }
   }

   async uploadFile(file: File, executeId?: string): Promise<XansqlFileMeta> {
      const xansql = this.xansql;
      if (!xansql.config.file || !xansql.config.file.upload) {
         throw new XansqlError("Xansql file upload configuration is not provided.");
      }

      if (typeof window !== "undefined" && !xansql.config.fetch) {
         throw new XansqlError("Xansql fetch configuration is required in client side.");
      }

      if (typeof window !== "undefined") {
         const client = await this.client();
         const res = await client.uploadFile(file);
         ExecuteMeta.delete(executeId!);
         return res.data
      } else {
         const server = await this.server();
         return await server.uploadFile(file);
      }
   }

   async deleteFile(fileId: string, executeId?: string) {
      const xansql = this.xansql;
      if (!xansql.config.file || !xansql.config.file.delete) {
         throw new XansqlError("Xansql file delete configuration is not provided.");
      }
      if (typeof window !== "undefined" && !xansql.config.fetch) {
         throw new XansqlError("Xansql fetch configuration is required in client side.");
      }
      if (typeof window !== "undefined") {
         const client = await this.client();
         const res = await client.deleteFile(fileId);
         ExecuteMeta.delete(executeId!);
         return res;
      } else {
         const server = await this.server();
         const res = await server.deleteFile(fileId);
         return res;
      }
   }

   private async makeSecret() {
      if (this.secretCache) return this.secretCache;
      const models = this.xansql.models
      let uid = ''
      for (let model of models.values()) {
         uid += model.table
         for (let column in model.schema) {
            uid += column
            const field = model.schema[column]
            const meta = field.meta || {}
            uid += JSON.stringify(meta)
         }
      }

      this.secretCache = await crypto.hash(uid)
      return this.secretCache;
   }

   private async makePath(path: string) {
      const secret = await this.makeSecret()
      const gen = `/${await crypto.hash(path + secret)}`
      return gen;
   }

}

export default XansqlFetch