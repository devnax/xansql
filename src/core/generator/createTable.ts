import XqlArray from "../../Types/fields/Array";
import XqlBoolean from "../../Types/fields/Boolean";
import XqlDate from "../../Types/fields/Date";
import XqlEnum from "../../Types/fields/Enum";
import XqlFile from "../../Types/fields/File";
import XqlIDField from "../../Types/fields/IDField";
import XqlNumber from "../../Types/fields/Number";
import XqlObject from "../../Types/fields/Object";
import XqlRecord from "../../Types/fields/Record";
import XqlSchema from "../../Types/fields/Schema";
import XqlString from "../../Types/fields/String";
import XqlTuple from "../../Types/fields/Tuple";
import XqlUnion from "../../Types/fields/Union";
import { XqlFields } from "../../Types/types";
import Xansql from "../Xansql";

class CreateTableGenerator {
   xansql: Xansql;
   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   generate() {
      const engine = this.xansql.config.dialect.engine;
      const models = this.xansql.models;
      const tables = models.keys();
      const sqlStatements: string[] = [];

      for (const table of tables) {
         const model = models.get(table);
         const schema = model?.schema || {};
         let sqls: string[] = [];

         for (const column in schema) {
            const field = schema[column];
            const sql = this.buildColumn(column, field);
            sql && sqls.push(sql);
         }
         let sql = `CREATE TABLE IF NOT EXISTS ${engine === 'mysql' ? '`' + table + '`' : '"' + table + '"'} (\n`;
         sql += sqls.join(',\n');
         sql = sql.replace(/,\s*$/, '');
         sql += `\n);`;
         sqlStatements.push(sql);
      }
      return sqlStatements.join('\n\n');
   }

   buildColumn(column: string, field: XqlFields) {
      const engine = this.xansql.config.dialect.engine;
      const meta = field.meta || {};
      const nullable = meta.nullable || meta.optional ? 'NULL' : 'NOT NULL';
      const unique = meta.unique ? 'UNIQUE' : '';
      const col = (column: string, sqlType: string) => {
         return `  ${engine === 'mysql' ? '`' + column + '`' : '"' + column + '"'} ${sqlType} ${nullable} ${unique}`.trim()
      };
      let sql = ''
      if (field instanceof XqlIDField) {
         if (engine === 'mysql') {
            sql += col(column, "INT AUTO_INCREMENT PRIMARY KEY");
         } else if (engine === 'postgresql') {
            sql += col(column, "SERIAL PRIMARY KEY")
         } else if (engine === 'sqlite') {
            sql += col(column, "INTEGER PRIMARY KEY AUTOINCREMENT")
         } else if (engine === 'mssql') {
            sql += col(column, "INT IDENTITY(1,1) PRIMARY KEY")
         }
      } else if (field instanceof XqlSchema) {
         if (engine === 'mysql' || engine === 'mssql') {
            sql += col(column, "INT")
         } else if (engine === 'postgresql' || engine === 'sqlite') {
            sql += col(column, "INTEGER")
         }
      } else if (field instanceof XqlString) {
         let length = meta.length || meta.max
         if (meta.text || length > 65535 || engine === 'sqlite') {
            sql += col(column, "TEXT")
         } else {
            sql += col(column, `VARCHAR(${length || 255})`)
         }
      } else if (field instanceof XqlFile) {
         sql += col(column, "VARCHAR(255)")
      } else if (field instanceof XqlNumber) {
         if (engine === "mysql" || engine === "mssql") {
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
      } else if (field instanceof XqlBoolean) {
         if (engine === "mysql" || engine === "postgresql") {
            sql += col(column, "BOOLEAN")
         } else if (engine === "sqlite") {
            sql += col(column, "INTEGER") // SQLite has no BOOLEAN → use INTEGER (0/1)
         } else if (engine === "mssql") {
            sql += col(column, "BIT") // MSSQL uses BIT for boolean
         }
      } else if (field instanceof XqlDate) {
         if (engine === "mysql") {
            sql += col(column, "DATETIME")
         } else if (engine === "postgresql") {
            sql += col(column, "TIMESTAMP")
         } else if (engine === "sqlite") {
            sql += col(column, "TEXT") // store ISO string (SQLite has no native DATETIME)
         } else if (engine === "mssql") {
            sql += col(column, "DATETIME2")
         }
      } else if (field instanceof XqlEnum) {
         if (engine === "mysql") {
            sql += col(column, `ENUM(${(field as any).values.map((v: any) => `'${v}'`).join(', ')})`)
         } else if (engine === "postgresql") {
            const enumName = `${column}_enum`;
            sql += `CREATE TYPE ${enumName} AS ENUM (${(field as any).values.map((v: any) => `'${v}'`).join(', ')}); `
            sql += col(column, enumName)
         } else if (engine === "sqlite") {
            const values = (field as any).values.map((v: any) => `'${v}'`).join(", ");
            sql += `"${column}" TEXT CHECK("${column}" IN (${values})) ${nullable} ${unique}, `
         } else if (engine === "mssql") {
            const values = (field as any).values.map((v: any) => `'${v}'`).join(", ");
            sql += `"${column}" NVARCHAR(255) CHECK("${column}" IN (${values})) ${nullable} ${unique}, `
         }
      } else if (field instanceof XqlObject || field instanceof XqlRecord || field instanceof XqlTuple || field instanceof XqlUnion) {
         sql += col(column, "TEXT")
      } else if (field instanceof XqlArray) {
         const arrayType = (field as any).type;
         const isSchemaArray = arrayType instanceof XqlSchema;
         if (!isSchemaArray) {
            sql += col(column, "TEXT")
         }
      } else {
         throw new Error(`Unsupported field type for column ${column}`);
      }
      return sql;
   }
}

export default CreateTableGenerator;