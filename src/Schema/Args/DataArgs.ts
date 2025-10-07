import Schema from ".."
import XqlDate from "../../Types/fields/Date"
import { isArray, isNumber, isObject } from "../../utils"
import Foreign from "../include/Foreign"
import ValueFormatter from "../include/ValueFormatter"
import { DataArgsType } from "../type"


type DataObject = { [column: string]: any }
type ArgsMode = "create" | "update"
type RelationObject = { [relation: string]: DataArgsType }

type DataValue = {
   data: DataObject,
   relations: RelationObject
   sql: string
}

class DataArgs {

   /**
   * Generate SQL for data
   * For create mode: (col1, col2, col3) VALUES (val1, val2, val3)
   * For update mode: col1 = val1, col2 = val2, col3 = val3
   */
   private data: DataObject = {}

   /**
   * Get data object
   * format: { col1: val1, col2: val2, col3: val3 }
   */
   private relations: RelationObject = {}

   /**
    * Get relations object. the object is not processed yet. it will be processed later in excuter
    * format: { relation1: data1, relation2: data2 }
    */
   private sql: string = ''


   /**
    * Get stack of data and relations for nested create or update
    * format: [{ data: { col1: val1, col2: val2 }, relations: { relation1: data1 }, sql: '(col1, col2) VALUES (val1, val2)' }, ...]
    */
   readonly values: DataValue[] = []


   constructor(model: Schema, data: DataArgsType | DataArgsType[], mode: ArgsMode = "create") {

      if (Array.isArray(data)) {
         for (let item of data) {
            if (!isObject(item)) {
               throw new Error(`Invalid data item in array for model ${model.table}. Expected object, got ${typeof item}`);
            }
            const dataArgs = new DataArgs(model, item, mode)
            this.values.push(...dataArgs.values)
         }
      } else {
         for (let column in data) {
            const field = model.schema[column]
            let value: any = data[column]


            if (Foreign.is(field)) {
               if (Foreign.isSchema(field)) {
                  if (isNumber(value)) {
                     this.data[column] = ValueFormatter.toSql(model, column, value)
                  } else {
                     throw new Error(`Invalid value for foreign key column ${model.table}.${column}. Expected number, got ${typeof value}`);
                  }
               } else {
                  // array of foreign keys
                  if (isObject(value) || isArray(value)) {
                     this.relations[column] = value
                  } else {
                     throw new Error(`Invalid value for foreign key column ${model.table}.${column}. Expected object or array, got ${typeof value}`);
                  }
               }
            } else {
               // check is the field is IDField or created_at or updated_at
               if (model.IDColumn === column || field instanceof XqlDate && (field.meta.update || field.meta.create)) {
                  throw new Error(`Cannot set value for ${model.table}.${column}. It is automatically managed.`);
               }

               this.data[column] = ValueFormatter.toSql(model, column, value)
            }
         }


         /**
          * Auto add missing columns with null value for create mode
          * Auto add updated_at column with current timestamp for update mode
          * Skip foreign key columns which are not optional or nullable in create mode
          * Skip ID column in create mode
          * Skip created_at column in update mode
          * Skip updated_at column in create mode
          * Skip columns which are already set in data
          */
         for (let column in model.schema) {
            const field = model.schema[column]
            if (mode === 'create') {
               // adding others columns which are not set in data
               if (column in this.data || column === model.IDColumn) continue
               if (Foreign.is(field)) {

                  // if foreign key is not optional or nullable, throw error
                  if (Foreign.isSchema(field) && !(field.meta.optional || field.meta.nullable)) {
                     throw new Error(`Foreign key column ${model.table}.${column} is required in create data.`);
                  }
                  continue
               }
               this.data[column] = ValueFormatter.toSql(model, column, null)
            } else {
               // added updated_at field automatically
               if (field instanceof XqlDate && field.meta.update) {
                  this.data[column] = ValueFormatter.toSql(model, column, new Date())
               }
            }
         }

         // generate sql
         const keys = Object.keys(this.data)
         if (mode === "create") {
            this.sql = `(${keys.join(", ")}) VALUES (${keys.map(k => this.data[k]).join(", ")})`
         } else {
            this.sql = keys.map(col => `${col} = ${this.data[col]}`).join(", ")
         }

         this.values.push({ sql: this.sql, data: this.data, relations: this.relations })
      }
   }

}

export default DataArgs