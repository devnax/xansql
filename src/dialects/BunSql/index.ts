import { ExecuterResult, XansqlDialectEngine } from '../../core/type';

let bun: typeof import('bun');

const BunSqlDialect = (config: string, engine: XansqlDialectEngine) => {
   let query: import('bun').SQL;

   const execute = async (sql: string): Promise<ExecuterResult> => {
      if (typeof window !== 'undefined') {
         throw new Error('BunSqlDialect can only be used in a Bun environment.');
      }

      if (!bun) bun = await import('bun');
      if (!query) query = new bun.SQL(config);

      const result = await query(sql);
      const rows = result?.rows ?? result ?? [];

      return {
         results: Array.isArray(rows) ? rows : [],
         insertId: (result.insertId ?? result.lastInsertRowid) || 0,
         affectedRows: (result.affectedRows ?? result.changes ?? (Array.isArray(rows) ? rows.length : 0)),
      };
   };

   return {
      engine,
      execute,
   };
};

export default BunSqlDialect;
