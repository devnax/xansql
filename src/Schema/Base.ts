import XqlIDField from "../Types/fields/IDField";
import { XansqlSchemaObject } from "../Types/types";
import { ErrorWhene } from "../utils";
import Xansql from "../Xansql";
import Foreign from "./include/Foreign";

abstract class SchemaBase {
   readonly schema: XansqlSchemaObject;
   readonly table: string;
   readonly IDColumn: string = '';
   readonly columns: string[] = [];
   readonly relations: string[] = [];

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

         if (Foreign.isArray(field)) {
            this.relations.push(column);
         } else {
            if (Foreign.isSchema(field)) {
               this.relations.push(column)
            }
            this.columns.push(column);
         }
      }
      ErrorWhene(!this.IDColumn, `Schema ${this.table} must have an id column`);
   }

   isIDColumn(column: string): boolean {
      return column === this.IDColumn;
   }

   async execute(sql: string): Promise<any> {
      return await this.xansql.execute(sql, this as any)
   }

   async drop() {
      ErrorWhene(typeof window !== "undefined", "This method can only be used on the server side.");
      await this.execute(`DROP TABLE IF EXISTS ${this.table}`);
   }

   async migrate(force = false) {
      if (typeof window !== "undefined") return;
      if (force) await this.drop();
      await this.xansql.dialect.migrate(this as any);
   }
}

export default SchemaBase;