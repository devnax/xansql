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
      const result: any = await connection.execute(query, params);
      await connection.end();
      return {
         rows: result[0],
         insertId: result[1].insertId,
         affectedRows: result[1].affectedRows
      }
   }
}

export default Excuter;