import Schema from "../.."
import Foreign, { ForeignInfoType } from "../../../core/classes/ForeignInfo"
import XqlDate from "../../../Types/fields/Date"
import { isArray, isNumber, isObject } from "../../../utils"
import ValueFormatter from "../../include/ValueFormatter"
import { DataArgsType } from "../../type"


type DataObject = { [column: string]: any }
type RelationObject = {
   [column: string]: {
      data: DataArgsType[],
      foreign: ForeignInfoType
   }
}

type DataValue = {
   relations: RelationObject
   sql: string
}

class CreateDataArgs {

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
    * Get relations object. the object is not processed yet. it will be processed later in executer
    * format: { relation1: data1, relation2: data2 }
    */
   private sql: string = ''

   /**
    * Get stack of data and relations for nested create or update
    * format: [{ data: { col1: val1, col2: val2 }, relations: { relation1: data1 }, sql: '(col1, col2) VALUES (val1, val2)' }, ...]
    */
   readonly values: DataValue[] = []


   constructor(model: Schema, data: DataArgsType | DataArgsType[]) {

      if (Array.isArray(data)) {
         for (let item of data) {
            if (!isObject(item)) {
               throw new Error(`Invalid data item in array for model ${model.table}. Expected object, got ${typeof item}`);
            }
            const dataArgs = new CreateDataArgs(model, item)
            this.values.push(...dataArgs.values)
         }
      } else {
         for (let column in data) {
            const field = model.schema[column]
            let value: any = data[column]

            if (Foreign.is(field)) {
               if (Foreign.isSchema(field)) {
                  if (isNumber(value)) {
                     this.data[column] = value
                  } else {
                     throw new Error(`Invalid value for foreign key column ${model.table}.${column}. Expected number, got ${typeof value}`);
                  }
               } else {
                  // array of foreign keys
                  if (isObject(value) || isArray(value)) {
                     const foreign = Foreign.get(model, column)
                     const FModel = model.xansql.getModel(foreign.table)

                     // validiting relation data
                     let rdatas = isObject(value) ? [value] : value
                     for (let rdata of rdatas) {
                        if (foreign.column in rdata) {
                           throw new Error(`Cannot set foreign key column ${foreign.column} in relation data for model ${FModel.table}. It is automatically managed.`);
                        }
                        new CreateDataArgs(FModel, {
                           ...rdata,
                           [foreign.column]: 1
                        })
                     }

                     this.relations[column] = {
                        data: rdatas,
                        foreign
                     }
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
            if (column in this.data || column === model.IDColumn) continue

            const field = model.schema[column]
            if (Foreign.is(field)) {

               // if foreign key is not optional or nullable, throw error
               if (Foreign.isSchema(field) && !(field.meta.optional || field.meta.nullable)) {
                  throw new Error(`Foreign key column ${model.table}.${column} is required in create data.`);
               }
               continue
            }
            this.data[column] = ValueFormatter.toSql(model, column, null)
         }

         // generate sql
         const keys = Object.keys(this.data)
         this.sql = `(${keys.join(", ")}) VALUES (${keys.map(k => this.data[k]).join(", ")})`

         this.values.push({ sql: this.sql, relations: this.relations })
      }
   }

}

export default CreateDataArgs