import { PoolOptions } from 'mysql2';
import { ExecuterResult } from '../core/type';

let mysql: typeof import('mysql2/promise');

const MysqlDialect = (config: string | PoolOptions) => {
   let pool: import('mysql2/promise').Pool;

   const execute = async (sql: string, params: any[] = []): Promise<ExecuterResult> => {
      if (typeof window === 'undefined') {
         if (!mysql) mysql = await import('mysql2/promise')
         if (!pool) pool = mysql.createPool(typeof config === 'string' ? { uri: config } : config);

         const conn = await pool.getConnection();
         try {
            const [rows] = await conn.query(sql, params);
            return {
               results: rows as any,
               insertId: 'insertId' in rows ? rows.insertId || 0 : 0,
               affectedRows: 'affectedRows' in rows ? rows.affectedRows || 0 : 0,
            };
         } finally {
            conn.release();
         }
      }
      throw new Error('MysqlDialect can only be used in a Node.js environment.');
   };

   return {
      engine: 'mysql' as const,
      execute,
   };
};

export default MysqlDialect;
