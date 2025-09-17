import Schema from "../../Schema";
import { DialectOptions } from "../../type";
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
import Xansql from "../../Xansql";

const makeIndexKey = (table: string, column: string) => `idx_${table}_${column}`

const buildColumn = (column: string, field: XqlFields): string => {
   const meta = field.meta || {};
   const nullable = meta.nullable || meta.optional ? 'NULL' : 'NOT NULL';
   const unique = meta.unique ? 'UNIQUE' : '';
   const defaultValue = meta.default !== undefined ? `DEFAULT '${meta.default}'` : '';

   const col = (column: string, sqlType: string) =>
      `"${column}" ${sqlType} ${nullable} ${unique} ${defaultValue}, `;

   let sql = '';
   if (field instanceof XqlIDField) {
      sql += `"${column}" SERIAL PRIMARY KEY, `;
   } else if (field instanceof XqlSchema) {
      sql += col(column, "INTEGER");
   } else if (field instanceof XqlString) {
      let length = meta.length || meta.max;
      if (!length || length > 65535) {
         sql += col(column, "TEXT");
      } else {
         sql += col(column, `VARCHAR(${length})`);
      }
   } else if (field instanceof XqlFile) {
      sql += col(column, "VARCHAR(255)");
   } else if (field instanceof XqlNumber) {
      if (meta.integer) {
         sql += col(column, "INTEGER");
      } else if (meta.float) {
         sql += col(column, "REAL");
      } else {
         sql += col(column, "NUMERIC(10,2)");
      }
   } else if (field instanceof XqlBoolean) {
      sql += col(column, "BOOLEAN");
   } else if (field instanceof XqlDate) {
      sql += col(column, "TIMESTAMP");
   } else if (field instanceof XqlEnum) {
      const enumName = `${column}_enum`;
      sql += `"${column}" ${enumName} ${nullable} ${unique} ${defaultValue}, `;
   } else if (field instanceof XqlArray) {
      const arrayType = (field as any).type;
      if (!(arrayType instanceof XqlSchema)) {
         sql += col(column, "TEXT");
      }
   } else if (
      field instanceof XqlObject
      || field instanceof XqlRecord
      || field instanceof XqlTuple
      || field instanceof XqlUnion
   ) {
      sql += col(column, "TEXT");
   } else {
      throw new Error(`Unsupported field type for column ${column}`);
   }
   return sql;
}


let mod: any = null;
const postgresDialect = (xansql: Xansql): DialectOptions => {
   const config = xansql.config
   let excuter: any = null;

   const excute = async (sql: any, schema: Schema): Promise<any> => {
      if (typeof window === "undefined") {
         if (!mod) {
            mod = (await import("./excuter")).default;
            excuter = new mod(config);
         }
         return await excuter.excute(sql);
      } else {
         return await xansql.excuteClient(sql, schema);
      }
   }

   const migrate = async (schema: Schema) => {
      let sql = '';

      // create ENUM types first
      for (let [column, field] of Object.entries(schema.schema)) {
         if (field instanceof XqlEnum) {
            const enumName = `${column}_enum`;
            const values = (field as any).values.map((v: any) => `'${v}'`).join(", ");
            sql += `DO $$ BEGIN
                     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName}') THEN
                         CREATE TYPE ${enumName} AS ENUM (${values});
                     END IF;
                   END$$;`
         }
      }

      sql += `CREATE TABLE IF NOT EXISTS "${schema.table}" (`;
      for (let [column, field] of Object.entries(schema.schema)) {
         sql += buildColumn(column, field);
      }
      sql = sql.slice(0, -2);
      sql += `);`;

      await excute(sql, schema);
      // create indexes
      for (let [column, field] of Object.entries(schema.schema)) {
         if (field.meta?.index) {
            sql = `CREATE INDEX IF NOT EXISTS ${makeIndexKey(schema.table, column)} ON "${schema.table}"("${column}");`;
            await excute(sql, schema);
         }
      }
   }


   const opt = {
      migrate,
      excute,
      addColumn: async (schema: Schema, columnName: string) => {
         const column = schema.schema[columnName];
         if (!column) throw new Error(`Column ${columnName} does not exist in model ${schema.table}`);
         if (column instanceof XqlSchema || column instanceof XqlIDField)
            throw new Error(`Cannot add relation or IDField as a column: ${columnName}`);
         return await opt.excute(`ALTER TABLE "${schema.table}" ADD COLUMN ${buildColumn(columnName, column).slice(0, -2)};`, schema);
      },
      dropColumn: async (schema: Schema, columnName: string) => {
         return await opt.excute(`ALTER TABLE "${schema.table}" DROP COLUMN "${columnName}";`, schema);
      },
      renameColumn: async (schema: Schema, oldName: string, newName: string) => {
         return await opt.excute(`ALTER TABLE "${schema.table}" RENAME COLUMN "${oldName}" TO "${newName}";`, schema);
      },
      addIndex: async (schema: Schema, columnName: string) => {
         return await opt.excute(`CREATE INDEX ${makeIndexKey(schema.table, columnName)} ON "${schema.table}"("${columnName}");`, schema);
      },
      dropIndex: async (schema: Schema, columnName: string) => {
         return await opt.excute(`DROP INDEX ${makeIndexKey(schema.table, columnName)};`, schema);
      }
   }

   return opt;
}

export default postgresDialect;
