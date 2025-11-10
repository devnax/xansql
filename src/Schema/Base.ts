import Foreign from "../core/classes/ForeignInfo";
import Xansql from "../core/Xansql";
import XqlIDField from "../Types/fields/IDField";
import { XansqlSchemaObject } from "../Types/types";
import { ErrorWhene } from "../utils";

type Relation = {
   type: "array" | "schema",
   column: string,
}

abstract class SchemaBase {
   readonly schema: XansqlSchemaObject;
   readonly table: string;
   readonly IDColumn: string = '';
   readonly columns: string[] = [];
   readonly relations: Relation[] = [];

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
            this.relations.push({ type: "array", column });
         } else {
            if (Foreign.isSchema(field)) {
               this.relations.push({ type: "schema", column });
            }
            this.columns.push(column);
         }
      }
      ErrorWhene(!this.IDColumn, `Schema ${this.table} must have an id column`);
   }

   isIDColumn(column: string): boolean {
      return column === this.IDColumn;
   }

   async drop() {
      ErrorWhene(typeof window !== "undefined", "This method can only be used on the server side.");
      await this.xansql.execute(`DROP TABLE IF EXISTS ${this.table}`);
   }

   async migrate(force = false) {
      if (typeof window !== "undefined") return;
      if (force) await this.drop();
      // await this.xansql.dialect.migrate(this as any);
   }
}

export default SchemaBase;