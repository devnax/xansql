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
import { quote } from "../../utils";
import Foreign from "../classes/ForeignInfo";
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

      if (engine === 'mssql') {
         sqlStatements.push(`SET ANSI_NULLS ON;`);
         sqlStatements.push(`SET QUOTED_IDENTIFIER ON;`);
      } else if (engine === 'sqlite') {
         sqlStatements.push(`PRAGMA foreign_keys = ON;`);
         sqlStatements.push(`PRAGMA journal_mode = WAL;`);
         sqlStatements.push(`PRAGMA wal_autocheckpoint = 1000;`);
         sqlStatements.push(`PRAGMA synchronous = NORMAL;`);
      } else if (engine === 'postgresql') {
         sqlStatements.push(`SET client_min_messages TO WARNING;`);
         sqlStatements.push(`SET standard_conforming_strings = ON;`);
      } else if (engine === 'mysql') {
         sqlStatements.push(`SET sql_mode = 'STRICT_ALL_TABLES';`);
         sqlStatements.push(`SET FOREIGN_KEY_CHECKS = 1;`);
         sqlStatements.push(`SET sql_safe_updates = 1;`);
      }

      let indexes: string[] = [];

      for (const table of tables) {
         const model = models.get(table);
         const schema = model?.schema || {};
         let sqls: string[] = [];
         let foreignKeys: string[] = [];

         for (const column in schema) {
            const field = schema[column];
            const meta = field.meta || {};
            const sql = this.buildColumn(column, field);
            sql && sqls.push(sql);

            // Handle foreign keys for XqlSchema fields
            if (Foreign.isSchema(field)) {
               const isOptional = meta.nullable || meta.optional;
               const info = Foreign.get(model!, column)
               let foreign = `FOREIGN KEY (${quote(engine, column)}) REFERENCES ${quote(engine, info.table)}(${quote(engine, info.relation.main)})`;
               if (isOptional) {
                  foreign += ` ON DELETE SET NULL ON UPDATE CASCADE`;
               } else {
                  foreign += ` ON DELETE CASCADE ON UPDATE CASCADE`;
               }
               foreignKeys.push(foreign);
            }

            // Handle indexes for other fields
            if (meta.index) {
               const indexName = `${table}_${column}${meta.unique ? '_unique_index' : '_index'}`;
               if (engine === 'mssql') {
                  indexes.push(`IF NOT EXISTS (
                    SELECT name FROM sys.indexes
                    WHERE name = '${indexName}' AND object_id = OBJECT_ID('${table}')
                  )
                  CREATE ${meta.unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${quote(engine, table)}(${quote(engine, column)});
                  `);
               } else {
                  indexes.push(`CREATE ${meta.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${indexName} ON ${quote(engine, table)}(${quote(engine, column)});`);
               }
            }
         }
         let sql = `CREATE TABLE IF NOT EXISTS ${quote(engine, table)} (\n`;
         sql += sqls.join(',\n');
         if (foreignKeys.length) {
            sql += ',\n' + foreignKeys.join(',\n');
         }
         sql += `\n);`;
         sqlStatements.push(sql);
      }

      sqlStatements.push(...indexes);
      return sqlStatements
   }

   buildColumn(column: string, field: XqlFields) {
      const engine = this.xansql.config.dialect.engine;
      const meta = field.meta || {};
      const nullable = meta.nullable || meta.optional ? 'NULL' : 'NOT NULL';
      const unique = meta.unique ? 'UNIQUE' : '';
      const col = (column: string, sqlType: string) => {
         return `  ${quote(engine, column)} ${sqlType} ${nullable} ${unique}`.trim()
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
            sql += col(column, `ENUM(${(field as any).values.map((v: any) => quote(engine, v)).join(', ')})`)
         } else if (engine === "postgresql") {
            const enumName = `${column}_enum`;
            sql += `CREATE TYPE ${enumName} AS ENUM (${(field as any).values.map((v: any) => quote(engine, v)).join(', ')}); `
            sql += col(column, enumName)
         } else if (engine === "sqlite") {
            const values = (field as any).values.map((v: any) => quote(engine, v)).join(", ");
            sql += `"${column}" TEXT CHECK("${column}" IN (${values})) ${nullable} ${unique}, `
         } else if (engine === "mssql") {
            const values = (field as any).values.map((v: any) => quote(engine, v)).join(", ");
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