import xtype from ".";
import XqlIDField from "./fields/IDField";
import XqlJoin from "./fields/Join";
import { XansqlSchemaObject } from "./types";

class Schema {
   private readonly schemaObject: XansqlSchemaObject;
   readonly table: string;
   readonly IDColumn: string = '';
   readonly columns = {
      main: [] as string[],
      relation: [] as string[],
   }
   readonly relationColumns: string[] = [];

   constructor(table: string, schema: XansqlSchemaObject) {
      this.table = table;
      this.schemaObject = schema;

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

   get() {
      return this.schemaObject;
   }

   // toSQL(columns: Partial<XansqlSchemaObject> = {}) {
   //    let sqlValues: { [key: string]: any } = {};
   //    for (const [key, value] of Object.entries(columns)) {
   //       const col = this.columns[key];
   //       if (!col) {
   //          throw new Error(`Column ${key} does not exist in schema ${this.table}`);
   //       }
   //       if (col instanceof Schema) {
   //          sqlValues[key] = col.toSQL(value as any);
   //          continue;
   //       }
   //       if (col instanceof Relation) {
   //          sqlValues[key] = value; // For relations, we just pass the value as is
   //          continue;
   //       }
   //       sqlValues[key] = col.parse(value);
   //       if (col instanceof XqlObject || col instanceof XqlRecord || col instanceof XqlArray || col instanceof XqlTuple) {
   //          sqlValues[key] = JSON.stringify(sqlValues[key]);
   //       } else if (col instanceof XqlDate) {
   //          sqlValues[key] = sqlValues[key].toISOString();
   //       } else if (col instanceof XqlBoolean) {
   //          sqlValues[key] = sqlValues[key] ? 1 : 0;
   //       } else if (col instanceof XqlMap || col instanceof XqlSet) {
   //          sqlValues[key] = JSON.stringify(Array.from(sqlValues[key]));
   //       }
   //    }
   //    return sqlValues
   // }

   // toValue(columns: Partial<XansqlSchemaColumns> = {}) {
   //    let values: { [key: string]: any } = {};
   //    for (const [key, value] of Object.entries(columns)) {
   //       const col = this.columns[key];
   //       if (!col) {
   //          throw new Error(`Column ${key} does not exist in schema ${this.table}`);
   //       }
   //       if (col instanceof Schema) {
   //          values[key] = col.toValue(value as any);
   //          continue;
   //       }
   //       values[key] = value
   //       if (col instanceof XqlObject || col instanceof XqlRecord || col instanceof XqlArray || col instanceof XqlTuple) {
   //          values[key] = JSON.parse(values[key]);
   //       } else if (col instanceof XqlDate) {
   //          values[key] = new Date(values[key]);
   //       } else if (col instanceof XqlBoolean) {
   //          values[key] = values[key] ? true : false;
   //       } else if (col instanceof XqlMap) {
   //          const parsedMap = JSON.parse(values[key]);
   //          values[key] = new Map(Object.entries(parsedMap));
   //       } else if (col instanceof XqlSet) {
   //          const parsedSet = JSON.parse(values[key]);
   //          values[key] = new Set(parsedSet);
   //       }
   //    }
   // }

}

export default Schema;
