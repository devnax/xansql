import { SQLConstraints } from "./types";

class Constraints {
   constraints: SQLConstraints = {}

   // toSqlConstraint(column: string, dialect: DialectTypes): string {
   //    let sql = '';

   //    if (this.constraints.primary) {
   //       sql += ' PRIMARY KEY';
   //    }

   //    if (this.constraints.references) {
   //       let ref = this.constraints.references
   //       sql += ` FOREIGN KEY REFERENCES ${ref.table}(${ref.column})`;
   //    }

   //    if (this.constraints.unique) {
   //       sql += ' UNIQUE';
   //    }

   //    if (this.constraints.notNull) {
   //       sql += ' NOT NULL';
   //    }

   //    if (this.constraints.check) {
   //       sql += ` CHECK (${this.constraints.check})`;
   //    }

   //    if (this.constraints.default) {
   //       sql += ` DEFAULT ${this.constraints.default}`;
   //    }

   //    if (this.constraints.nullable) {
   //       sql += ' NULL';
   //    }

   //    if (this.constraints.unsigned && dialect === 'mysql') {
   //       sql += ' UNSIGNED';
   //    }

   //    if (this.constraints.autoincrement) {
   //       if (dialect === 'mysql') {
   //          sql += ' AUTO_INCREMENT';
   //       } else if (dialect === 'sqlite') {
   //          sql += ' AUTOINCREMENT';
   //       } else if (dialect === 'postgres') {
   //          sql += ' ';
   //       } else if (dialect === 'mssql') {
   //          sql += ' IDENTITY(1,1)';
   //       }
   //    }

   //    if (this.constraints.identity && dialect === 'mssql') {
   //       sql += ' IDENTITY(1,1)';
   //    }

   //    if (this.constraints.index) {
   //       sql += ` INDEX ${this.constraints.index}`;
   //    }

   //    if (this.constraints.fulltext && dialect === 'mysql') {
   //       sql += ` FULLTEXT ${this.constraints.fulltext}`;
   //    }

   //    if (this.constraints.generated && dialect === 'postgres') {
   //       sql += ` GENERATED ALWAYS AS (${this.constraints.generated})`;
   //    }

   //    if (this.constraints.exclude && dialect === 'postgres') {
   //       sql += ` EXCLUDE ${this.constraints.exclude}`;
   //    }

   //    if (this.constraints.onDelete) {
   //       sql += ` ON DELETE ${this.constraints.onDelete}`;
   //    }

   //    if (this.constraints.onUpdate) {
   //       sql += ` ON UPDATE ${this.constraints.onUpdate}`;
   //    }

   //    if (this.constraints.deferrable && dialect === 'postgres') {
   //       sql += ' DEFERRABLE';
   //    }

   //    if (this.constraints.initiallyDeferred && dialect === 'postgres') {
   //       sql += ' INITIALLY DEFERRED';
   //    }

   //    if (this.constraints.partitionBy && dialect === 'postgres') {
   //       sql += ` PARTITION BY ${this.constraints.partitionBy}`;
   //    }

   //    if (this.constraints.setNull) {
   //       sql += ' SET NULL';
   //    }

   //    if (this.constraints.setNullOnUpdate) {
   //       sql += ' SET NULL ON UPDATE';
   //    }

   //    return sql.trim();
   // }

   primary(): this {
      this.constraints.primary = true;
      return this;
   }

   references(table: string, column: string): this {
      this.constraints.references = { table, column };
      return this;
   }

   unique(): this {
      this.constraints.unique = true;
      return this;
   }

   notNull(): this {
      this.constraints.notNull = true;
      return this;
   }


   default(value: any): this {
      this.constraints.default = value;
      return this;
   }

   nullable(): this {
      this.constraints.nullable = true;
      return this;
   }

   unsigned(): this {
      this.constraints.unsigned = true;
      return this;
   }

   autoincrement(): this {
      this.constraints.autoincrement = true;
      return this;
   }

   index(value: string): this {
      this.constraints.index = value;
      return this;
   }

   onDelete(value: string): this {
      this.constraints.onDelete = value;
      return this;
   }

   onUpdate(value: any): this {
      this.constraints.onUpdate = value;
      return this;
   }
}

export default Constraints