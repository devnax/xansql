import Model from ".";
import Foreign from "../core/classes/ForeignInfo";
import XansqlError from "../core/XansqlError";
import { escapeSqlValue, iof, quote } from "../utils";
import XqlArray from "../xt/fields/Array";
import XqlBoolean from "../xt/fields/Boolean";
import XqlDate from "../xt/fields/Date";
import XqlEnum from "../xt/fields/Enum";
import XqlFile from "../xt/fields/File";
import XqlIDField from "../xt/fields/IDField";
import XqlNumber from "../xt/fields/Number";
import XqlObject from "../xt/fields/Object";
import XqlRecord from "../xt/fields/Record";
import XqlSchema from "../xt/fields/Schema";
import XqlString from "../xt/fields/String";
import XqlTuple from "../xt/fields/Tuple";
import XqlUnion from "../xt/fields/Union";
import ValueFormatter from "./include/ValueFormatter";

class Migrations {
   model: Model;
   TableMigration: any;
   constructor(model: Model) {
      this.model = model;
   }

   identifier(column: string, type: 'foreign' | 'index') {
      const model = this.model
      const field = model.schema[column];
      const meta = field?.meta || {};
      if (type === 'foreign') {
         if (!Foreign.isSchema(field)) {
            throw new XansqlError({
               message: `Cannot create foreign key identifier for non-foreign field "${column}" in table "${model.table}".`,
               model: model.table,
               column
            });
         }
         return `fk_${model.table}_${column}`;
      } else {
         if (Foreign.isSchema(field)) {
            return `${model.table}_${column}_index`;
         } else {
            return `${model.table}_${column}${meta.unique ? '_unique_index' : '_index'}`;
         }
      }
   }

