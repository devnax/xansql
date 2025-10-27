import { ArgsInfo, ListenerInfo, SecurequServer, SecurequServerConfig } from "securequ";
import youid from "youid";
import Xansql from "../Xansql";

let imported: any = null;

class ExecuteServer {
   private xansql: Xansql;
   private server: SecurequServer | null = null;

   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   async listen(options: ListenerInfo, args?: ArgsInfo) {
      const xansql = this.xansql;
      const { config } = this.xansql;
      if (typeof window !== "undefined") throw new Error("listen method is not available in client side.");
      if (!config.listenerConfig?.server) return;

      if (!imported) {
         imported = (await import("securequ/server")).default;
      }

      const server = this.server || new imported.default(config.listenerConfig.server);

      if (!this.server) {
         server.get(`/${youid('find')}`, async (info: any, args?: ArgsInfo) => {
            const params: any = info.searchParams
            const model = xansql.getModel(params.table || '');
            if (!model) throw new Error(`Model ${params.table} not registered`)
            throw await xansql.execute(params.sql, model, args);
         })

         server.post(`/${youid('insert')}`, async (info: any, args?: ArgsInfo) => {
            const params: any = info.body
            const model = xansql.getModel(params.table || '');
            if (!model) throw new Error(`Model ${params.table} not registered`)
            throw await xansql.execute(params.sql, model, args);
         })

         server.put(`/${youid('update')}`, async (info: any, args?: ArgsInfo) => {
            const params: any = info.body
            const model = xansql.getModel(params.table || '');
            if (!model) throw new Error(`Model ${params.table} not registered`)
            throw await xansql.execute(params.sql, model, args);
         })

         server.delete(`/${youid('delete')}`, async (info: any, args?: ArgsInfo) => {
            const params: any = info.searchParams
            const model = xansql.getModel(params.table || '');
            if (!model) throw new Error(`Model ${params.table} not registered`)
            throw await xansql.execute(params.sql, model, args);
         })

         server.post(`/${youid('executer')}`, async (info: any, args?: ArgsInfo) => {
            const params: any = info.body
            const model = xansql.getModel(params.table || '');
            if (!model) throw new Error(`Model ${params.table} not registered`)
            throw await xansql.execute(params.sql, model, args);
         })

         this.server = server;
      }

      return await server.listen(options, args)
   }
}

export default ExecuteServer;  