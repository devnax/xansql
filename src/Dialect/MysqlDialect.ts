import { PoolOptions } from 'mysql2';
import { ExecuterResult } from '../core/type';

let mysql: typeof import('mysql2/promise');

const MysqlDialect = (config: string | PoolOptions) => {
   let pool: import('mysql2/promise').Pool;

   const getConnection = async () => {
      if (!mysql) mysql = await import('mysql2/promise')
      if (!pool) pool = mysql.createPool(typeof config === 'string' ? { uri: config } : config);
      return pool.getConnection()
   }

   const execute = async (sql: string, params: any[] = []): Promise<ExecuterResult> => {
      if (typeof window === 'undefined') {
         const conn = await getConnection();
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

   const getSchema = async () => {
      const conn = await getConnection()
      const [tablesRes] = await conn.query<any[]>(
         `SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE();`
      );

      const schema: Record<string, any[]> = {};

      for (const row of tablesRes) {
         const table = row.TABLE_NAME;
         schema[table] = [];

         // Get columns
         const [columns] = await conn.query<any[]>(
            `SELECT 
              COLUMN_NAME as name,
              COLUMN_TYPE as type,
              IS_NULLABLE,
              COLUMN_DEFAULT,
              COLUMN_KEY
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = '${table}'`
         );

         // Get indexes
         const [indexes] = await conn.query<any[]>(
            `SHOW INDEX FROM \`${table}\``
         );

         for (const col of columns) {
            const colName = col.name;
            const isPrimary = col.COLUMN_KEY === "PRI";
            const isIndexed = indexes.some(i => i.Column_name === colName);
            const isUnique = indexes.some(i => i.Column_name === colName && i.Non_unique === 0);

            schema[table].push({
               name: colName,
               type: col.type,
               notnull: col.IS_NULLABLE === "NO",
               default_value: col.COLUMN_DEFAULT,
               pk: isPrimary,
               index: isIndexed,
               unique: isUnique
            });
         }
      }

      return schema;
   };


   return {
      engine: 'mysql' as const,
      execute,
      getSchema
   };
};

export default MysqlDialect;
