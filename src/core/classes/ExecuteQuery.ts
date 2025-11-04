import { ExecuterResult } from "../type";
import Xansql from "../Xansql";

class ExecuteQuery {
   xansql: Xansql;
   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   async execute(sql: string): Promise<ExecuterResult> {
      const xansql = this.xansql;
      sql = sql.trim().replaceAll(/\s+/g, ' ');
      let res: ExecuterResult | null = null;

      if (typeof window !== "undefined" && xansql.config.fetch?.execute) {
         res = await xansql.config.fetch.execute(sql);
      } else {
         res = await xansql.dialect.execute(sql);
      }

      return res as any
   }
}

export default ExecuteQuery;