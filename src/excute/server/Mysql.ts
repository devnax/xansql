import mysql from 'mysql2/promise';

class MysqlExcuter {
   private connectionURl: string = ''
   constructor(url: string) {
      this.connectionURl = url
   }

   async connect() {
      try {
         return await mysql.createConnection(this.connectionURl);
      } catch (err) {
         console.error('Error: ', err);
      }
   }

   async execute(query: string, params: any[] = []) {
      const connection = await this.connect();
      if (!connection) {
         throw new Error("Mysql database connection failed");
      }
      const result = await connection.execute(query, params);
      await connection.end();
      return result
   }
}

export default MysqlExcuter;