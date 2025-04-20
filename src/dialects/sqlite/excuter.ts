import sqlite3, { Database } from 'sqlite3';
import { open } from 'sqlite';
import { XansqlConfigOptions } from '../../type';

class Excuter {
   private config: XansqlConfigOptions;
   db: Database | null = null
   closeTimeout: NodeJS.Timeout | null = null
   constructor(config: XansqlConfigOptions) {
      this.config = config
      if (typeof config.connection !== 'string') {
         throw new Error("Invalid connection string");
      }
   }

   async connect() {
      if (this.db) return this.db
      const db = await open({
         filename: this.config.connection as string,
         driver: sqlite3.Database
      });
      this.db = db as any
      return db
   }

   async excute(query: string) {
      clearTimeout(this.closeTimeout as any)
      query = query.trim()
      let res;
      const db = await this.connect();
      if (query.startsWith('SELECT')) {
         const result: any = await db.all(query);
         res = {
            result: result,
            affectedRows: result.length,
            insertId: null,
         };
      } else {
         const result: any = await db.run(query);
         res = {
            result: null,
            affectedRows: result.changes,
            insertId: result.lastID,
         };
      }
      this.closeTimeout = setTimeout(async () => {
         await db.close();
         this.db = null
      }, 1000 * 60);
      return res
   }
}

export default Excuter;