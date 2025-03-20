import { SQLOnDelete } from "./types";

class Relation {
   table: string;
   column: string
   constraints: any = {
      onDelete: null,
      onUpdate: null
   }

   constructor(table: string, column: string) {
      this.table = table;
      this.column = column;
   }

   onDelete(value: SQLOnDelete): this {
      this.constraints.onDelete = value;
      return this;
   }

   onUpdate(value: any): this {
      this.constraints.onUpdate = value;
      return this;
   }

   toSql(foreignKey: string) {
      let sql = `FOREIGN KEY (${foreignKey}) REFERENCES ${this.table}(${this.column})`;
      if (this.constraints.onDelete) {
         sql += ` ON DELETE ${this.constraints.onDelete}`;
      }
      if (this.constraints.onUpdate) {
         sql += ` ON UPDATE ${this.constraints.onUpdate}`;
      }
      return sql;
   }
}

export default Relation