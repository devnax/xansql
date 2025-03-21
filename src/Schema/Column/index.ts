import { ColumnTypes, ColumnValue, ReferenceValue, SQLConstraints } from "./types";


class Column {
   type: ColumnTypes;
   value: ColumnValue = [];
   constraints: SQLConstraints = {
      autoincrement: false,
      primaryKey: false,
      unique: false,
      notNull: false,
      unsigned: false,
      index: null,
      default: null,
      references: null,
      onDelete: null,
      onUpdate: null,
      check: null,
      collate: null,
      comment: null,
   };

   constructor(type: ColumnTypes, value: ColumnValue = []) {
      this.type = type;
      this.value = value;
   }

   // Enable auto-increment for the column
   autoincrement(): this {
      this.constraints.autoincrement = true;
      return this;
   }

   // Set a default value for the column
   default(value: any, onUpdateTimeStamp?: boolean): this {
      this.constraints.default = value;
      if (onUpdateTimeStamp) {
         this.constraints.onUpdate = "CURRENT_TIMESTAMP"; // MySQL-specific behavior
      }
      return this;
   }

   // Mark the column as a primary key
   primaryKey(): this {
      this.constraints.primaryKey = true;
      return this;
   }

   // Define a foreign key reference with related constraints
   references(table: string, column: string): this {
      this.constraints.references = { table, column };
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
   notNull(): this {
      this.constraints.notNull = true;
      return this;
   }

   // Mark the column as unsigned
   unsigned(): this {
      this.constraints.unsigned = true;
      return this;
   }

   // Add an index to the column
   index(value: string): this {
      this.constraints.index = value;
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