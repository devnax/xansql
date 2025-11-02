import mysql from 'mysql2/promise';

type ExecuteResult = {
   results: any;
   insertId: number;
   affectedRows: number;
};

const MysqlExecuter = (config: mysql.PoolOptions) => {
   const pool = mysql.createPool({
      ...config,
      host: config.host || 'localhost',
      connectionLimit: config.connectionLimit || 10,
      waitForConnections: true,
      queueLimit: 0,
      namedPlaceholders: true,
   });

   const execute = async (sql: string, params: any[] = []): Promise<ExecuteResult> => {
      const [rows] = await pool.query(sql, params);

      return {
         results: rows,
         insertId: 'insertId' in rows ? rows.insertId || 0 : 0,
         affectedRows: 'affectedRows' in rows ? rows.affectedRows || 0 : 0,
      };
   };

   return execute;
};

export default MysqlExecuter;
