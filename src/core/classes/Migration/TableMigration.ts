import Model from "../../../model";
import XqlArray from "../../../xt/fields/Array";
import XqlBoolean from "../../../xt/fields/Boolean";
import XqlDate from "../../../xt/fields/Date";
import XqlEnum from "../../../xt/fields/Enum";
import XqlFile from "../../../xt/fields/File";
import XqlIDField from "../../../xt/fields/IDField";
import XqlNumber from "../../../xt/fields/Number";
import XqlObject from "../../../xt/fields/Object";
import XqlRecord from "../../../xt/fields/Record";
import XqlSchema from "../../../xt/fields/Schema";
import XqlString from "../../../xt/fields/String";
import XqlTuple from "../../../xt/fields/Tuple";
import XqlUnion from "../../../xt/fields/Union";
import { escapeSqlValue, iof, quote } from "../../../utils";
import Xansql from "../../Xansql";
import XansqlError from "../../XansqlError";
import Foreign from "../ForeignInfo";
import ForeignKeyMigration from "./ForeingMigration";
import IndexMigration from "./IndexMigration";

class Migration {
   xansql: Xansql;
   readonly ForeignKeyMigration: ForeignKeyMigration
   readonly IndexMigration: IndexMigration
   constructor(xansql: Xansql) {
      this.xansql = xansql;
      this.ForeignKeyMigration = new ForeignKeyMigration(xansql);
      this.IndexMigration = new IndexMigration(xansql);
   }

   statements() {
      const engine = this.xansql.config.dialect.engine;
      const models = this.xansql.models;

      const options: string[] = []
      const tables: ({ table: string, sql: string })[] = [];
      const indexes: ({ table: string, sql: string })[] = [];

      if (engine === 'sqlite') {
         options.push(`PRAGMA foreign_keys = ON;`);
         options.push(`PRAGMA journal_mode = WAL;`);
         options.push(`PRAGMA wal_autocheckpoint = 1000;`);
         options.push(`PRAGMA synchronous = NORMAL;`);
      } else if (engine === 'postgresql') {
         options.push(`SET client_min_messages TO WARNING;`);
         options.push(`SET standard_conforming_strings = ON;`);
      } else if (engine === 'mysql') {
         options.push(`SET sql_mode = 'STRICT_ALL_TABLES';`);
         options.push(`SET FOREIGN_KEY_CHECKS = 1;`);
         options.push(`SET sql_safe_updates = 1;`);
      }

      for (const table of models.keys()) {
         const model = models.get(table);
         const { sql, indexes: modelIndexes } = this.buildCreate(model!);
         indexes.push(...modelIndexes);
         tables.push({
            table,
            sql
         });
      }

      return {
         options,
         tables,
         indexes
      }
   }

