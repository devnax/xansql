import { ArgsInfo } from "securequ";
import Schema from "../../Schema";
import { ExecuterResult } from "../type";
import Xansql from "../Xansql";

class ExecuteQuery {
   xansql: Xansql;
   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   async execute(sql: string, model: Schema, args?: ArgsInfo): Promise<ExecuterResult> {
      const xansql = this.xansql;
      sql = sql.trim().replaceAll(/\s+/g, ' ');
      let type = sql.split(' ')[0].toUpperCase();
      const cachePlugins = await xansql.cachePlugins();
      if (type === "SELECT") {
         for (let plugin of cachePlugins) {
            const cache = await plugin.cache(sql, model);
            if (cache) {
               return {
                  result: cache,
                  affectedRows: cache.length,
                  insertId: null
               };
            }
         }
      }

      // execute query
      let res: ExecuterResult | null = null;

      if (typeof window === "undefined") {
         res = await xansql.dialect.execute(sql);
      } else if (xansql.config.listenerConfig) {
         res = await xansql.executeClient(sql, model);
      }

      if (res && cachePlugins.length > 0) {
         for (let plugin of cachePlugins) {
            if (type === "SELECT") {
               res.result?.length && await plugin.onFind(sql, model, res.result)
            } else if (type === "INSERT") {
               res.insertId && await plugin.onCreate(model, res.insertId);
            } else if (type === "UPDATE") {
               res.result?.length && await plugin.onUpdate(model, res.result);
            } else if (type === "DELETE") {
               res.result?.length && await plugin.onDelete(model, res.result);
            } else if (['DROP', 'CREATE', 'ALTER', 'REPLACE'].includes(type)) {
               await plugin.clear(model);
            }
         }
      }

      return res as any
   }
}

export default ExecuteQuery;