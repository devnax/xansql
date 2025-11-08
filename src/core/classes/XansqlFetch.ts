import { crypto, SecurequClient, SecurequServer } from "securequ";
import Xansql from "../Xansql"
import { XansqlFetchDefault, XansqlOnFetchInfo } from "../type";

let clientModule: any = null;
let serverModule: any = null;


class XansqlFetch {
   xansql: Xansql
   private client: SecurequClient | null = null
   private server: SecurequServer | null = null
   private secretCache: string | null = null
   private config: XansqlFetchDefault

   constructor(xansql: Xansql) {
      this.xansql = xansql
      let config = xansql.config.fetch as XansqlFetchDefault
      if (config) {
         if (typeof config === 'string') {
            config = {
               url: config
            }
         }
      }
      this.config = config
   }

   async execute(sql: string) {
      const secret = await this.makeSecret()
      const config = this.config as XansqlFetchDefault

      clientModule = clientModule || (await import("securequ/client")).default
      let client = this.client as any
      if (!client) {
         client = new clientModule({
            url: config.url,
            secret
         });
         this.client = client
      }

      let type = sql.split(' ')[0].toUpperCase();
      const tableInfo = this.getTableName(sql);
      // console.log(tableInfo, sql);

      let info = { sql, table: tableInfo ? tableInfo.table : null, type: tableInfo ? tableInfo.type : type };
      if (type == "SELECT") {
         let res = await client.get(await this.makePath('find'), { params: info })
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
      } else if (type == "INSERT") {
         let res = await client.post(`/${await this.makePath('insert')}`, { body: info })
         !res.success && console.error(res);
         return res.data || null
      } else {
         let res = await client.post(await this.makePath('executer'), { body: info })
         !res.success && console.error(res);
         return res.data || null
      }
   }

   async onFetch(url: string, info: XansqlOnFetchInfo) {
      const config = this.config as XansqlFetchDefault
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

         server.get(await this.makePath('find'), async (info: any) => {
            const params: any = info.searchParams
            throw await xansql.execute(params.sql);
         })

         server.post(await this.makePath('insert'), async (info: any) => {
            const params: any = info.body
            throw await xansql.execute(params.sql);
         })

         server.put(await this.makePath('update'), async (info: any) => {
            const params: any = info.body
            throw await xansql.execute(params.sql);
         })

         server.delete(await this.makePath('delete'), async (info: any) => {
            const params: any = info.searchParams
            throw await xansql.execute(params.sql);
         })

         server.post(await this.makePath('executer'), async (info: any) => {
            const params: any = info.body
            throw await xansql.execute(params.sql);
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

   getTableName(sql: string): { table: string; type: string } | null {
      sql = sql.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

      // Operation keywords mapped to types
      const keywordMap: any = {
         'create table': 'CREATE_TABLE',
         'alter table': 'ALTER_TABLE',
         'drop table': 'DROP_TABLE',
         'truncate table': 'TRUNCATE',
         'insert into': 'INSERT',
         'update': 'UPDATE',
         'delete from': 'DELETE',
         'merge into': 'MERGE',
         'select from': 'SELECT'
      };

      // Check each operation keyword in logical order
      for (const keyword in keywordMap) {
         const regex = new RegExp(`${keyword}\\s+([\\w\`"\\.]+)`, 'i');
         const match = sql.match(regex);
         if (match) {
            let table = match[1].replace(/[`"'[\]]/g, '');
            return { table, type: keywordMap[keyword] };
         }
      }

      // Fallback: check for simple SELECT without explicit 'from'
      if (/select\s+/i.test(sql)) {
         const match = sql.match(/from\s+([^\s;]+)/i);
         if (match) {
            return { table: match[1].replace(/[`"'[\]]/g, ''), type: 'SELECT' };
         }
      }

      // Nothing matched
      return null;
   }
}

export default XansqlFetch