   buildCreate(model: Model) {
      const engine = this.xansql.config.dialect.engine;
      let indexes: ({ table: string, sql: string })[] = [];
      const table = model.table;
      const schema = model?.schema || {};
      let sqls: string[] = [];

      for (const column in schema) {
         const field = schema[column];
         const meta = field.meta || {};
         const sql = this.buildColumn(table, column);
         sql && sqls.push(sql);

         if (Foreign.isSchema(field)) {
            const info = Foreign.get(model!, column)
            const fk = this.ForeignKeyMigration.buildCreate(table, column, info.table, info.relation.main);
            if (fk) {
               sqls.push(fk);
            }
         }

         if (meta.index && !meta.unique) {
            const indexSql = this.IndexMigration.buildCreate(table, column);
            indexes.push({ table, sql: indexSql });
         }
      }

      let sql = `CREATE TABLE IF NOT EXISTS ${quote(engine, table)} (${sqls.join(',')})`;
      if (engine === 'mysql') {
         sql += ` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
      } else {
         sql += ` ;`;
      }

      return {
         sql,
         indexes
      }
   }

   buildDrop(model: any) {
      const engine = this.xansql.config.dialect.engine;
      const table = model.table;
      let sql = `DROP TABLE IF EXISTS ${quote(engine, table)};`;
      return sql;
   }

   buildColumn(table: string, column: string) {
      const engine = this.xansql.config.dialect.engine;
      const model = this.xansql.models.get(table) as Model;
      const field = model.schema[column];
      const meta = field.meta || {};
      const nullable = meta.nullable || meta.optional ? 'NULL' : 'NOT NULL';
      const unique = meta.unique ? 'UNIQUE' : '';
      const col = (column: string, sqlType: string) => {
         return `  ${quote(engine, column)} ${sqlType} ${nullable} ${unique}`.trim()
      };
      let sql = ''
      if (iof(field, XqlIDField)) {
         if (engine === 'mysql') {
            sql += col(column, "INT AUTO_INCREMENT PRIMARY KEY");
         } else if (engine === 'postgresql') {
            sql += col(column, "SERIAL PRIMARY KEY")
         } else if (engine === 'sqlite') {
            sql += col(column, "INTEGER PRIMARY KEY AUTOINCREMENT")
         }
      } else if (iof(field, XqlSchema)) {
         if (engine === 'mysql') {
            sql += col(column, "INT")
         } else if (engine === 'postgresql' || engine === 'sqlite') {
            sql += col(column, "INTEGER")
         }
      } else if (iof(field, XqlString)) {
         let length = meta.length || meta.max
         if (meta.text || length > 65535 || engine === 'sqlite') {
            sql += col(column, "TEXT")
         } else {
            sql += col(column, `VARCHAR(${length || 255})`)
         }
      } else if (iof(field, XqlFile)) {
         sql += col(column, "VARCHAR(255)")
      } else if (iof(field, XqlNumber)) {
         if (engine === "mysql") {
            if (meta.integer) {
               sql += col(column, "INT")
            } else if (meta.float) {
               sql += col(column, "FLOAT")
            } else {
               sql += col(column, "DECIMAL(10, 2)")
            }
         } else if (engine === "postgresql" || engine === "sqlite") {
            if (meta.integer) {
               sql += col(column, "INTEGER")
            } else if (meta.float) {
               sql += col(column, "REAL")
            } else {
               sql += col(column, engine === "sqlite" ? "NUMERIC" : "NUMERIC(10, 2)")
            }
         }
      } else if (iof(field, XqlBoolean)) {
         if (engine === "mysql" || engine === "postgresql") {
            sql += col(column, "BOOLEAN")
         } else if (engine === "sqlite") {
            sql += col(column, "INTEGER") // SQLite has no BOOLEAN → use INTEGER (0/1)
         }
      } else if (iof(field, XqlDate)) {
         if (engine === "mysql") {
            sql += col(column, "DATETIME")
         } else if (engine === "postgresql") {
            sql += col(column, "TIMESTAMP")
         } else if (engine === "sqlite") {
            sql += col(column, "TEXT") // store ISO string (SQLite has no native DATETIME)
         }
      } else if (iof(field, XqlEnum)) {
         if (engine === "mysql") {
            sql += col(column, `ENUM(${(field as any).values.map((v: any) => `'${escapeSqlValue(v)}'`).join(', ')})`)
         } else if (engine === "postgresql") {
            const enumName = `${table}_${column}_enum`;
            sql += `CREATE TYPE ${enumName} AS ENUM (${(field as any).values.map((v: any) => `'${escapeSqlValue(v)}'`).join(', ')}); `
            sql += col(column, enumName)
         } else if (engine === "sqlite") {
            const values = (field as any).values.map((v: any) => `'${escapeSqlValue(v)}'`).join(", ");
            sql += `"${column}" TEXT CHECK("${column}" IN (${values})) ${nullable} ${unique}, `
         }
      } else if (iof(field, XqlObject, XqlRecord, XqlTuple, XqlUnion)) {
         sql += col(column, "TEXT")
      } else if (iof(field, XqlArray)) {
         const arrayType = (field as any).type;
         const isSchemaArray = iof(arrayType, XqlSchema)
         if (!isSchemaArray) {
            sql += col(column, "TEXT")
         }
      } else {
         throw new XansqlError({
            message: `Unsupported field type for column "${column}" in table "${table}".`,
            model: table,
            column
         });
      }
      return sql;
   }
}

export default Migration