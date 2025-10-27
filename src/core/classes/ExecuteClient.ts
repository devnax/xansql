import youid from "youid";
import Xansql from "../Xansql";
import Schema from "../../Schema";

let client: any = null;

class ExecuteClient {
   xansql: Xansql;
   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   async fetch(sql: string, model: Schema): Promise<any> {
      const { config } = this.xansql;
      if (typeof window !== "undefined") throw new Error("ExecuteClient.fetch method is not available in client side.");
      if (!config.listenerConfig?.client) return

      if (!client) {
         const mod = await import("securequ/client");
         client = new mod.default(config.listenerConfig.client);
      }

      if (!client) throw new Error("Xansql client configuration is not set. Please provide a client configuration in the XansqlConfig.");

      let type = sql.split(' ')[0].toUpperCase();

      let info = { table: model.table, sql };
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
   }
}

export default ExecuteClient;