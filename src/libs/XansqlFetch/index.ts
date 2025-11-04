import { SecurequClient, SecurequServer } from "securequ";
import { XansqlOnFetchInfo } from "../../core/type";
import Xansql from "../../core/Xansql";
import youid from "youid";

let clientModule: any = null;
let serverModule: any = null;

const XansqlFetch = () => {
   let client: SecurequClient
   let server: SecurequServer
   return {
      execute: async (sql: string) => {
         if (!clientModule) {
            clientModule = (await import("securequ/client")).default
         }
         if (!client) {
            client = new clientModule({
               url: "http://localhost:4000/data",
               secret: "clientsecretclientsecret",
            });
         }

         let type = sql.split(' ')[0].toUpperCase();
         let info = { sql };
         if (type == "SELECT") {
            let res = await client.get(`/${youid('find')}`, { params: info })
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
         } else if (type == "INSERT") {
            let res = await client.post(`/${youid('insert')}`, { body: info })
            !res.success && console.error(res);
            return res.data || null
         } else {
            let res = await client.post(`/${youid('executer')}`, { body: info })
            !res.success && console.error(res);
            return res.data || null
         }
      },
      onFetch: async (xansql: Xansql, info: XansqlOnFetchInfo) => {
         if (!serverModule) {
            serverModule = (await import("securequ/server")).default;
         }
         if (!server) {
            server = new serverModule({
               mode: "development",
               basepath: '/data',
               clients: [
                  {
                     origin: "http://localhost:4000",
                     secret: "clientsecretclientsecret"
                  }
               ]
            });

            server.get(`/${youid('find')}`, async (info: any) => {
               const params: any = info.searchParams
               throw await xansql.execute(params.sql);
            })

            server.post(`/${youid('insert')}`, async (info: any) => {
               const params: any = info.body
               throw await xansql.execute(params.sql);
            })

            server.put(`/${youid('update')}`, async (info: any) => {
               const params: any = info.body
               throw await xansql.execute(params.sql);
            })

            server.delete(`/${youid('delete')}`, async (info: any) => {
               const params: any = info.searchParams
               throw await xansql.execute(params.sql);
            })

            server.post(`/${youid('executer')}`, async (info: any) => {
               const params: any = info.body
               throw await xansql.execute(params.sql);
            })
         }

         return await server.listen({
            signeture: info.headers['x-signeture'],
            path: info.path,
            body: info.body,
            method: info.method as any,
            origin: info.headers['x-origin'],
         })
      }
   }
}

export default XansqlFetch;