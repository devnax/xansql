import Schema from "../..";
import { chunkArray } from "../../../utils/chunker";
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
      const { results } = await model.execute(sql)

      // remove groupBy columns from results
      if (this.removeGroupByColumns && results.length && args.groupBy && args.groupBy.length) {
         const groupBySet = new Set(args.groupBy)
         for (let { chunk } of chunkArray(results)) {
            for (let row of chunk) {
               for (let column of groupBySet) {
                  delete row[column]
               }
            }
         }
      }

      return results
   }
}

export default AggregateExecuter