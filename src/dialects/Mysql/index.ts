import { PoolOptions } from 'mysql2';
import mysql from 'mysql2/promise';
import { ExecuterResult, XansqlDialectEngine } from '../../core/types';

const MysqlDialect = (config: PoolOptions) => {
   const pool = mysql.createPool(typeof config === 'string' ? { uri: config } : config);
   const execute = async (sql: string): Promise<ExecuterResult> => {
      const conn = await pool.getConnection();
      try {
         const [rows] = await conn.query(sql);
         const result: any = rows;
         return {
            results: result,
            insertId: result?.insertId ?? 0,
            affectedRows: result?.affectedRows ?? 0
         };
      } finally {
         conn.release();
      }
   };

   return {
      engine: 'mysql' as XansqlDialectEngine,
      execute
   };
};

export default MysqlDialect;