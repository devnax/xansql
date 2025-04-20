import Column from "./core/Column";
import IDField from "./core/IDField";
import Relation from "./core/Relation";
import { SchemaMap } from "./types";

// Numeric: INT, BIGINT, DECIMAL, NUMERIC, FLOAT
export const integer = () => new Column(`integer`);
export const bigInteger = () => new Column('bigInteger');
export const tinyint = () => new Column('tinyint');
export const decimal = (length = 10, decimal = 2) => new Column(`decimal`, [length, decimal]);
export const float = () => new Column('float');
export const boolean = () => new Column('boolean');

// String: CHAR, VARCHAR, TEXT, ENUM, BLOB
export const string = (length = 255) => new Column(`string`, [length]);
export const text = () => new Column('text');

// Date/Time: DATE, TIMESTAMP, DATETIME, TIME
export const date = () => new Column('date');
export const time = () => new Column('time');
export const datetime = () => new Column('datetime');
export const timestamp = () => new Column('timestamp');

// JSON: JSON, JSONB
export const json = () => new Column('json');
export const jsonb = () => new Column('jsonb');
export const binary = (length = 16) => new Column(`binary`, [length]);

export const uuid = () => new Column('uuid');
export const enums = (values: string[]) => new Column(`enum`, values);

export const id = () => new IDField();
export const unique = (length = 255) => string(length).unique();

export const createdAt = () => timestamp().default('CURRENT_TIMESTAMP');
export const updatedAt = () => timestamp().default('CURRENT_TIMESTAMP').onUpdateCurrentTimestamp();

export const reference = (table: string, foreignKey: string) => integer().references(table, foreignKey);
export const relation = (column: string, table?: string,) => new Relation(column, table);


class Schema {
   schema: SchemaMap = {} as any;

   constructor(schema: SchemaMap) {
      this.schema = schema || {}
      let id_count = 0
      for (let column in schema) {
         const value = schema[column]
         this.validateColumn(value)
         if (value instanceof IDField) {
            id_count++
         }
      }

      if (id_count > 1) {
         throw new Error(`Schema can only have one ID field`)
      }

      if (id_count === 0) {
         throw new Error("Schema must have one ID field");
      }
   }

   private validateColumn(value: any) {
      const is = value instanceof Column || value instanceof Relation || value instanceof IDField
      if (!is) {
         throw new Error(`Invalid schema type for column ${value}`)
      }
   }

   add(schema: SchemaMap) {
      for (let column in schema) {
         const value = schema[column]
         this.validateColumn(value)
         if (value instanceof IDField) {
            throw new Error(`${column} cannot be added to schema, it already exists`);
         }
      }
      this.schema = { ...this.schema, ...schema }
   }

   get() {
      return this.schema
   }
}

export default Schema;