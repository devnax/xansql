import XqlArray from "../Types/fields/Array";
import XqlBoolean from "../Types/fields/Boolean";
import XqlDate from "../Types/fields/Date";
import XqlEnum from "../Types/fields/Enum";
import XqlIDField from "../Types/fields/IDField";
import XqlJoin from "../Types/fields/Join";
import XqlMap from "../Types/fields/Map";
import XqlNumber from "../Types/fields/Number";
import XqlObject from "../Types/fields/Object";
import XqlRecord from "../Types/fields/Record";
import XqlSet from "../Types/fields/Set";
import XqlString from "../Types/fields/String";
import XqlTuple from "../Types/fields/Tuple";
import XqlUnion from "../Types/fields/Union";
import { XansqlSchemaObject } from "../Types/types";
import Xansql from "../Xansql";

abstract class SchemaBase {
   readonly schema: XansqlSchemaObject;
   readonly table: string;
   readonly IDColumn: string = '';
   readonly columns = {
      main: [] as string[],
      relation: [] as string[],
   }

   xansql: Xansql = null as any;
   alias: string = '';

   constructor(table: string, schema: XansqlSchemaObject) {
      this.table = table;
      this.schema = schema;
      for (let column in schema) {
         const field = schema[column];
         if (field instanceof XqlIDField) {
            if (this.IDColumn) {
               throw new Error(`Schema ${this.table} can only have one ID column`);
            }
            this.IDColumn = column;
         }

         if (field instanceof XqlJoin) {
            this.columns.relation.push(column);
         } else {
            this.columns.main.push(column);
         }
      }
      if (!this.IDColumn) {
         throw new Error(`Schema ${this.table} must have an id column`);
      }
   }

   async excute(sql: string): Promise<any> {
      return await this.xansql.excute(sql, this as any)
   }

   async drop() {
      if (typeof window !== "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      await this.excute(`DROP TABLE IF EXISTS ${this.table}`);
   }


   async migrate(force = false) {
      if (typeof window !== "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      if (force) {
         await this.drop();
      }
      await this.xansql.dialect.migrate(this as any);
   }

   private iof(column: string, ...instances: any[]) {
      const xanv = this.schema[column];
      if (!xanv) {
         throw new Error(`Column ${column} does not exist in schema ${this.table}`);
      }
      return instances.some(instance => xanv instanceof instance);
   }

   toSql(column: string, value: any) {
      const xanv = this.schema[column];
      if (!xanv) {
         throw new Error(`Column ${column} does not exist in schema ${this.table}`);
      }

      if (xanv instanceof XqlJoin) {
         throw new Error(`Column ${column} is a relation and cannot be used in SQL queries`);
      }

      xanv.parse(value);

      if (this.iof(column, XqlIDField, XqlNumber, XqlString, XqlEnum, XqlUnion)) {
         return value
      } else if (this.iof(column, XqlObject, XqlRecord, XqlArray, XqlMap, XqlSet, XqlTuple)) {
         if (this.iof(column, XqlMap, XqlSet)) {
            value = [...value]
         }
         return JSON.stringify(value);
      } else if (this.iof(column, XqlDate)) {
         return (value as Date).toISOString().slice(0, 19).replace('T', ' ');
      } else if (this.iof(column, XqlBoolean)) {
         return value ? 1 : 0;
      }
   }

   toValue(column: string, value: any) {
      const xanv = this.schema[column];
      if (!xanv) {
         throw new Error(`Column ${column} does not exist in schema ${this.table}`);
      }

      if (xanv instanceof XqlJoin) {
         throw new Error(`Column ${column} is a relation and cannot be used in SQL queries`);
      }

      if (value === null || value === undefined) {
         return null;
      }

      if (this.iof(column, XqlIDField, XqlNumber, XqlString, XqlEnum, XqlUnion)) {
         return value
      } else if (this.iof(column, XqlObject, XqlRecord, XqlArray, XqlMap, XqlSet, XqlTuple)) {
         value = JSON.parse(value);
         if (this.iof(column, XqlMap)) {
            value = new Map(value);
         } else if (this.iof(column, XqlSet)) {
            value = new Set(value);
         }
         return value;
      } else if (this.iof(column, XqlDate)) {
         return new Date(value);
      } else if (this.iof(column, XqlBoolean)) {
         return Boolean(value);
      }

      return value;
   }

}

export default SchemaBase;