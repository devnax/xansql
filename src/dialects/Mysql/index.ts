import { PoolOptions } from 'mysql2';
import { ExecuterResult } from '../../core/type';


let mysql: typeof import('mysql2/promise');

const MysqlDialect = (config: string | PoolOptions) => {
   const isServer = typeof window === 'undefined';

   if (typeof config === 'object') {
      config = {
         ...config,
         host: config.host || 'localhost',
         connectionLimit: config.connectionLimit || 10,
         waitForConnections: true,
         queueLimit: 0,
         namedPlaceholders: true,
      }
   }
   let pool: import('mysql2/promise').Pool;

   const execute = async (sql: string, params: any[] = []): Promise<ExecuterResult> => {
      if (isServer) {
         if (!mysql) {
            mysql = await import('mysql2/promise');
         }
         if (!pool) {
            pool = mysql.createPool(typeof config === 'string' ? { uri: config } : config);
         }
      }
      const conn = await pool.getConnection();
      const [rows] = await conn.query(sql, params);
      conn.release();
      return {
         results: rows as any,
         insertId: 'insertId' in rows ? rows.insertId || 0 : 0,
         affectedRows: 'affectedRows' in rows ? rows.affectedRows || 0 : 0,
      };
   };

   return {
      engine: 'mysql' as const,
      execute,
   };
};

export default MysqlDialect;
