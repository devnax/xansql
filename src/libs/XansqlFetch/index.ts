import { crypto, SecurequClient, SecurequServer } from "securequ";
import { XansqlOnFetchInfo, XansqlOnFetchResponse } from "../../core/type";
import Xansql from "../../core/Xansql";

let clientModule: any = null;
let serverModule: any = null;
let secretCache: string | null = null;
const makeSecret = async (xansql: Xansql) => {
   if (secretCache) return secretCache;
   const models = xansql.models
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

   secretCache = await crypto.hash(uid)
   return secretCache;
}

const pathCache: { [key: string]: string } = {}
const makePath = async (xansql: Xansql, path: string) => {
   if (pathCache[path]) return pathCache[path];
   const secret = await makeSecret(xansql)
   const gen = `/${await crypto.hash(path + secret)}`
   pathCache[path] = gen
   return gen;
}

const XansqlFetch = () => {
   let client: SecurequClient
   let server: SecurequServer

   return {
      execute: async (xansql: Xansql, sql: string) => {
         const secret = await makeSecret(xansql)

         clientModule = clientModule || (await import("securequ/client")).default
         client = client || new clientModule({
            url: "http://localhost:4000/data",
            secret
         });

         let type = sql.split(' ')[0].toUpperCase();
         let info = { sql };
         if (type == "SELECT") {
            let res = await client.get(`/${await makePath(xansql, 'find')}`, { params: info })
            !res.success && console.error(res);
            return res.data || null
         } else if (type == "UPDATE") {
            let res = await client.put(`/${await makePath(xansql, 'update')}`, { body: info })
            !res.success && console.error(res);
            return res.data || null
         } else if (type == "DELETE") {
            let res = await client.delete(`/${await makePath(xansql, 'delete')}`, { params: info })
            !res.success && console.error(res);
            return res.data || null
         } else if (type == "INSERT") {
            let res = await client.post(`/${await makePath(xansql, 'insert')}`, { body: info })
            !res.success && console.error(res);
            return res.data || null
         } else {
            let res = await client.post(`/${await makePath(xansql, 'executer')}`, { body: info })
            !res.success && console.error(res);
            return res.data || null
         }
      },
      onFetch: async (xansql: Xansql, info: XansqlOnFetchInfo): Promise<XansqlOnFetchResponse> => {
         const secret = await makeSecret(xansql)
         serverModule = serverModule || (await import("securequ/server")).default;

         if (!server) {
            server = new serverModule({
               // mode: "development",
               basepath: '/data',
               clients: [
                  {
                     origin: "http://localhost:4000",
                     secret
                  }
               ]
            });

            server.get(`/${await makePath(xansql, 'find')}`, async (info: any) => {
               const params: any = info.searchParams
               throw await xansql.execute(params.sql);
            })

            server.post(`/${await makePath(xansql, 'insert')}`, async (info: any) => {
               const params: any = info.body
               throw await xansql.execute(params.sql);
            })

            server.put(`/${await makePath(xansql, 'update')}`, async (info: any) => {
               const params: any = info.body
               throw await xansql.execute(params.sql);
            })

            server.delete(`/${await makePath(xansql, 'delete')}`, async (info: any) => {
               const params: any = info.searchParams
               throw await xansql.execute(params.sql);
            })

            server.post(`/${await makePath(xansql, 'executer')}`, async (info: any) => {
               const params: any = info.body
               throw await xansql.execute(params.sql);
            })
         }

         try {
            const res = await server.listen({
               signeture: info.headers['x-signeture'],
               path: info.path,
               body: info.body,
               method: info.method as any,
               origin: info.headers['x-origin'],
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
   }
}

export default XansqlFetch;