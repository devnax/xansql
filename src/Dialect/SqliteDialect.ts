import sqlite from 'better-sqlite3';
import { ExecuterResult, XansqlDialectSchemaType, XansqlFileConfig } from '../core/types';

const SqliteDialect = (filePath: string = ':memory:', file?: XansqlFileConfig) => {
   const db = new sqlite(filePath)

   const execute = async (sql: string): Promise<ExecuterResult> => {
      let results: any;
      let insertId = 0;
      let affectedRows = 0;

      // Detect query type
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

   const getSchema = async () => {
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

   return {
      engine: 'sqlite' as const,
      execute,
      getSchema,
      file
   };
};

export default SqliteDialect;
