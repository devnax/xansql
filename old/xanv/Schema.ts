import XqlIDField from "./fields/IDField";
import { XansqlSchemaColumns } from "./types";

class Schema {
   readonly table: string;
   readonly columns: XansqlSchemaColumns;
   readonly IDColumn: string = '';

   constructor(table: string, columns: XansqlSchemaColumns) {
      this.table = table;
      this.columns = columns;

      for (let column in columns) {
         const field = columns[column];
         if (field instanceof XqlIDField) {
            this.IDColumn = column;
            break
         }
      }
      if (!this.IDColumn) {
         throw new Error(`Schema ${this.table} must have an id column`);
      }
   }

   getColumn(name: string) {
      if (!this.columns[name]) {
         throw new Error(`Column ${name} does not exist in schema ${this.table}`);
      }
      return this.columns[name];
   }

   hasColumn(name: string) {
      return !!this.columns[name];
   }


   // toSQL(columns: Partial<XansqlSchemaColumns> = {}) {
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
