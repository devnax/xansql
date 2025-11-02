import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

type ExecuteResult = {
   results: any;
   insertId: number;
   affectedRows: number;
};

const SqliteExecuter = (filePath: string = ':memory:') => {

   let db: Database<sqlite3.Database, sqlite3.Statement>;
   const execute = async (sql: string): Promise<ExecuteResult> => {
      if (!db) {
         db = await open({
            filename: filePath,
            driver: sqlite3.Database
         });
      }
      const trimmed = sql.trim().toUpperCase();
      let results: any;
      let insertId = 0;
      let affectedRows = 0;

      if (trimmed.startsWith('SELECT')) {
         results = await db.all(sql);
      } else {
         const res = await db.run(sql);
         results = res;
         insertId = res.lastID || 0;
         affectedRows = res.changes || 0;
      }

      return { results, insertId, affectedRows };
   };

   return execute;
};

export default SqliteExecuter;
