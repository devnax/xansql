import { ColumnTypes, ColumnValue, ReferenceValue, SQLConstraints } from "../types";

export const columnTypes = [
   "integer",
   "bigInteger",
   "decimal",
   "float",
   "boolean",
   "tinyint",
   "string",
   "text",
   "date",
   "time",
   "datetime",
   "timestamp",
   "json",
   "jsonb",
   "binary",
   "uuid",
   "enum"
] as const


class Column {
   type: ColumnTypes;
   value: ColumnValue = [];
   constraints: SQLConstraints = {};

   constructor(type: ColumnTypes, value: ColumnValue = []) {
      this.type = type;
      this.value = value;
   }

   // autoincrement(): this {
   //    this.constraints.autoincrement = true;
   //    return this;
   // }
   // primaryKey(): this {
   //    this.constraints.primaryKey = true;
   //    return this;
   // }

   // Set a default value for the column
   default(value: any, onUpdateTimeStamp?: boolean): this {
      this.constraints.default = value;
      if (onUpdateTimeStamp) {
         this.constraints.onUpdate = "CURRENT_TIMESTAMP"; // MySQL-specific behavior
      }
      this.null()
      return this;
   }



   // Define a foreign key reference with related constraints
   references(table: string, column: string): this {
      this.constraints.references = { table, column };
      this.index();
      return this;
   }

   onUpdateCurrentTimestamp() {
      this.constraints.onUpdate = "CURRENT_TIMESTAMP";
      return this;
   }

   // Mark the column as unique
   unique(): this {
      this.constraints.unique = true;
      return this;
   }

   // Mark the column as not nullable
   null(is = true): this {
      this.constraints.null = is;
      return this;
   }

   // Mark the column as unsigned
   unsigned(): this {
      this.constraints.unsigned = true;
      return this;
   }

   // Add an index to the column
   index(): this {
      this.constraints.index = true;
      return this;
   }

   // Add a CHECK constraint to validate column values
   check(condition: string): this {
      this.constraints.check = condition;
      return this;
   }

   // Specify a collation for the column
   collate(collation: string): this {
      this.constraints.collate = collation;
      return this;
   }

   // Add a comment/description for the column
   comment(description: string): this {
      this.constraints.comment = description;
      return this;
   }

   onDelete(value: ReferenceValue) {
      this.constraints.onDelete = value;
      return this
   }
   onUpdate(value: ReferenceValue) {
      this.constraints.onUpdate = value;
      return this
   }
   onCascade() {
      this.constraints.onDelete = "CASCADE";
      this.constraints.onUpdate = "CASCADE";
      return this
   }
   onRestrict() {
      this.constraints.onDelete = "RESTRICT";
      this.constraints.onUpdate = "RESTRICT";
      return this
   }
   onSetNull() {
      this.constraints.onDelete = "SET NULL";
      this.constraints.onUpdate = "SET NULL";
      return this
   }
   onSetDefault() {
      this.constraints.onDelete = "SET DEFAULT";
      this.constraints.onUpdate = "SET DEFAULT";
      return this
   }
}

export default Column;