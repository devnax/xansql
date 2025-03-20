import Column from "../../Column";
import { XansqlDataTypes, XansqlDataTypesMap } from "../../Column/types";
import { SchemaObject } from "../types";

class PostpressDialect {
   types: XansqlDataTypesMap = {
      integer: "SERIAL",
      bigInteger: "BIGSERIAL",
      decimal: "DECIMAL",
      float: "REAL",
      boolean: "BOOLEAN",
      tinyint: "SMALLINT",

      string: "VARCHAR",
      text: "TEXT",

      date: "DATE",
      time: "TIME",
      datetime: "TIMESTAMP",
      timestamp: "TIMESTAMP",

      json: "JSON",
      jsonb: "JSONB",
      binary: "BYTEA",

      uuid: "UUID",
      enum: "TEXT CHECK (column IN (...))", // Emulating ENUM in PostgreSQL
   }

   schema: SchemaObject;
   forigenKeys: string[] = [];

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
      if (constraints.default !== undefined) sql += ` DEFAULT ${constraints.default}`;
      if (constraints.autoincrement) sql += ' AUTO_INCREMENT';
      if (constraints.index) sql += ` INDEX (${constraints.index})`;

      if (constraints.references) {
         const ref = constraints.references;
         let forigen = `FOREIGN KEY (${name}) REFERENCES ${ref.table}(${ref.column})`;
         if (constraints.onDelete) forigen += ` ON DELETE ${constraints.onDelete}`;
         if (constraints.onUpdate) forigen += ` ON UPDATE ${constraints.onUpdate}`;
         this.forigenKeys.push(forigen);
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


   }

}


export default PostpressDialect;