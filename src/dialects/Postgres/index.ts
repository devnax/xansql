import pkg from 'pg';
const { Pool } = pkg;

type ExecuteResult = {
   results: any;
   insertId: number;
   affectedRows: number;
};

const PostgresExecuter = (config: any) => {
   const pool = new Pool({
      host: config.host || 'localhost',
      user: config.user || 'postgres',
      password: config.password || '',
      database: config.database || '',
      port: config.port || 5432,
      max: config.connectionLimit || 10,
   });

   const execute = async (sql: string): Promise<ExecuteResult> => {
      const client = await pool.connect();
      try {
         const trimmed = sql.trim().toUpperCase();
         let results: any;
         let insertId = 0;
         let affectedRows = 0;

         if (trimmed.startsWith('SELECT')) {
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
   };

   return execute;
};

export default PostgresExecuter;
