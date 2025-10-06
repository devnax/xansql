import Schema from "..";
import { isObject } from "../../utils";
import Foreign, { ForeignInfoType } from "../include/Foreign";
import { FindArgs, SelectArgsType } from "../type";

type RelationInfo = { [column: string]: { args: FindArgs, foreign: ForeignInfoType } }

/**
 * Select Arguments Class 
 * @description This class is used to handle the select arguments for a query
 * @example
 * const selectArgs = new SelectArgs(model, args);
 * const columns = selectArgs.columns; // returns the columns to be selected
 * const relations = selectArgs.relations; // returns the relations to be selected
 */

class SelectArgs {
   model: Schema
   args: any

   private _columns: string[] = []
   private _relations: RelationInfo = {}


   constructor(model: Schema, args: SelectArgsType) {
      this.model = model
      this.args = args

      for (let column in args) {
         this.checkColumnIsExist(column)
         let field = model.schema[column]
         let value: any = args[column]

         if (Foreign.is(field)) {
            let fargs: any = {}
            if (isObject(value)) {
               fargs.select = value.select || {}
               fargs.where = value.where || {}
               if (value.limit) fargs.limit = value.limit
               if (value.orderBy) fargs.orderBy = value.orderBy
            } else {
               throw new Error(`Arguments for foreign key ${model.table}.${column} must be an object`);
            }
            this._relations[column] = {
               args: fargs,
               foreign: Foreign.info(model, column)
            }

         } else {
            this._columns.push(column)
         }
      }

      // if no columns are selected, select all columns
      if (this._columns.length === 0) {
         for (let column in model.schema) {
            let field = model.schema[column]
            if (!Foreign.is(field)) {
               this._columns.push(column)
            }
         }
      }

      // always include ID column
      if (!this._columns.includes(model.IDColumn)) {
         this._columns.unshift(model.IDColumn)
      }
   }

   private checkColumnIsExist(column: string) {
      if (!(column in this.model.schema)) {
         throw new Error(`Column ${column} does not exist in model ${this.model.table}`);
      }
   }

   /**
    * Get Columns
    * @description Returns the columns to be selected
    * @returns {string[]} Array of column names
    */
   get columns(): string[] {
      return this._columns
   }

   get sql() {
      return this._columns.map(col => `${this.model.table}.${col}`).join(', ')
   }

   get relations() {
      return this._relations
   }



}

export default SelectArgs