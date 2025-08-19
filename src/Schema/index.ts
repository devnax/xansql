import SchemaBase from "./Base";

class Schema extends SchemaBase {

   async excute(sql: string): Promise<any> {
      return await this.xansql.excute(sql, this as any)
   }

   async drop() {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      await this.excute(`DROP TABLE IF EXISTS ${this.table}`);
   }

   async migrate(force = false) {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      if (force) {
         await this.drop();
      }
      const dialect = this.xansql.dialect
      const sql = dialect.buildSchema(this);
      await this.excute(sql)
   }

   find() {

   }
}

export default Schema;
