import SchemaBase from "./Base";

class Schema extends SchemaBase {

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
