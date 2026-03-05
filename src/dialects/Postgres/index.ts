import postgres, { PoolConfig } from "pg";
import { ExecuterResult } from "../../core/types";

const PostgresDialect = (config: PoolConfig) => {
   const pool = new postgres.Pool(config);

   const execute = async (sql: string): Promise<ExecuterResult> => {
      const client = await pool.connect();
      try {
         const res = await client.query(sql);

         const results = res.rows ?? [];
         const affectedRows = res.rowCount ?? 0;

         return {
            results,
            insertId: undefined as any, // let upper layer decide
            affectedRows
         };
      } finally {
         client.release();
      }
   };

   return {
      engine: "postgres",
      execute
   };
};

export default PostgresDialect;