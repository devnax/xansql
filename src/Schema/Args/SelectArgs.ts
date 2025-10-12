import Schema from "..";
import { isObject } from "../../utils";
import Foreign, { ForeignInfoType } from "../include/Foreign";
import { SelectArgsType } from "../type";
import DistinctArgs from "./DistinctArgs";
import LimitArgs from "./LimitArgs";
import OrderByArgs from "./OrderByArgs";
import WhereArgs from "./WhereArgs";

export type SelectArgsRelationInfo = {
   args: {
      select: {
         sql: string,
         columns: string[],
         relations?: SelectArgsRelations
      },
      where: string,
      limit: Required<LimitArgs>,
      orderBy: string
   },
   foreign: ForeignInfoType
}

type SelectArgsRelations = {
   [column: string]: SelectArgsRelationInfo
}

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
   readonly relations: SelectArgsRelations = {}


   /**
    * Get Relations
    * @description Returns the relations to be selected
    * @returns {SelectArgsRelations} Object containing relation information
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
            if (Foreign.isSchema(field) && value === true) {
               this.columns.push(column)
               continue
            }

            const foreign = Foreign.info(model, column)
            const FModel = model.xansql.getModel(foreign.table)

            if (value === true) {
               value = {
                  select: {},
               }
            }
            if (isObject(value)) {
               let fargs: any = {}
               let select = value.select || {}
               if (Object.keys(select).length === 0) {
                  for (let column in FModel.schema) {
                     let field = FModel.schema[column]
                     if (!Foreign.is(field)) {
                        select[column] = true
                     }
                  }
               }
               select[foreign.relation.main] = true // always select main key
               const Select = new SelectArgs(FModel, select)
               fargs.select = {
                  sql: Select.sql,
                  columns: Select.columns,
                  relations: Select.relations,
               }
               const Where = new WhereArgs(FModel, value.where || {})
               fargs.where = Where.wheres.join(" AND ")
               fargs.orderBy = (new OrderByArgs(FModel, value.orderBy || {})).sql

               const limit = new LimitArgs(FModel, value.limit || {})
               fargs.limit = {
                  take: limit.take,
                  skip: limit.skip,
               }

               if (value.distinct) {
                  const distinct = new DistinctArgs(FModel, value.distinct || [], Where, value.orderBy)
                  if (distinct.sql) {
                     fargs.where += fargs.where ? ` AND ${distinct.sql}` : `WHERE ${distinct.sql}`
                  }
               }

               this.relations[column] = {
                  args: fargs,
                  foreign
               }
            } else {
               throw new Error(`Invalid select args for foreign key ${model.table}.${column}`);
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