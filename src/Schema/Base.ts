import XqlArray from "../Types/fields/Array";
import XqlBoolean from "../Types/fields/Boolean";
import XqlDate from "../Types/fields/Date";
import XqlEnum from "../Types/fields/Enum";
import XqlIDField from "../Types/fields/IDField";
import XqlNumber from "../Types/fields/Number";
import XqlObject from "../Types/fields/Object";
import XqlRecord from "../Types/fields/Record";
import XqlSchema from "../Types/fields/Schema";
import XqlString from "../Types/fields/String";
import XqlTuple from "../Types/fields/Tuple";
import XqlUnion from "../Types/fields/Union";
import { XansqlSchemaObject } from "../Types/types";
import { ErrorWhene, escapeSqlValue } from "../utils";
import Xansql from "../Xansql";

abstract class SchemaBase {
   readonly schema: XansqlSchemaObject;
   readonly table: string;
   readonly IDColumn: string = '';

   xansql: Xansql = null as any;
   alias: string = '';

   constructor(table: string, schema: XansqlSchemaObject) {
      this.table = table;
      this.schema = schema;
      for (let column in schema) {
         const field = schema[column];
         if (field instanceof XqlIDField) {
            ErrorWhene(this.IDColumn, `Schema ${this.table} can only have one ID column`);
            this.IDColumn = column;
         }
      }
      ErrorWhene(!this.IDColumn, `Schema ${this.table} must have an id column`);
   }

   async excute(sql: string): Promise<any> {
      return await this.xansql.excute(sql, this as any)
   }

   async drop() {
      ErrorWhene(typeof window !== "undefined", "This method can only be used on the server side.");
      await this.excute(`DROP TABLE IF EXISTS ${this.table}`);
   }


   async migrate(force = false) {
      ErrorWhene(typeof window !== "undefined", "This method can only be used on the server side.");
      if (force) await this.drop();
      await this.xansql.dialect.migrate(this as any);
   }

   iof(column: string, ...instances: any[]) {
      const xanv: any = this.schema[column];
      return instances.some(instance => xanv instanceof instance);
   }

   toSql(column: string, value: any) {
      const xanv = this.schema[column];
      ErrorWhene(!xanv, `Column ${column} does not exist in schema ${this.table}`);

      try {
         value = xanv.parse(value);
         if (value === undefined || value === null) {
            return 'NULL';
         } else if (this.iof(column, XqlIDField, XqlNumber, XqlSchema)) {
            return value
         } else if (this.iof(column, XqlString, XqlEnum)) {
            return `'${escapeSqlValue(value)}'`;
         } else if (this.iof(column, XqlObject, XqlRecord, XqlArray, XqlTuple, XqlUnion)) {
            value = JSON.stringify(value);
            return `'${escapeSqlValue(value)}'`;
         } else if (this.iof(column, XqlDate)) {
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
         } else if (this.iof(column, XqlBoolean)) {
            return value ? 1 : 0;
         }
      } catch (error: any) {
         throw new Error(`Field ${column} is invalid. ${error.message}`);
      }
   }

   toValue(column: string, value: any) {
      const xanv = this.schema[column];
      ErrorWhene(!xanv, `Column ${column} does not exist in schema ${this.table}`);

      if (value === null || value === undefined) {
         return null;
      }

      if (this.iof(column, XqlIDField, XqlNumber, XqlString, XqlEnum)) {
         return value
      } else if (this.iof(column, XqlObject, XqlRecord, XqlArray, XqlTuple, XqlUnion)) {
         return JSON.parse(value);
      } else if (this.iof(column, XqlDate)) {
         return new Date(value);
      } else if (this.iof(column, XqlBoolean)) {
         return Boolean(value);
      }

      return value;
   }

}

export default SchemaBase;