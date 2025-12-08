import Model from "../.."
import Foreign, { ForeignInfoType } from "../../../core/classes/ForeignInfo"
import XansqlError from "../../../core/XansqlError"
import XqlDate from "../../../xt/fields/Date"
import { iof, isArray, isNumber, isObject } from "../../../utils"
import ValueFormatter from "../../include/ValueFormatter"
import { DataArgsType, UpdateDataRelationArgs } from "../../types"


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

   private errors: XansqlError[] = []

   constructor(model: Model, data: DataArgsType) {

      for (let column in data) {
         const field = model.schema[column]
         let value: any = data[column]
         try {

            if (Foreign.is(field)) {
               if (Foreign.isSchema(field)) {
                  if (isNumber(value)) {
                     this.data[column] = value
                  } else {
                     throw new XansqlError({
                        message: `Invalid value for foreign key column ${model.table}.${column}. Expected number (ID), got ${typeof value}`,
                        model: model.table,
                        column: column
                     });
                  }
               } else {
                  // relation operation
                  if (!isObject(value)) {
                     throw new XansqlError({
                        message: `Invalid value for relation column ${model.table}.${column}. Expected object for relation operations, got ${typeof value}`,
                        model: model.table,
                        column: column
                     });
                  }

                  if (value.delete && !isObject(value.delete.where)) {
                     throw new XansqlError({
                        message: `Invalid value for relation delete operation in column ${model.table}.${column}. 'where' field is required and must be an object.`,
                        model: model.table,
                        column: column
                     });
                  }

                  if (value.update && (!isObject(value.update.where) || !isObject(value.update.data))) {
                     throw new XansqlError({
                        message: `Invalid value for relation update operation in column ${model.table}.${column}. 'where' and 'data' fields are required and must be objects.`,
                        model: model.table,
                        column: column
                     });
                  }

                  if (value.create && (!isObject(value.create.data) && !isArray(value.create.data))) {
                     throw new XansqlError({
                        message: `Invalid value for relation create operation in column ${model.table}.${column}. 'data' field is required and must be an object or array.`,
                        model: model.table,
                        column: column
                     });
                  }

                  if (value.upsert && (!isObject(value.upsert.where) || !isObject(value.upsert.create) || !isObject(value.upsert.update))) {
                     throw new XansqlError({
                        message: `Invalid value for relation upsert operation in column ${model.table}.${column}. 'where', 'create', and 'update' fields are required and must be objects.`,
                        model: model.table,
                        column: column
                     });
                  }

                  const foreign = Foreign.get(model, column)
                  this.relations[column] = {
                     args: value,
                     foreign
                  }
               }
            } else {
               // check is the field is IDField or created_at or updated_at
               if (model.IDColumn === column || iof(field, XqlDate) && (field.meta.update || field.meta.create)) {
                  throw new XansqlError({
                     message: `Cannot set value for ${model.table}.${column}. It is automatically managed.`,
                     model: model.table,
                     column: column
                  });
               }

               if (iof(value, File)) {
                  this.files[column] = value
                  this.data[column] = ""
                  ValueFormatter.toSql(model, column, value) // for validation
               } else {
                  this.data[column] = ValueFormatter.toSql(model, column, value)
               }
            }
         } catch (error: any) {
            if (iof(error, XansqlError)) {
               this.errors.push(error);
            } else {
               throw error
            }
         }
      }

      if (this.errors.length > 0) {
         throw this.errors
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
         if (iof(field, XqlDate) && field.meta.update) {
            this.data[column] = ValueFormatter.toSql(model, column, new Date())
         }
      }

   }

}

export default UpdateDataArgs