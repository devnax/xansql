import Schema from "../..";
import WhereArgs from "../../Args/WhereArgs";
import { AggregateArgsType } from "../../type";
import LimitArgs from "../Find/LimitArgs";
import OrderByArgs from "../Find/OrderByArgs";
import SelectArgs from "./SelectArgs";

class AggregateExecuter {

   private model: Schema
   private removeGroupByColumns: boolean
   constructor(model: Schema, removeGroupByColumns: boolean = true) {
      this.model = model
      this.removeGroupByColumns = removeGroupByColumns
   }

   async execute(args: AggregateArgsType) {
      const model = this.model
      if (model.options?.hooks && model.options.hooks.beforeAggregate) {
         args = await model.options.hooks.beforeAggregate(args)
      }

      const select = new SelectArgs(model, args.select || {})
      const Where = new WhereArgs(model, args.where || {})
      const OrderBy = new OrderByArgs(model, args.orderBy || {})
      let LimitSql = ""

      if (args.groupBy && args.groupBy.length) {
         LimitSql = (new LimitArgs(model, args.limit || {})).sql
      }

      if (!LimitSql && Object.keys(args.limit || {}).length) {
         LimitSql = (new LimitArgs(model, args.limit || {})).sql
      }

      let sql = `SELECT `
      let groupBySql = ""
      if (args.groupBy && args.groupBy.length) {
         // check column is exists
         for (let column of args.groupBy) {
            if (!model.schema[column]) {
               throw new Error(`Column ${column} not found in model ${model.table} for aggregate groupBy`)
            }
         }
         sql += args.groupBy.join(", ") + ", "
         groupBySql = ` GROUP BY ${args.groupBy.join(", ")} `
      }
      sql += `${select.sql} FROM ${model.table} ${Where.sql}${groupBySql}${OrderBy.sql}${LimitSql}`.trim()
      const { result } = await model.execute(sql)

      // remove groupBy columns from result
      if (this.removeGroupByColumns && result.length && args.groupBy && args.groupBy.length) {
         const groupBySet = new Set(args.groupBy)
         for (let row of result) {
            for (let column of groupBySet) {
               delete row[column]
            }
         }
      }

      if (model.options?.hooks && model.options.hooks.afterAggregate) {
         return await model.options.hooks.afterAggregate(result, args)
      }

      return result
   }
}

export default AggregateExecuter