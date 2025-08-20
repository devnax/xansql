import XqlIDField from "../Types/fields/IDField";
import XqlJoin from "../Types/fields/Join";
import { XansqlSchemaObject } from "../Types/types";
import Xansql from "../Xansql";

abstract class SchemaBase {
   readonly schema: XansqlSchemaObject;
   readonly table: string;
   readonly IDColumn: string = '';
   readonly columns = {
      main: [] as string[],
      relation: [] as string[],
   }

   xansql: Xansql = null as any;
   alias: string = '';

   constructor(table: string, schema: XansqlSchemaObject) {
      this.table = table;
      this.schema = schema;
      for (let column in schema) {
         const field = schema[column];
         if (field instanceof XqlIDField) {
            if (this.IDColumn) {
               throw new Error(`Schema ${this.table} can only have one ID column`);
            }
            this.IDColumn = column;
         }

         if (field instanceof XqlJoin) {
            this.columns.relation.push(column);
         } else {
            this.columns.main.push(column);
         }
      }
      if (!this.IDColumn) {
         throw new Error(`Schema ${this.table} must have an id column`);
      }
   }

   async excute(sql: string): Promise<any> {
      return await this.xansql.excute(sql, this as any)
   }

   async drop() {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      await this.excute(`DROP TABLE IF EXISTS ${this.table}`);
   }

}

export default SchemaBase;