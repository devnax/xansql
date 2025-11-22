import Model from "../.."
import Foreign, { ForeignInfoType } from "../../../core/classes/ForeignInfo"
import XqlDate from "../../../Types/fields/Date"
import { isArray, isNumber, isObject } from "../../../utils"
import ValueFormatter from "../../include/ValueFormatter"
import { DataArgsType, UpdateDataRelationArgs } from "../../type"


type DataObject = { [column: string]: any }
type RelationObject = {
   [column: string]: {
      args: UpdateDataRelationArgs
      foreign: ForeignInfoType;
      relations?: RelationObject
   }
}

type Files = {
   [column: string]: File
}

type DataValue = {
   relations: RelationObject
   sql: string
}

class UpdateDataArgs {

   /**
   * Generate SQL for data
   * For create mode: (col1, col2, col3) VALUES (val1, val2, val3)
   * For update mode: col1 = val1, col2 = val2, col3 = val3
   */
   readonly data: DataObject = {}

   readonly files: Files = {}
   /**
   * Get data object
   * format: { col1: val1, col2: val2, col3: val3 }
   */
   readonly relations: RelationObject = {}

   constructor(model: Model, data: DataArgsType) {

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
               // relation operation
               if (!isObject(value)) {
                  throw new Error(`Invalid value for relation column ${model.table}.${column}. Expected object, got ${typeof value}`);
               }

               if (value.delete && !isObject(value.delete.where)) {
                  throw new Error(`Invalid value for relation delete operation 'where' field in column ${model.table}.${column}. Expected object, got ${typeof value.delete.where}`);
               }

               if (value.update && (!isObject(value.update.where) || !isObject(value.update.data))) {
                  throw new Error(`Invalid value for relation update operation in column ${model.table}.${column}. 'where' and 'data' fields are required and must be objects.`);
               }

               if (value.create && (!isObject(value.create.data) && !isArray(value.create.data))) {
                  throw new Error(`Invalid value for relation create operation 'data' field in column ${model.table}.${column}. Expected object or array, got ${typeof value.create.data}`);
               }

               if (value.upsert && (!isObject(value.upsert.where) || !isObject(value.upsert.create) || !isObject(value.upsert.update))) {
                  throw new Error(`Invalid value for relation upsert operation in column ${model.table}.${column}. 'where', 'create' and 'update' fields are required and must be objects.`);
               }

               const foreign = Foreign.get(model, column)
               this.relations[column] = {
                  args: value,
                  foreign
               }
            }
         } else {
            // check is the field is IDField or created_at or updated_at
            if (model.IDColumn === column || field instanceof XqlDate && (field.meta.update || field.meta.create)) {
               throw new Error(`Cannot set value for ${model.table}.${column}. It is automatically managed.`);
            }

            if (value instanceof File) {
               this.files[column] = value
               this.data[column] = ""
               ValueFormatter.toSql(model, column, value) // for validation
            } else {
               this.data[column] = ValueFormatter.toSql(model, column, value)
            }
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
         if (field instanceof XqlDate && field.meta.update) {
            this.data[column] = ValueFormatter.toSql(model, column, new Date())
         }
      }

   }

}

export default UpdateDataArgs