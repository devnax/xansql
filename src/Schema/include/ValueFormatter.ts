import Schema from "..";
import XqlArray from "../../Types/fields/Array";
import XqlBoolean from "../../Types/fields/Boolean";
import XqlDate from "../../Types/fields/Date";
import XqlEnum from "../../Types/fields/Enum";
import XqlIDField from "../../Types/fields/IDField";
import XqlNumber from "../../Types/fields/Number";
import XqlObject from "../../Types/fields/Object";
import XqlRecord from "../../Types/fields/Record";
import XqlSchema from "../../Types/fields/Schema";
import XqlString from "../../Types/fields/String";
import XqlTuple from "../../Types/fields/Tuple";
import XqlUnion from "../../Types/fields/Union";

class ValueFormatter {
   private static iof(model: Schema, column: string, ...instances: any[]) {
      const field = model.schema[column];
      return instances.some(instance => field instanceof instance);
   }

   private static escape(value: string) {
      if (value == null) return ''
      let s = String(value)

      // Standard SQL: escape single quotes by doubling them
      s = s.replace(/'/g, "''")

      // Guard against control chars and backslashes (safer across engines)
      s = s
         .replace(/\\/g, '\\\\')   // backslash
         .replace(/\x00/g, '\\0')  // null byte
         .replace(/\n/g, '\\n')    // newline
         .replace(/\r/g, '\\r')    // carriage return
         .replace(/\t/g, '\\t')    // tab
         .replace(/\x08/g, '\\b')  // backspace
         .replace(/\x1a/g, '\\Z')  // Ctrl+Z (notably MySQL)

      return s
   }

   static toSql(model: Schema, column: string, value: any) {
      const field = model.schema[column];
      if (!field) {
         throw new Error(`Column ${column} does not exist in schema ${model.table}`);
      }

      try {
         value = field.parse(value);
         if (value === undefined || value === null) {
            return 'NULL';
         } else if (this.iof(model, column, XqlIDField, XqlNumber, XqlSchema)) {
            return value
         } else if (this.iof(model, column, XqlString, XqlEnum)) {
            return `'${this.escape(value)}'`;
         } else if (this.iof(model, column, XqlObject, XqlRecord, XqlArray, XqlTuple, XqlUnion)) {
            value = JSON.stringify(value);
            return `'${this.escape(value)}'`;
         } else if (this.iof(model, column, XqlDate)) {
            if (value instanceof String) {
               value = new Date(value as any)
            }
            if (!(value instanceof Date) || isNaN(value.getTime())) {
               throw new Error(`Invalid date value for column ${column}`);
            }

            const pad = (n: number) => n.toString().padStart(2, '0');
            let date = value as Date;
            const year = date.getUTCFullYear();
            const month = pad(date.getUTCMonth() + 1); // months are 0-indexed
            const day = pad(date.getUTCDate());
            const hours = pad(date.getUTCHours());
            const minutes = pad(date.getUTCMinutes());
            const seconds = pad(date.getUTCSeconds());
            value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            return `'${value}'`;
         } else if (this.iof(model, column, XqlBoolean)) {
            return value ? 1 : 0;
         }
      } catch (error: any) {
         throw new Error(`Field ${column} is invalid. ${error.message}`);
      }
   }

   static fromSql(model: Schema, column: string, value: any) {
      const field = model.schema[column];
      if (!field) {
         throw new Error(`Column ${column} does not exist in schema ${model.table}`);
      }
      if (value === null || value === undefined) return null

      if (this.iof(model, column, XqlIDField, XqlNumber, XqlString, XqlEnum)) {
         return value
      } else if (this.iof(model, column, XqlObject, XqlRecord, XqlArray, XqlTuple, XqlUnion)) {
         return JSON.parse(value);
      } else if (this.iof(model, column, XqlDate)) {
         return new Date(value);
      } else if (this.iof(model, column, XqlBoolean)) {
         return Boolean(value);
      }

      return value;
   }
}

export default ValueFormatter;