import Schema from "..";
import { isObject } from "../../utils";
import Foreign, { ForeignInfoType } from "../include/Foreign";
import { FindArgsType, SelectArgsType } from "../type";

type RelationInfo = { [column: string]: { args: FindArgsType, foreign: ForeignInfoType } }

class SelectArgs {
   private model: Schema

   /**
    * Get Columns
    * @description Returns the columns to be selected
    * @returns {string[]} Array of column names
    */
   readonly columns: string[] = []

   /**
    * Get SQL
    * @description Returns the SQL string for the selected columns
    * @returns {string} SQL string for selected columns
    * @example
    * const sql = selectArgs.sql; // returns "table.column1, table.column2, ..."
    */
   readonly relations: RelationInfo = {}


   /**
    * Get Relations
    * @description Returns the relations to be selected
    * @returns {RelationInfo} Object containing relation information
    * @example
    * const relations = selectArgs.relations; // returns { column: { args: FindArgsType, foreign: ForeignInfoType }, ... }
    */
   readonly sql: string = ''


   constructor(model: Schema, args: SelectArgsType) {
      this.model = model

      for (let column in args) {
         this.checkColumnIsExist(column)
         let field = model.schema[column]
         let value: any = args[column]

         if (Foreign.is(field)) {
            let fargs: any = {}
            if (Foreign.isSchema(field) && value === true) {
               this.columns.push(column)
            } else {
               if (isObject(value)) {
                  fargs.select = value.select || {}
                  fargs.where = value.where || {}
                  if (value.limit) fargs.limit = value.limit
                  if (value.orderBy) fargs.orderBy = value.orderBy
               } else {
                  throw new Error(`Arguments for foreign key ${model.table}.${column} must be an object`);
               }
               this.relations[column] = {
                  args: fargs,
                  foreign: Foreign.info(model, column)
               }
            }
         } else {
            this.columns.push(column)
         }
      }

      // if no columns are selected, select all columns
      if (this.columns.length === 0) {
         for (let column in model.schema) {
            let field = model.schema[column]
            if (!Foreign.is(field)) {
               this.columns.push(column)
            }
         }
      }

      // always include ID column
      if (!this.columns.includes(model.IDColumn)) {
         this.columns.unshift(model.IDColumn)
      }

      this.sql = this.columns.map(col => `${this.model.table}.${col}`).join(', ')
   }

   private checkColumnIsExist(column: string) {
      if (!(column in this.model.schema)) {
         throw new Error(`Column ${column} does not exist in model ${this.model.table}`);
      }
   }

}

export default SelectArgs