import Model from "../..";
import { FindArgsAggregate, FindArgsType, SelectArgsType } from "../../types";
import DistinctArgs from "./DistinctArgs";
import LimitArgs from "./LimitArgs";
import OrderByArgs from "./OrderByArgs";
import WhereArgs from "../../Args/WhereArgs";
import ValueFormatter from "../../include/ValueFormatter";
import XqlEnum from "../../../xt/fields/Enum";
import XqlArray from "../../../xt/fields/Array";
import XqlObject from "../../../xt/fields/Object";
import XqlRecord from "../../../xt/fields/Record";
import XqlTuple from "../../../xt/fields/Tuple";
import XqlUnion from "../../../xt/fields/Union";
import Foreign, { ForeignInfoType } from "../../../core/classes/ForeignInfo";
import XqlFile from "../../../xt/fields/File";
import XansqlError from "../../../core/XansqlError";
import { iof } from "../../../utils";

export type SelectArgsRelationInfo = {
   args: {
      select: {
         sql: string,
         columns: string[],
         formatable_columns: string[],
         relations?: SelectArgsRelations,
      },
      where: string,
      limit: Required<LimitArgs>,
      orderBy: string
      aggregate: FindArgsAggregate,
   },
   foreign: ForeignInfoType
}

type SelectArgsRelations = {
   [column: string]: SelectArgsRelationInfo
}

class SelectArgs {
   private model: Model

   /**
    * Get Columns
    * @description Returns the columns to be selected
    * @returns {string[]} Array of column names
    */
   readonly columns: string[] = []


   /**
    * Get Formatable Columns
    */
   readonly formatable_columns: string[] = []

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


   constructor(model: Model, args: SelectArgsType) {
      this.model = model

      for (let column in args) {
         if (!(column in this.model.schema)) {
            throw new XansqlError({
               message: `Column ${column} not found in model ${model.table} for select`,
               model: model.table,
               column: column
            });
         }

         const field = model.schema[column]
         let value: boolean | FindArgsType = args[column]

         if (Foreign.is(field)) {

            const relArgs = value === true ? { select: {} } : value as FindArgsType

            if (Foreign.isSchema(field)) {
               this.columns.push(column)
            }

            const foreign = Foreign.get(model, column)
            const FModel = model.xansql.getModel(foreign.table)


            // ====== Prepare select args for relation ======
            let fargs: any = {}
            const Select = new SelectArgs(FModel, relArgs.select || {})

            // ====== Prevent circular reference ======
            for (let rcol in Select.relations) {
               if (Select.relations[rcol].foreign.table === model.table) {
                  throw new XansqlError({
                     message: `Circular reference detected in relation ${column} of model ${model.table}`,
                     model: model.table,
                     column: column
                  });
               }
            }

            // ====== Make sure main column of relation is selected ======

            let columns = Select.columns
            if (!columns.includes(foreign.relation.main)) {
               columns.unshift(foreign.relation.main)
            }
            let sql = Select.sql
            let relcol = `${foreign.table}.${foreign.relation.main}`
            sql = sql.includes(relcol) ? sql : `${sql}, ${relcol}`

            fargs.select = {
               sql,
               columns,
               formatable_columns: Select.formatable_columns,
               relations: Select.relations,
            }

            // ==== Where =====
            const Where = new WhereArgs(FModel, relArgs.where || {})
            fargs.where = Where.wheres.join(" AND ")

            // ===== OrderBy =====
            fargs.orderBy = (new OrderByArgs(FModel, relArgs.orderBy || {})).sql

            // ===== Limit =====
            fargs.limit = new LimitArgs(FModel, relArgs.limit || {})

            // ===== Distinct =====
            if (relArgs.distinct) {
               const distinct = new DistinctArgs(FModel, relArgs.distinct || [], Where, relArgs.orderBy)
               if (distinct.sql) {
                  fargs.where += fargs.where ? ` AND ${distinct.sql}` : `WHERE ${distinct.sql}`
               }
            }

            // ===== Aggregate =====
            if (relArgs.aggregate && Object.keys(relArgs.aggregate).length) {
               fargs.aggregate = relArgs.aggregate
            }

            this.relations[column] = {
               args: fargs,
               foreign
            }

         } else {
            if (iof(field, XqlFile, XqlEnum, XqlArray, XqlObject, XqlRecord, XqlTuple, XqlUnion)) {
               this.formatable_columns.push(column)
            }
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


}

export default SelectArgs