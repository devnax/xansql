import { crypto, SecurequServer } from "securequ";
import Xansql from "../../core/Xansql";
import { makePath, makeSecret } from "./base";
import XansqlError from "../../core/XansqlError";
import Model from "../../model";
import { ListenOptions, XansqlBridgeAuthorizedInfo, XansqlBridgeServerConfig } from "./types";



class XansqlBridgeServer {
   readonly XANFETCH_CONTENT_TYPE = 'application/octet-stream';
   xansql: Xansql;
   config: XansqlBridgeServerConfig;
   private server: SecurequServer | null = null;

   constructor(xansql: Xansql, config: XansqlBridgeServerConfig) {
      this.xansql = xansql;
      this.config = config;
   }

   async authorized(info: XansqlBridgeAuthorizedInfo) {
      const config = this.config;
      if (config.isAuthorized) {
         const isPermit = await config.isAuthorized(info)
         if (!isPermit) throw new XansqlError({
            message: "isAuthorized denied for server initialization.",
            model: info.model ? info.model.table : undefined,
         })
      }
   }

   async initial() {
      if (this.server) return this.server;

      const config = this.config;
      const xansql = this.xansql
      const secret = await makeSecret(this.xansql);

      const server = new SecurequServer({
         ...(config || {}),
         clients: [
            {
               origin: `*`,
               secret
            }
         ]
      });

      server.get(await makePath('find', xansql), async (req: any) => {
         const params: any = req.searchParams
         await this.authorized({
            method: "GET",
            model: xansql.models.get(params.table) as Model,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })


      server.post(await makePath('insert', xansql), async (req: any) => {
         const params: any = req.body
         await this.authorized({
            method: "POST",
            model: xansql.models.get(params.table) as Model,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })

      server.put(await makePath('update', xansql), async (req: any) => {
         const params: any = req.body
         await this.authorized({
            method: "PUT",
            model: xansql.models.get(params.table) as Model,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })

      server.delete(await makePath('delete', xansql), async (req: any) => {
         const params: any = req.searchParams
         await this.authorized({
            method: "DELETE",
            model: xansql.models.get(params.table) as Model,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })


      server.post(await makePath('executer', xansql), async (req: any) => {
         const params: any = req.body
         await this.authorized({
            method: "POST",
            model: xansql.models.get(params.table) as Model,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })

      server.get(await makePath('raw_schema', xansql), async (req: any) => {
         throw await xansql.dialect.getSchema(xansql);
      })

      this.server = server;
      return this.server;
   }

   async listen(url: string, options: ListenOptions) {

      const server = await this.initial()
      try {
         const res = await server.listen(url, options)
         return {
            status: res.status,
            value: res.value,
         }
      } catch (error: any) {

         const secret = await makeSecret(this.xansql)
         return {
            status: 500,
            value: await crypto.encryptBuffer({
               success: false,
               message: error.message || 'Internal Server Error'
            }, secret)
         }
      }
   }
}

export default XansqlBridgeServer