import XqlIDField from "../Types/fields/IDField";
import { XansqlSchemaObject } from "../Types/types";
import { ErrorWhene } from "../utils";
import Xansql from "../Xansql";

abstract class SchemaBase {
   readonly schema: XansqlSchemaObject;
   readonly table: string;
   readonly IDColumn: string = '';

   xansql: Xansql = null as any;
   alias: string = '';

   constructor(table: string, schema: XansqlSchemaObject) {
      this.table = table;
      this.schema = schema;
      for (let column in schema) {
         const field = schema[column];
         if (field instanceof XqlIDField) {
            ErrorWhene(this.IDColumn, `Schema ${this.table} can only have one ID column`);
            this.IDColumn = column;
         }
      }
      ErrorWhene(!this.IDColumn, `Schema ${this.table} must have an id column`);
   }

   async excute(sql: string): Promise<any> {
      return await this.xansql.excute(sql, this as any)
   }

   async drop() {
      ErrorWhene(typeof window !== "undefined", "This method can only be used on the server side.");
      await this.excute(`DROP TABLE IF EXISTS ${this.table}`);
   }


   async migrate(force = false) {
      if (typeof window !== "undefined") return;
      if (force) await this.drop();
      await this.xansql.dialect.migrate(this as any);
   }
}

export default SchemaBase;