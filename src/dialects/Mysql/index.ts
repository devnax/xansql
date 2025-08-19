import Schema from "../../Schema";
import XqlAny from "../../Types/fields/Any";
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

const buildSchema = (schema: Schema): string => {
   let sql = `CREATE TABLE IF NOT EXISTS ${schema.table} (`;
   const columns = Object.entries(schema.schema)

   const indexable: any = {}

   for (let [columnName, field] of columns) {
      console.log(field);

      const nullable = field.meta.nullable || field.meta.optional ? 'NULL' : 'NOT NULL';
      const unique = field.meta.unique ? 'UNIQUE' : '';
      const defaultValue = field.meta.default ? `DEFAULT '${field.meta.default}'` : '';
      if (field.meta.index) {
         indexable[columnName] = true;
      }
      const col = (column: string, sqlType: string) => `\`${column}\` ${sqlType} ${nullable} ${unique} ${defaultValue}, `;

      if (field instanceof XqlIDField) {
         sql += `\`${columnName}\` INT AUTO_INCREMENT PRIMARY KEY, `;
      } else if (field instanceof XqlJoin) {
         sql += col(columnName, "INT")
      } else if (field instanceof XqlString || field instanceof XqlFile) {
         sql += col(columnName, "VARCHAR(255)")
      } else if (field instanceof XqlNumber) {
         sql += col(columnName, "FLOAT");
      } else if (field instanceof XqlBoolean) {
         sql += col(columnName, "BOOLEAN");
      } else if (field instanceof XqlDate) {
         sql += col(columnName, "DATETIME");
      } else if (field instanceof XqlEnum) {
         sql += col(columnName, `ENUM(${field.values.map(v => `'${v}'`).join(', ')})`);
      } else if (field instanceof XqlAny || field instanceof XqlArray || field instanceof XqlSet || field instanceof XqlObject || field instanceof XqlMap || field instanceof XqlRecord) {
         sql += col(columnName, "TEXT"); // Store as JSON
      } else {
         throw new Error(`Unsupported field type for column ${columnName}`);
      }
   }

   // Remove the last comma and space
   sql = sql.slice(0, -2);
   sql += `);`;

   // Add indexes for indexed columns
   for (let column in indexable) {
      sql += `CREATE INDEX idx_${schema.table}_${column} ON ${schema.table}(${column});`;
   }

   console.log(sql);

   return sql
}



export default {
   buildSchema,
} as any