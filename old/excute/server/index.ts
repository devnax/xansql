import xansql from "../..";

class ExcuteServer {
   xansql: xansql;
   driver: any;
   constructor(xansql: xansql) {
      this.xansql = xansql
   }

   async excute(sql: string) {
      if (!this.driver) {
         if (this.xansql.dialect === "mysql") {
            const excuter = await import("./Mysql");
            this.driver = new excuter.default(this.xansql.databaseUrl);
         } else if (this.xansql.dialect === "sqlite") {
            const excuter = await import("./Sqlite");
            this.driver = new excuter.default(this.xansql.databaseUrl);
         } else {
            throw new Error("Unsupported database URL");
         }
      }
      const result = await this.driver.execute(sql);
      return result
   }
}

export default ExcuteServer