import { crypto, SecurequClient, SecurequServer } from "securequ";
import Xansql from "../Xansql"
import { XansqlFetchConfig, XansqlFileMeta, XansqlOnFetchInfo } from "../type";

let clientModule: any = null;
let serverModule: any = null;


class XansqlFetch {
   xansql: Xansql
   private _client: SecurequClient | null = null
   private server: SecurequServer | null = null
   private secretCache: string | null = null
   private config: XansqlFetchConfig

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
      this.config = config
   }

   async client() {
      const secret = await this.makeSecret()
      const config = this.config as XansqlFetchConfig
      clientModule = clientModule || (await import("securequ/client")).default
      let client = this._client as any
      if (!client) {
         client = new clientModule({
            url: config.url,
            secret
         });
         this._client = client
      }
      return client;
   }

   async execute(sql: string): Promise<any> {
      const client = await this.client()
      let type = sql.split(' ')[0].toUpperCase();
      const tableInfo = this.getTableName(sql);

      let info = { sql, table: tableInfo ? tableInfo.table : null, type: tableInfo ? tableInfo.type : type };
      if (type == "SELECT") {
         let res = await client.get(await this.makePath('find'), { params: info })
         !res.success && console.error(res);
         return res.data || null
      } else if (type == "INSERT") {
         let res = await client.post(`/${await this.makePath('insert')}`, { body: info })
         !res.success && console.error(res);
         return res.data || null
      } else if (type == "UPDATE") {
         let res = await client.put(await this.makePath('update'), { body: info })
         !res.success && console.error(res);
         return res.data || null
      } else if (type == "DELETE") {
         let res = await client.delete(await this.makePath('delete'), { params: info })
         !res.success && console.error(res);
         return res.data || null
      } else {
         let res = await client.post(await this.makePath('executer'), { body: info })
         !res.success && console.error(res);
         return res.data || null
      }
   }

   async uploadFile(chunk: Uint8Array, chunkIndex: number, filemeta: XansqlFileMeta) {
      const client = await this.client()
      let res = await client.post(await this.makePath('uploadFile'), {
         body: {
            chunk,
            chunkIndex,
            filemeta
         }
      })
      !res.success && console.error(res);
      return res.data || null
   }

   async deleteFile(filename: string) {
      const client = await this.client()
      let res = await client.delete(await this.makePath('deleteFile'), { params: { filename } })
      !res.success && console.error(res);
      return res.data || null
   }

   async onFetch(url: string, info: XansqlOnFetchInfo) {
      const config = this.config as XansqlFetchConfig
      const secret = await this.makeSecret()
      serverModule = serverModule || (await import("securequ/server")).default;
      let server = this.server as any
      if (!server) {
         const url = new URL(config.url)
         server = new serverModule({
            mode: config.mode,
            basepath: `/${url.pathname.replace(/^\/+/, '')}`,
            clients: [
               {
                  origin: `*`,
                  secret
               }
            ]
         });
         this.server = server
         const xansql = this.xansql

         server.get(await this.makePath('find'), async (req: any) => {
            const params: any = req.searchParams
            if (info.permission) {
               const isPermit = await info.permission({
                  method: "GET",
                  table: params.table,
                  type: "find",
                  modle: xansql.models.get(params.table) || null
               })
               if (!isPermit) throw new Error("Permission denied for fetch request.")
            }
            throw await xansql.execute(params.sql);
         })

         server.post(await this.makePath('insert'), async (req: any) => {
            const params: any = req.body
            if (info.permission) {
               const isPermit = await info.permission({
                  method: "POST",
                  table: params.table,
                  type: "insert",
                  modle: xansql.models.get(params.table) || null
               })
               if (!isPermit) throw new Error("Permission denied for fetch request.")
            }
            throw await xansql.execute(params.sql);
         })

         server.put(await this.makePath('update'), async (req: any) => {
            const params: any = req.body
            if (info.permission) {
               const isPermit = await info.permission({
                  method: "PUT",
                  table: params.table,
                  type: "update",
                  modle: xansql.models.get(params.table) || null
               })
               if (!isPermit) throw new Error("Permission denied for fetch request.")
            }
            throw await xansql.execute(params.sql);
         })

         server.delete(await this.makePath('delete'), async (req: any) => {
            const params: any = req.searchParams
            if (info.permission) {
               const isPermit = await info.permission({
                  method: "DELETE",
                  table: params.table,
                  type: "delete",
                  modle: xansql.models.get(params.table) || null
               })
               if (!isPermit) throw new Error("Permission denied for fetch request.")
            }
            throw await xansql.execute(params.sql);
         })

         server.post(await this.makePath('executer'), async (req: any) => {
            const params: any = req.body
            if (info.permission) {
               const isPermit = await info.permission({
                  method: "POST",
                  table: params.table,
                  type: "executer",
                  modle: xansql.models.get(params.table) || null
               })
               if (!isPermit) throw new Error("Permission denied for fetch request.")
            }
            throw await xansql.execute(params.sql);
         })

         server.post(await this.makePath('uploadFile'), async (req: any) => {
            const params: any = req.body
            const chunk: Uint8Array = params.chunk;
            const chunkIndex: number = params.chunkIndex;
            const filemeta: XansqlFileMeta = params.filemeta;
            if (!xansql.config.file || !xansql.config.file.upload) {
               throw new Error("Xansql file upload configuration is not set.");
            }
            const success = await xansql.config.file.upload(chunk, chunkIndex, filemeta);
            throw success;
         })

         server.delete(await this.makePath('deleteFile'), async (req: any) => {
            const params: any = req.searchParams
            const filename: string = params.filename;
            if (!xansql.config.file || !xansql.config.file.delete) {
               throw new Error("Xansql file delete configuration is not set.");
            }
            const success = await xansql.config.file.delete(filename);
            throw success;
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
         return {
            status: 500,
            body: await crypto.encryptBuffer({
               success: false,
               message: error.message || 'Internal Server Error'
            }, secret)
         }
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

   getTableName(sql: string): { table: string | null, type: string | "unknown" } | null {
      sql = sql.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

      const lower = sql.toLowerCase();

      // keyword → type map
      const keywordMap: any = {
         'create table': 'CREATE_TABLE',
         'alter table': 'ALTER_TABLE',
         'drop table': 'DROP_TABLE',
         'truncate table': 'TRUNCATE',
         'insert into': 'INSERT',
         'update': 'UPDATE',
         'delete from': 'DELETE',
         'merge into': 'MERGE',
         'select': 'SELECT'
      };

      // detect query type
      let foundType = null;
      for (const keyword in keywordMap) {
         if (lower.startsWith(keyword)) {
            foundType = keywordMap[keyword];
            break;
         }
      }
      if (!foundType && lower.startsWith('select')) foundType = 'SELECT';

      let match = null;

      // 1️⃣ Direct table references (CREATE, INSERT, UPDATE, DELETE, etc.)
      for (const keyword in keywordMap) {
         const regex = new RegExp(`${keyword}\\s+([\\w\`"\\.]+)`, 'i');
         match = sql.match(regex);
         if (match) {
            return { table: match[1].replace(/[`"'[\]]/g, ''), type: keywordMap[keyword] };
         }
      }

      // 2️⃣ For SELECT with subqueries — find the last FROM target
      const fromMatches = [...sql.matchAll(/from\s+([^\s(;\)]+)/gi)];
      if (fromMatches.length > 0) {
         const last = fromMatches[fromMatches.length - 1][1];
         return { table: last.replace(/[`"'[\]]/g, ''), type: foundType || 'SELECT' };
      }

      return { table: null, type: foundType || 'UNKNOWN' };
   }
}

export default XansqlFetch