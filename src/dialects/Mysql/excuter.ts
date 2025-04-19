import mysql, { ConnectionOptions } from 'mysql2/promise';

class Excuter {
   private options: ConnectionOptions;
   constructor(options: ConnectionOptions) {
      this.options = options
   }

   async connect() {
      try {
         return await mysql.createConnection(this.options);
      } catch (err) {
         console.error('Error: ', err);
      }
   }

   async excute(query: string, params: any[] = []) {
      const connection = await this.connect();
      if (!connection) {
         throw new Error("Mysql database connection failed");
      }
      let [result, field]: any = await connection.execute(query, params) || {}
      await connection.end();
      return {
         result,
         insertId: field?.insertId || result?.insertId || 0,
         affectedRows: field?.affectedRows || result?.affectedRows,
      }
   }
}

export default Excuter;