   up() {
      const schema = this.model.schema;
      const table = this.model.table;
      const engine = this.model.xansql.dialect.engine;

      let builds = {} as { [key: string]: string }
      let indexes = {} as { [key: string]: string }
      let foreign_keys = {} as { [key: string]: string }
      let types = {} as { [key: string]: string }

      for (let column in schema) {
         const field = schema[column];

         if (Foreign.isArray(field)) {
            continue; // skip array relations
         }

         const meta = field.meta || {};
         const unique = meta.unique ? 'UNIQUE' : '';
         const isOptional = meta.nullable || meta.optional;
         const build = this.buildColumn(column);
         builds[column] = build.sql;
         types[column] = build.typeSql;

         if (Foreign.isSchema(field)) {
            const info = Foreign.get(this.model, column)
            const refTable = info.table
            const refColumn = info.relation.main
            const fk = this.identifier(column, 'foreign');

            if (engine === 'mysql' || engine === 'postgresql') {
               let sql = `ALTER TABLE ${quote(engine, table)} ADD CONSTRAINT ${fk} FOREIGN KEY (${quote(engine, column)}) REFERENCES ${quote(engine, refTable)}(${quote(engine, refColumn)})`;
               if (isOptional) {
                  sql += ` ON DELETE SET NULL ON UPDATE CASCADE`;
               } else {
                  sql += ` ON DELETE CASCADE ON UPDATE CASCADE`;
               }
               foreign_keys[column] = sql;
            }
         }

         if (meta.index) {
            const indexName = this.identifier(column, 'index');
            if (unique) {
               indexes[column] = `CREATE UNIQUE INDEX ${indexName} ON ${quote(engine, table)} (${quote(engine, column)});`
            } else {
               indexes[column] = `CREATE ${unique} INDEX ${indexName} ON ${quote(engine, table)} (${quote(engine, column)});`
            }
         }
      }

      let sql = `CREATE TABLE IF NOT EXISTS ${quote(engine, table)} (${Object.values(builds).join(',')})`;
      if (engine === 'mysql') {
         sql += ` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
      } else {
         sql += ` ;`;
      }

      return {
         table: sql,
         columns: builds,
         indexes,
         foreign_keys,
         types
      }
   }

   down() {
      const schema = this.model.schema;
      const table = this.model.table;
      const engine = this.model.xansql.dialect.engine;

      let indexes = {} as { [key: string]: string }
      let foreign_keys = {} as { [key: string]: string }
      let types = {} as { [key: string]: string }

      for (let column in schema) {
         const field = schema[column];
         const meta = field.meta || {};

         if (iof(field, XqlEnum)) {
            const enumName = `${table}_${column}_enum`;
            if (engine === 'postgresql') {
               types[column] = `DROP TYPE IF EXISTS ${enumName};`;
            }
         } else if (Foreign.isSchema(field)) {
            const fk = this.identifier(column, 'foreign');
            let sql = ``;
            if (engine === 'mysql') {
               sql = `ALTER TABLE ${quote(engine, table)} DROP FOREIGN KEY ${fk};`;
            } else if (engine === 'postgresql') {
               sql = `ALTER TABLE ${quote(engine, table)} DROP CONSTRAINT IF EXISTS ${fk};`;
            }

            foreign_keys[column] = sql;
         } else if (meta.index && !meta.unique) {
            const indexName = this.identifier(column, 'index');
            if (engine === 'postgresql' || engine === 'sqlite') {
               indexes[column] = `DROP INDEX IF EXISTS ${indexName};`
            } else {
               indexes[column] = `DROP INDEX ${indexName} ON ${quote(engine, table)};`
            }
         }
      }

      return {
         table: `DROP TABLE IF EXISTS ${quote(engine, table)}`,
         indexes,
         foreign_keys,
         types
      }
   }


   private buildColumn(column: string) {
      const engine = this.model.xansql.dialect.engine;
      const model = this.model
      const table = model.table;
      const field = model.schema[column];
      const meta = field.meta || {};
      const nullable = meta.nullable || meta.optional ? 'NULL' : 'NOT NULL';
      const unique = meta.unique ? 'UNIQUE' : '';
      let default_value = ''
      if (meta.default !== undefined) {
         default_value = ValueFormatter.getDefaultSql(model, column);
      }
      const col = (column: string, sqlType: string) => {
         return `${quote(engine, column)} ${sqlType} ${nullable} ${default_value} ${unique}`.trim().replace(/ +/g, ' ');
      };
      let sql = ''
      let typeSql = ''
      if (iof(field, XqlIDField)) {
         if (engine === 'mysql') {
            sql = col(column, "INT AUTO_INCREMENT PRIMARY KEY");
         } else if (engine === 'postgresql') {
            sql = col(column, "SERIAL PRIMARY KEY")
         } else if (engine === 'sqlite') {
            sql = col(column, "INTEGER PRIMARY KEY AUTOINCREMENT")
         }
      } else if (iof(field, XqlSchema)) {
         if (engine === 'mysql') {
            sql = col(column, "INT")
         } else if (engine === 'postgresql' || engine === 'sqlite') {
            sql = col(column, "INTEGER")
         }
      } else if (iof(field, XqlString)) {
         let length = meta.length || meta.max
         if (meta.text || length > 65535 || engine === 'sqlite') {
            sql = col(column, "TEXT")
         } else {
            sql = col(column, `VARCHAR(${length || 255})`)
         }
      } else if (iof(field, XqlFile)) {
         sql = col(column, "VARCHAR(255)")
      } else if (iof(field, XqlNumber)) {
         if (engine === "mysql") {
            if (meta.integer) {
               sql = col(column, "INT")
            } else if (meta.float) {
               sql = col(column, "FLOAT")
            } else {
               sql = col(column, "DECIMAL(10, 2)")
            }
         } else if (engine === "postgresql" || engine === "sqlite") {
            if (meta.integer) {
               sql = col(column, "INTEGER")
            } else if (meta.float) {
               sql = col(column, "REAL")
            } else {
               sql = col(column, engine === "sqlite" ? "NUMERIC" : "NUMERIC(10, 2)")
            }
         }
      } else if (iof(field, XqlBoolean)) {
         if (engine === "mysql" || engine === "postgresql") {
            sql = col(column, "BOOLEAN")
         } else if (engine === "sqlite") {
            sql = col(column, "INTEGER") // SQLite has no BOOLEAN → use INTEGER (0/1)
         }
      } else if (iof(field, XqlDate)) {
         if (engine === "mysql") {
            sql = col(column, "DATETIME")
         } else if (engine === "postgresql") {
            sql = col(column, "TIMESTAMP")
         } else if (engine === "sqlite") {
            sql = col(column, "TEXT") // store ISO string (SQLite has no native DATETIME)
         }
      } else if (iof(field, XqlEnum)) {
         if (engine === "mysql") {
            sql = col(column, `ENUM(${(field as any).values.map((v: any) => `'${escapeSqlValue(v)}'`).join(', ')})`)
         } else if (engine === "postgresql") {
            const enumName = `${table}_${column}_enum`;
            typeSql = `CREATE TYPE ${enumName} AS ENUM (${(field as any).values.map((v: any) => `'${escapeSqlValue(v)}'`).join(', ')}); `
            sql = col(column, enumName)
         } else if (engine === "sqlite") {
            const values = (field as any).values
               .map((v: any) => `'${escapeSqlValue(v)}'`)
               .join(", ");

            sql = `"${column}" TEXT CHECK("${column}" IS NULL OR "${column}" IN (${values})) ${nullable} ${unique}`
               .trim()
               .replace(/ +/g, " ");
         }
      } else if (iof(field, XqlObject, XqlRecord, XqlTuple, XqlUnion)) {
         sql = col(column, "TEXT")
      } else if (iof(field, XqlArray)) {
         const arrayType = (field as any).type;
         const isSchemaArray = iof(arrayType, XqlSchema)
         if (!isSchemaArray) {
            sql = col(column, "TEXT")
         }
      } else {
         throw new XansqlError({
            message: `Unsupported field type for column "${column}" in table "${table}".`,
            model: table,
            column
         });
      }
      return { sql, typeSql };
   }
}

export default Migrations;