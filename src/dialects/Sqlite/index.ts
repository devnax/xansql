import sqlite from 'better-sqlite3';
import { ExecuterResult } from '../../core/types';

const SqliteDialect = (filePath: string = ':memory:') => {
   const db = new sqlite(filePath)

   const execute = async (sql: string): Promise<ExecuterResult> => {
      let results: any;
      let insertId = 0;
      let affectedRows = 0;

      if (sql.trim().startsWith('SELECT')) {
         results = db.prepare(sql).all();
      } else {
         const stmt = db.prepare(sql);
         const info = stmt.run();
         results = info;
         insertId = info.lastInsertRowid ? Number(info.lastInsertRowid) : 0;
         affectedRows = info.changes || 0;
      }
      return { results, insertId, affectedRows };
   };


   return {
      engine: 'sqlite',
      execute
   };
};

export default SqliteDialect;