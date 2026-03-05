import { ModelType } from "../../core/types";
import XansqlError from "../../core/XansqlError";
import { iof } from "../../utils";
import XqlArray from "../../xt/fields/Array";
import XqlBoolean from "../../xt/fields/Boolean";
import XqlDate from "../../xt/fields/Date";
import XqlEnum from "../../xt/fields/Enum";
import XqlFile from "../../xt/fields/File";
import XqlIDField from "../../xt/fields/IDField";
import XqlNumber from "../../xt/fields/Number";
import XqlObject from "../../xt/fields/Object";
import XqlRecord from "../../xt/fields/Record";
import XqlRelationOne from "../../xt/fields/RelationOne";
import XqlString from "../../xt/fields/String";
import XqlTuple from "../../xt/fields/Tuple";
import XqlUnion from "../../xt/fields/Union";

class ValueFormatter {

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

   static toSql(model: ModelType, column: string, value: any, _throw = true) {
      const field = model.schema[column];
      if (!field) throw new XansqlError({
         message: `Column ${column} does not exist in model ${model.table}`,
         model: model.table,
         column: column
      });

      try {
         value = field.parse(value);
      } catch (error: any) {
         if (_throw) {
            throw new XansqlError({
               message: `${model.table}.${column}: ${error.message.toLowerCase()}`,
               model: model.table,
               column: column
            });
         }
      }

      if (value === undefined || value === null) {
         return 'NULL';
      } else if (iof(field, XqlIDField, XqlNumber, XqlRelationOne)) {
         return value
      } else if (iof(field, XqlFile)) {
         return `'${value.name}'`;
      } else if (iof(field, XqlString, XqlEnum)) {
         return `'${this.escape(value)}'`;
      } else if (iof(field, XqlObject, XqlRecord, XqlArray, XqlTuple, XqlUnion)) {
         value = JSON.stringify(value);
         return `'${this.escape(value)}'`;
      } else if (iof(field, XqlDate)) {
         if (iof(value, String)) {
            value = new Date(value as any)
         }
         if (!iof(value, Date) || isNaN(value.getTime())) {
            throw new Error(`Invalid date value for column ${column}: ${value}`);
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
      } else if (iof(model, column, XqlBoolean)) {
         return value ? 1 : 0;
      }
   }

   static fromSql(model: ModelType, column: string, value: any) {
      const field = model.schema[column];
      if (!field) throw new Error(`Column ${column} does not exist in model ${model.table}`);
      if (value === null || value === undefined) return null

      if (iof(model, column, XqlIDField, XqlNumber, XqlString, XqlFile, XqlEnum)) {
         return value
      } else if (iof(model, column, XqlObject, XqlRecord, XqlArray, XqlTuple, XqlUnion)) {
         return JSON.parse(value);
      } else if (iof(model, column, XqlDate)) {
         return new Date(value);
      } else if (iof(model, column, XqlBoolean)) {
         return Boolean(value);
      }

      return value;
   }

   static getDefaultSql(model: ModelType, column: string) {
      const field = model.schema[column];
      if (!field) throw new XansqlError({
         message: `Column ${column} does not exist in model ${model.table}`,
         model: model.table,
         column
      });

      try {
         let value = field.parse(undefined);
         const meta = field.meta || {};
         if (!meta.optional) {
            return '';
         }

         if (value === undefined || value === null) {
            return 'DEFAULT NULL';
         } else if (iof(field, XqlIDField, XqlNumber, XqlRelationOne)) {
            return `DEFAULT ${value}`;
         } else if (iof(field, XqlString, XqlEnum, XqlFile)) {
            return `DEFAULT '${this.escape(value)}'`;
         } else if (iof(field, XqlObject, XqlRecord, XqlArray, XqlTuple, XqlUnion)) {
            value = JSON.stringify(value);
            return `DEFAULT '${this.escape(value)}'`;
         } else if (iof(field, XqlDate)) {
            const c = new Date()
            let v
            if (c.toISOString() === value.toISOString()) {
               v = `DEFAULT CURRENT_TIMESTAMP`;
            } else {
               v = `DEFAULT '${value}'`;
            }
            if (meta.update) {
               v = ` ${v} ON UPDATE CURRENT_TIMESTAMP`;
            }
            return v
         } else if (iof(field, XqlBoolean)) {
            return value ? 'DEFAULT 1' : 'DEFAULT 0';
         }
      } catch (error: any) {
         throw new XansqlError({
            message: `Failed to generate default SQL for ${model.table}.${column}: ${error.message}`,
            model: model.table,
            column
         });
      }

      return ''; // fallback: no default
   }


}

export default ValueFormatter;