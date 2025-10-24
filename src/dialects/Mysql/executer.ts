import mysql from 'mysql2/promise';
import { XansqlConfigOptions } from '../../type';
import { isArray } from '../../utils';

class Executer {
   private config: XansqlConfigOptions;
   db: any;
   timer: any;

   constructor(config: XansqlConfigOptions) {
      this.config = config
   }

   async connect() {
      if (this.timer !== null) {
         clearTimeout(this.timer);
         this.timer = null;
      }
      if (this.db) return this.db;
      try {
         let options = typeof this.config.connection === 'string' ? { uri: this.config.connection } : this.config.connection;
         let db = await mysql.createConnection(options);
         this.db = db;
         this.timer = setTimeout(() => {
            this.db?.end();
            this.db = null;
         }, 1000 * 60 * 5); // 5 minutes
         return db;
      } catch (err) {
         console.error('Error: ', err);
      }
   }

   async execute(query: string) {
      const connection = await this.connect();
      if (!connection) {
         throw new Error("Mysql database connection failed");
      }
      let [result, field]: any = await connection.execute(query) || {}
      return {
         result: isArray(result) ? result : null,
         insertId: field?.insertId || result?.insertId || 0,
         affectedRows: field?.affectedRows || result?.affectedRows,
      }
   }
}

export default Executer;