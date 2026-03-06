import Xansql from "../../core/Xansql";
import XansqlError from "../../core/XansqlError";
import Model from "../../model";
import { makePath, makeSecret } from "./base";
import { ListenOptions, XansqlBridgeAuthorizedInfo, XansqlBridgeServerConfig } from "./types";
import { crypto, SecurequServer } from "securequ";

class XansqlBridgeServer {
   readonly REQUEST_CONTENT_TYPE = 'application/octet-stream';
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
            code: "VALIDATION_ERROR",
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
         file: {
            checkFileType: true,
            async upload(chunk, filemeta) {
               return await xansql.uploadFile({
                  chunk,
                  meta: filemeta
               }) as any
            },
            async delete(fileId) {
               return await xansql.deleteFile(fileId)
            },
         },
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
            model: Array.from(xansql.models.values()).find(m => m.table === params.table) as Model<any>,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })


      server.post(await makePath('insert', xansql), async (req: any) => {
         const params: any = req.body
         await this.authorized({
            method: "POST",
            model: Array.from(xansql.models.values()).find(m => m.table === params.table) as Model,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })

      server.put(await makePath('update', xansql), async (req: any) => {
         const params: any = req.body
         await this.authorized({
            method: "PUT",
            model: Array.from(xansql.models.values()).find(m => m.table === params.table) as Model,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })

      server.delete(await makePath('delete', xansql), async (req: any) => {
         const params: any = req.searchParams
         await this.authorized({
            method: "DELETE",
            model: Array.from(xansql.models.values()).find(m => m.table === params.table) as Model,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })


      server.post(await makePath('executer', xansql), async (req: any) => {
         const params: any = req.body
         await this.authorized({
            method: "POST",
            model: Array.from(xansql.models.values()).find(m => m.table === params.table) as Model,
            action: params.action,
         })
         throw await xansql.execute(params.sql);
      })

      this.server = server;
      return this.server;
   }

   async listen(url: string, options: ListenOptions) {
      const server = await this.initial()
      return await server.listen(url, options)
   }
}

export default XansqlBridgeServer