import Model from "../../model";
import Column from "../../schema/core/Column";
import IDField from "../../schema/core/IDField";
import Relation from "../../schema/core/Relation";
import { XansqlDialectDriver } from "../../type";
import { formatValue, isServer } from "../../utils";
import BaseDialect from "../BaseDialect";

class SqliteDialect extends BaseDialect {
   driver: XansqlDialectDriver = "sqlite"
   private excuter: any;
   typeAcceptValue: string[] = []

   types: { [key: string]: string; } = {
      integer: "INTEGER",
      bigInteger: "BIGINT",
      decimal: "NUMERIC",
      float: "REAL",
      boolean: "INTEGER",
      tinyint: "INTEGER",

      string: "TEXT",
      text: "TEXT",

      date: "TEXT",
      time: "TEXT",
      datetime: "TEXT",
      timestamp: "TEXT",

      json: "TEXT",
      jsonb: "TEXT",
      binary: "BLOB",

      uuid: "TEXT",
      enum: "TEXT",
   }

   private getType(column: Column) {
      let type: any = this.types[column.type] || "TEXT";
      const value = column?.value;
      if (this.typeAcceptValue.includes(column.type) && value.length) {
         type += `(${value.join(',')})`;
      }
      return type
   };

   private constraints(name: string, column: Column, table: string) {
      const constraints = column.constraints;
      let footer: string[] = []
      let indexes = []

      let sql = '';
      sql += constraints.unique ? ' UNIQUE' : "";
      sql += constraints.null ? ' NULL' : ' NOT NULL'
      sql += constraints.unsigned ? ' UNSIGNED' : "";

      let _default = constraints.default;
      if (_default !== undefined) {
         sql += ` DEFAULT ${_default === 'CURRENT_TIMESTAMP' ? 'CURRENT_TIMESTAMP' : formatValue(_default)}`;
      }

      if (constraints.onUpdate) {
         delete constraints.onUpdate
         //sql += ` ON UPDATE ${constraints.onUpdate}`;
      }
      if (constraints.references) {
         const ref = constraints.references;
         let foreign = `FOREIGN KEY (${name}) REFERENCES ${ref.table}(${ref.column})`;
         // if (constraints.onDelete) foreign += ` ON DELETE ${constraints.onDelete}`;
         // if (constraints.onUpdate) foreign += ` ON UPDATE ${constraints.onUpdate}`;
         footer.push(foreign);
      }

      if (constraints.index) indexes.push(`CREATE INDEX IF NOT EXISTS ${name}_index ON ${table}(${name})`);
      if (constraints.check) sql += ` CHECK (${constraints.check})`;
      if (constraints.collate) sql += ` COLLATE ${constraints.collate}`;
      if (constraints.comment) {
         delete constraints.comment
      };

      return { sql: sql.trim(), footer, indexes }
   }

   buildSchema(model: Model): string {
      const schema = model.schema.get()
      const tableName = model.table
      let footer: string[] = []
      let indexes: string[] = []

      const columns = Object.keys(schema).map((key) => {
         key = key.toLowerCase();
         const column = schema[key];
         if (column instanceof Relation) return '';

         if (column instanceof IDField) {
            return `${key} INTEGER PRIMARY KEY AUTOINCREMENT`;
         }
         let c = this.constraints(key, column, model.table)
         footer = [...footer, ...c.footer]
         indexes = [...indexes, ...c.indexes]
         return `${key} ${this.getType(column)} ${c.sql}`;
      }).filter(Boolean).join(",\n");

      let sql = columns;
      if (footer.length) {
         sql += `,\n${footer.join(",\n")}`;
      }
      sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${sql}\n);`;
      if (indexes.length) {
         sql += `\n${indexes.join(";\n")};`;
      }
      sql += `\nPRAGMA foreign_keys = ON;`;
      sql += `\nPRAGMA journal_mode = WAL;`;

      return sql
   }

   async excute(sql: any) {
      if (isServer) {
         if (!this.excuter) {
            const mod = await import("./excuter");
            this.excuter = new mod.default(this.xansql.config);
         }
         return await this.excuter.excute(sql);
      }
   }

}

export default SqliteDialect