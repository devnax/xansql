import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

class SqliteExcuter {
   private connectionURl: string = ''
   constructor(url: string) {
      this.connectionURl = url
   }

   async connect() {
      try {
         return await open({
            filename: this.connectionURl.replace("sqlite://", ""),
            driver: sqlite3.cached.Database
         })
      } catch (err) {
         console.error('Error: ', err);
      }
   }

   async execute(query: string) {
      const connection = await this.connect();
      if (!connection) {
         throw new Error("Sqlite database connection failed");
      }
      const result = await connection.run(query, params);
      await connection.close();
      return result
   }
}

export default SqliteExcuter;