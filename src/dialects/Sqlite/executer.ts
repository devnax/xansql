import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { XansqlConfigOptions } from '../../type';

class Executer {
   private config: XansqlConfigOptions;
   db: any;
   timer: any;
   constructor(config: XansqlConfigOptions) {
      this.config = config
      if (typeof config.connection !== 'string') {
         throw new Error("Invalid connection string");
      }
   }

   async connect() {
      if (this.timer !== null) {
         clearTimeout(this.timer);
         this.timer = null;
      }
      if (this.db) return this.db;
      const db = await open({
         filename: this.config.connection as string,
         driver: sqlite3.Database
      });
      this.db = db;
      this.timer = setTimeout(() => {
         this.db?.close();
         this.db = null;
      }, 1000 * 60 * 5); // 5 minutes
      return db
   }

   async execute(query: string) {
      query = query.trim()
      let res;
      const db = await this.connect();
      if (query.startsWith('SELECT')) {
         const result: any = await db.all(query);
         res = {
            result,
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
      return res
   }
}

export default Executer;