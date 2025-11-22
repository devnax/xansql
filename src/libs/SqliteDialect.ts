import Database from 'better-sqlite3';
import { ExecuterResult, XansqlDialectSchemaType } from '../core/type';

let sqlite: typeof import('better-sqlite3');

const SqliteDialect = (filePath: string = ':memory:') => {
   let instance: Database.Database;
   const getDb = async () => {
      if (!sqlite) sqlite = (await import('better-sqlite3')).default;
      if (!instance) instance = new sqlite(filePath);
      return instance;
   }

   const execute = async (sql: string): Promise<ExecuterResult> => {
      if (typeof window === "undefined") {
         const db = await getDb()
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

   const getSchema = async () => {
      if (typeof window === "undefined") {
         const db = await getDb()
         const tablesRes = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`).all();
         const tables = tablesRes.map((row: any) => row.name);
         const schema: XansqlDialectSchemaType = {};

         for (const table of tables) {
            const columnsRes = db.prepare(`PRAGMA table_info(${table});`).all();
            const indexesRes = db.prepare(`PRAGMA index_list(${table});`).all();

            schema[table] = columnsRes.map((col: any) => ({
               name: col.name,
               type: col.type,
               notnull: col.notnull,
               default_value: col.dflt_value,
               pk: col.pk,
               index: indexesRes.some((idx: any) => {
                  const idxInfo = db.prepare(`PRAGMA index_info(${idx.name});`).all();
                  return idxInfo.some((info: any) => info.name === col.name);
               }),
               unique: indexesRes.some((idx: any) => idx.unique && (() => {
                  const idxInfo = db.prepare(`PRAGMA index_info(${idx.name});`).all();
                  return idxInfo.some((info: any) => info.name === col.name);
               })()),
            }));
         }
         return schema;
      }
   }

   return {
      engine: 'sqlite' as const,
      execute,
      getSchema
   };
};

export default SqliteDialect;
