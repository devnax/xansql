import Model from "../.."
import Foreign, { ForeignInfoType } from "../../../core/classes/ForeignInfo"
import XansqlError from "../../../core/XansqlError"
import XqlDate from "../../../xt/fields/Date"
import { iof, isArray, isNumber, isObject } from "../../../utils"
import ValueFormatter from "../../include/ValueFormatter"
import { DataArgsType } from "../../types"


type DataObject = { [column: string]: any }
type RelationObject = {
   [column: string]: {
      data: DataArgsType[],
      foreign: ForeignInfoType
   }
}

type Files = {
   [column: string]: File
}
type DataValue = {
   relations: RelationObject
   data: DataObject,
   files: Files
}

class CreateDataArgs {

   /**
   * Generate SQL for data
   * For create mode: (col1, col2, col3) VALUES (val1, val2, val3)
   * For update mode: col1 = val1, col2 = val2, col3 = val3
   */
   private data: DataObject = {}

   private files: Files = {}

   /**
   * Get data object
   * format: { col1: val1, col2: val2, col3: val3 }
   */
   private relations: RelationObject = {}

   /**
    * Get stack of data and relations for nested create or update
    * format: [{ data: { col1: val1, col2: val2 }, relations: { relation1: data1 }, sql: '(col1, col2) VALUES (val1, val2)' }, ...]
    */
   readonly values: DataValue[] = []

   private errors: XansqlError[] = []


   constructor(model: Model, data: DataArgsType | DataArgsType[]) {

      if (Array.isArray(data)) {
         for (let item of data) {
            if (!isObject(item)) {
               throw new XansqlError({
                  message: `Invalid data item for model ${model.table}. Expected object, got ${typeof item}`,
                  model: model.table
               });
            }
            const dataArgs = new CreateDataArgs(model, item)
            this.values.push(...dataArgs.values)
         }
      } else {
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
                           message: `Invalid value for foreign key column ${model.table}.${column}. Expected number, got ${typeof value}`,
                           model: model.table,
                           column: column
                        });
                     }
                  } else {
                     // array of foreign keys
                     if (isObject(value) || isArray(value)) {
                        const foreign = Foreign.get(model, column)
                        let rdatas = isObject(value) ? [value] : value

                        if (rdatas.length === 0) {
                           throw new XansqlError({
                              message: `Relation data array for column ${model.table}.${column} cannot be empty.`,
                              model: model.table,
                              column: column
                           });
                        }

                        this.relations[column] = {
                           data: rdatas,
                           foreign
                        }
                     } else {
                        throw new XansqlError({
                           message: `Invalid value for relation column ${model.table}.${column}. Expected object or array, got ${typeof value}`,
                           model: model.table,
                           column: column
                        });
                     }
                  }
               } else {
                  // check is the field is IDField or created_at or updated_at
                  if (model.IDColumn === column || iof(field, XqlDate) && (field.meta.update || (field.meta.create || field.meta.update))) {
                     throw new XansqlError({
                        message: `Cannot set value for ${model.table}.${column}. It is automatically managed.`,
                        model: model.table,
                        column: column
                     });
                  }
                  if (iof(value, File)) {
                     this.files[column] = value
                     this.data[column] = ''
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
            if (column in this.data || column === model.IDColumn) continue

            const field = model.schema[column]
            if (Foreign.is(field)) {
               // if foreign key is not optional or nullable, throw error
               if (Foreign.isSchema(field) && !(field.meta.optional || field.meta.nullable)) {
                  this.errors.push(new XansqlError({
                     message: `Foreign key column ${model.table}.${column} is required. Cannot create record without it.`,
                     model: model.table,
                     column: column
                  }))
               }
            } else if (iof(field, XqlDate) && (field.meta.create || field.meta.update)) {
               this.data[column] = ValueFormatter.toSql(model, column, new Date())
            } else {
               this.data[column] = ValueFormatter.toSql(model, column, null)
            }
         }

         // generate sql
         // const keys = Object.keys(this.data)
         // let sql = `(${keys.join(", ")}) VALUES (${keys.map(k => this.data[k]).join(", ")})`

         this.values.push({
            // sql,
            relations: this.relations,
            data: this.data,
            files: this.files
         })
      }
   }
}

export default CreateDataArgs