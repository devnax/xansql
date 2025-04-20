import mysql from 'mysql2/promise';
import { XansqlConfigOptions } from '../../type';

class Excuter {
   private config: XansqlConfigOptions;
   constructor(config: XansqlConfigOptions) {
      this.config = config
   }

   async connect() {
      try {
         let options = typeof this.config.connection === 'string' ? { uri: this.config.connection } : this.config.connection;
         return await mysql.createConnection(options);
      } catch (err) {
         console.error('Error: ', err);
      }
   }

   async excute(query: string) {
      const connection = await this.connect();
      if (!connection) {
         throw new Error("Mysql database connection failed");
      }
      let [result, field]: any = await connection.execute(query) || {}
      await connection.end();
      return {
         result,
         insertId: field?.insertId || result?.insertId || 0,
         affectedRows: field?.affectedRows || result?.affectedRows,
      }
   }
}

export default Excuter;