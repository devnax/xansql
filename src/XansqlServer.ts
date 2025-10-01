import { ArgsInfo, ListenerInfo, SecurequServer, SecurequServerConfig } from "securequ";
import { Xansql } from ".";
import youid from "youid";

class XansqlServer {
   private securequ: SecurequServer;

   constructor(xansql: Xansql, config: SecurequServerConfig) {
      this.securequ = new SecurequServer(config);

      this.securequ.get(`/${youid('find')}`, async (info: any, args?: ArgsInfo) => {
         const params: any = info.searchParams
         const model = xansql.getModel(params.table || '');
         if (!model) throw new Error(`Model ${params.table} not registered`)
         throw await xansql.excute(params.sql, model, {
            ...args,
            key: params.key
         });
      })

      this.securequ.post(`/${youid('insert')}`, async (info: any, args?: ArgsInfo) => {
         const params: any = info.body
         const model = xansql.getModel(params.table || '');
         if (!model) throw new Error(`Model ${params.table} not registered`)
         throw await xansql.excute(params.sql, model, {
            ...args,
            key: params.key
         });
      })

      this.securequ.put(`/${youid('update')}`, async (info: any, args?: ArgsInfo) => {
         const params: any = info.body
         const model = xansql.getModel(params.table || '');
         if (!model) throw new Error(`Model ${params.table} not registered`)
         throw await xansql.excute(params.sql, model, {
            ...args,
            key: params.key
         });
      })

      this.securequ.delete(`/${youid('delete')}`, async (info: any, args?: ArgsInfo) => {
         const params: any = info.searchParams
         const model = xansql.getModel(params.table || '');
         if (!model) throw new Error(`Model ${params.table} not registered`)
         throw await xansql.excute(params.sql, model, {
            ...args,
            key: params.key
         });
      })

   }

   async listen(options: ListenerInfo, args?: ArgsInfo) {
      return await this.securequ.listen(options, args)
   }
}

export default XansqlServer;  