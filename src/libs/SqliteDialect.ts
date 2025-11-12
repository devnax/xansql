import Database from 'better-sqlite3';
import { ExecuterResult } from '../core/type';

let sqlite: typeof import('better-sqlite3');

const SqliteDialect = (filePath: string = ':memory:') => {
   let db: Database.Database;

   const execute = async (sql: string): Promise<ExecuterResult> => {
      if (typeof window === "undefined") {
         if (!sqlite) sqlite = (await import('better-sqlite3')).default;
         if (!db) db = new sqlite(filePath);

         let results: any;
         let insertId = 0;
         let affectedRows = 0;

         // Detect query type
         if (sql.startsWith('SELECT')) {
            results = db.prepare(sql).all();
         } else {
            const stmt = db.prepare(sql);
            const info = stmt.run();
            results = info;
            insertId = info.lastInsertRowid ? Number(info.lastInsertRowid) : 0;
            affectedRows = info.changes || 0;
         }
         return { results, insertId, affectedRows };
      }

      throw new Error('SqliteDialect can only be used in a Node.js environment.');
   };

   return {
      engine: 'sqlite' as const,
      execute,
   };
};

export default SqliteDialect;
