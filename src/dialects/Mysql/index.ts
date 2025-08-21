import Schema from "../../Schema";
import { DialectOptions } from "../../type";
import XqlArray from "../../Types/fields/Array";
import XqlBoolean from "../../Types/fields/Boolean";
import XqlDate from "../../Types/fields/Date";
import XqlEnum from "../../Types/fields/Enum";
import XqlFile from "../../Types/fields/File";
import XqlIDField from "../../Types/fields/IDField";
import XqlJoin from "../../Types/fields/Join";
import XqlMap from "../../Types/fields/Map";
import XqlNumber from "../../Types/fields/Number";
import XqlObject from "../../Types/fields/Object";
import XqlRecord from "../../Types/fields/Record";
import XqlSet from "../../Types/fields/Set";
import XqlString from "../../Types/fields/String";
import { XqlFields } from "../../Types/types";
import Xansql from "../../Xansql";

const makeIndexKey = (table: string, column: string) => {
   return `idx_${table}_${column}`;
}

const buildColumn = (column: string, field: XqlFields) => {

   const meta = field.meta || {};
   const nullable = meta.nullable || meta.optional ? 'NULL' : 'NOT NULL';
   const unique = meta.unique ? 'UNIQUE' : '';
   const defaultValue = meta.default ? `DEFAULT '${meta.default}'` : '';

   const col = (column: string, sqlType: string) => `\`${column}\` ${sqlType} ${nullable} ${unique} ${defaultValue}, `;
   let sql = '';
   if (field instanceof XqlIDField) {
      sql += `\`${column}\` INT AUTO_INCREMENT PRIMARY KEY, `;
   } else if (field instanceof XqlJoin) {
      sql += col(column, "INT")
   } else if (field instanceof XqlString) {
      let length = meta.length || meta.max
      if (!length || length > 65535) {
         sql += col(column, "TEXT");
      } else {
         sql += col(column, `VARCHAR(${length})`)
      }
   } else if (field instanceof XqlFile) {
      sql += col(column, "VARCHAR(255)")
   } else if (field instanceof XqlNumber) {
      if (meta.integer) {
         sql += col(column, "INT");
      } else if (meta.float) {
         sql += col(column, "FLOAT");
      } else {
         sql += col(column, "DECIMAL(10, 2)");
      }
   } else if (field instanceof XqlBoolean) {
      sql += col(column, "TINYINT(1)");
   } else if (field instanceof XqlDate) {
      sql += col(column, "DATETIME");
   } else if (field instanceof XqlEnum) {
      sql += col(column, `ENUM(${(field as any).values.map((v: any) => `'${v}'`).join(', ')})`);
   } else if (field instanceof XqlArray || field instanceof XqlSet || field instanceof XqlObject || field instanceof XqlMap || field instanceof XqlRecord) {
      sql += col(column, "TEXT");
   } else {
      throw new Error(`Unsupported field type for column ${column}`);
   }
}


let mod: any = null;


const mysqldialect = (xansql: Xansql): DialectOptions => {
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
      let sql = `CREATE TABLE IF NOT EXISTS ${schema.table} (`;
      const columns = Object.entries(schema.schema)
      const indexable: any = {}

      for (let [column, field] of columns) {
         const meta = field.meta || {};
         if (meta.index) {
            indexable[column] = true;
         }
         sql += buildColumn(column, field);
      }

      sql = sql.slice(0, -2);
      sql += `);`;

      for (let column in indexable) {
         sql += `CREATE INDEX ${makeIndexKey(schema.table, column)} ON ${schema.table}(${column});`;
      }

      await excute(sql, schema);
   }


   return {
      migrate,
      excute,
      addColumn: async (schema: Schema, columnName: string) => {
         const column = schema.schema[columnName];
         if (!column) {
            throw new Error(`Column ${columnName} does not exist in model ${schema.table}`);
         }
         if (column instanceof XqlJoin || column instanceof XqlIDField) {
            throw new Error(`Cannot add relation or IDField as a column: ${columnName}`);
         };
         const buildColumnSql = buildColumn(columnName, column);
         return await excute(`ALTER TABLE \`${schema.table}\` ADD COLUMN \`${columnName}\` ${buildColumnSql}`, schema);
      },

      dropColumn: async (schema: Schema, columnName: string) => {
         const column = schema.schema[columnName];
         if (!column) {
            throw new Error(`Column ${columnName} does not exist in model ${schema.table}`);
         }
         if (column instanceof XqlJoin || column instanceof XqlIDField) {
            throw new Error(`Cannot drop relation or IDField as a column: ${columnName}`);
         };
         return await excute(`ALTER TABLE \`${schema.table}\` DROP COLUMN \`${columnName}\`;`, schema);
      },

      renameColumn: async (schema: Schema, oldName: string, newName: string) => {
         const column = schema.schema[oldName];
         if (!column) {
            throw new Error(`Column ${oldName} does not exist in model ${schema.table}`);
         }
         if (column instanceof XqlJoin || column instanceof XqlIDField) {
            throw new Error(`Cannot rename relation or IDField as a column: ${oldName}`);
         };
         return await excute(`ALTER TABLE \`${schema.table}\` CHANGE \`${oldName}\` \`${newName}\` ${buildColumn(newName, column)}`, schema);
      },

      addIndex: async (schema: Schema, columnName: string) => {
         const column = schema.schema[columnName];
         if (!column) {
            throw new Error(`Column ${columnName} does not exist in model ${schema.table}`);
         }
         if (column instanceof XqlJoin || column instanceof XqlIDField) {
            throw new Error(`Cannot add index to relation or IDField as a column: ${columnName}`);
         };
         if (!column.meta || !column.meta.index) {
            throw new Error(`Column ${columnName} is not indexed in model ${schema.table}`);
         }
         return await excute(`CREATE INDEX \`${makeIndexKey(schema.table, columnName)}\` ON \`${schema.table}\` (\`${columnName}\`);`, schema);
      },

      dropIndex: async (schema: Schema, columnName: string) => {
         const column = schema.schema[columnName];
         if (!column) {
            throw new Error(`Column ${columnName} does not exist in model ${schema.table}`);
         }
         if (column instanceof XqlJoin || column instanceof XqlIDField) {
            throw new Error(`Cannot drop index from relation or IDField as a column: ${columnName}`);
         };

         return await excute(`DROP INDEX \`${makeIndexKey(schema.table, columnName)}\` ON \`${schema.table}\`;`, schema);
      }
   }

}
export default mysqldialect;