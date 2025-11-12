import { PoolConfig } from 'pg';
import { ExecuterResult } from '../core/type';

let postpres: typeof import('pg');

const PostgresDialect = (config: PoolConfig) => {
   let pool: import('pg').Pool;

   const execute = async (sql: string): Promise<ExecuterResult> => {
      if (typeof window === 'undefined') {
         if (!postpres) postpres = await import('pg')
         if (!pool) pool = new postpres.Pool(config);

         const client = await pool.connect();
         try {
            let results: any;
            let insertId = 0;
            let affectedRows = 0;

            if (sql.startsWith('SELECT')) {
               const res = await client.query(sql);
               results = res.rows;
               affectedRows = res.rowCount || 0;
            } else {
               const res = await client.query(sql + ' RETURNING *'); // capture inserted rows
               results = res.rows;
               affectedRows = res.rowCount || 0;
               if (results[0] && 'id' in results[0]) {
                  insertId = results[0].id; // assumes primary key column is `id`
               }
            }
            return { results, insertId, affectedRows };
         } finally {
            client.release();
         }
      }
      throw new Error("PostgresDialect can only be used in a Node.js environment.");
   };

   return {
      engine: 'postgres' as const,
      execute,
   };
};

export default PostgresDialect;
