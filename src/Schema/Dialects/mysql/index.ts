import Column from "../../Column";
import { XansqlDataTypes, XansqlDataTypesMap } from "../../Column/types";
import { SchemaObject } from "../types";

class MysqlDialect {
   types: XansqlDataTypesMap = {
      integer: "INT",
      bigInteger: "BIGINT",
      decimal: "DECIMAL",
      float: "FLOAT",
      boolean: "TINYINT(1)",
      tinyint: "TINYINT",

      string: "VARCHAR",
      text: "TEXT",

      date: "DATE",
      time: "TIME",
      datetime: "DATETIME",
      timestamp: "TIMESTAMP",

      json: "JSON",
      jsonb: "JSON",
      binary: "BLOB",

      uuid: "CHAR(36)",
      enum: "ENUM",
   }

   schema: SchemaObject;
   footer: string[] = [];

   constructor(schema: SchemaObject) {
      this.schema = schema;
   }

   private getType(type: XansqlDataTypes) {
      return this.types[type];
   }

   constraintSql(column: Column, name: string): string {
      const constraints = column.constraints;
      let sql = '';
      if (constraints.primary) sql += ' PRIMARY KEY';
      if (constraints.unique) sql += ' UNIQUE'
      if (constraints.notNull) sql += ' NOT NULL'
      if (constraints.nullable === false) sql += ' NULL';
      if (constraints.unsigned) sql += ' UNSIGNED';
      if (constraints.default !== undefined) {
         if (constraints.default === 'CURRENT_TIMESTAMP') {
            sql += ` DEFAULT ${constraints.default}`;
         } else {
            if (typeof constraints.default === 'string') {
               sql += ` DEFAULT '${constraints.default}'`;
            } else if (typeof constraints.default === 'number') {
               sql += ` DEFAULT ${constraints.default}`;
            } else if (typeof constraints.default === 'boolean') {
               sql += ` DEFAULT ${constraints.default ? 1 : 0}`;
            } else {
               sql += ` DEFAULT ${constraints.default}`;
            }
         }
      }
      if (constraints.autoincrement) sql += ' AUTO_INCREMENT';

      if (constraints.references) {
         const ref = constraints.references;
         let forigen = `FOREIGN KEY (${name}) REFERENCES ${ref.table}(${ref.column})`;
         if (constraints.onDelete) forigen += ` ON DELETE ${constraints.onDelete}`;
         if (constraints.onUpdate) forigen += ` ON UPDATE ${constraints.onUpdate}`;
         this.footer.push(forigen);
      }

      if (constraints.index) {
         this.footer.push(`INDEX ${name}_index (${name})`);
      }

      return sql.trim();
   }


   columnSql(column: Column, name: string): string {
      let sql = `${name} ${this.getType(column.type)}`;
      if (column.values.length) {
         sql += `(${column.values.join(', ')})`;
      }
      return `${sql} ${this.constraintSql(column, name)}`.trim();
   }

   toSql(tableName: string): string {
      const columns = Object.keys(this.schema).map((key) => {
         const column = this.schema[key];
         return this.columnSql(column, key);
      }).join(",\n");

      let sql = `CREATE TABLE ${tableName} (\n${columns},`

      // add forigen keys
      if (this.footer.length) {
         sql += `\n${this.footer.join(",\n")}`
      }

      return `${sql}\n)`;

   }

}


export default MysqlDialect;