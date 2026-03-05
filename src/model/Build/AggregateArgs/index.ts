import Model from "../..";
import XansqlError from "../../../core/XansqlError";
import { AggregateArgs } from "../../types";
import BuildAggregateSelectArgs from "../AggregateSelectArgs";
import BuildLimitArgs from "../LimitArgs";
import BuildOrderByArgs from "../OrderByArgs";
import BuildWhereArgs from "../WhereArgs";

class BuildAggregateArgs {

   constructor(private args: AggregateArgs<any, any>, private model: Model<any>) {
   }

   async results() {
      const args = this.args
      const model = this.model
      const schema = model.schema()

      const wargs = new BuildWhereArgs(args.where || {}, model)
      const sargs = new BuildAggregateSelectArgs(args.select, model)
      const oargs = new BuildOrderByArgs(args.orderBy || {}, model)
      const largs = new BuildLimitArgs(args.limit || {} as any, model)

      let columns: string[] = []
      let groupBySql = ""
      if (args.groupBy && args.groupBy.length) {
         for (let column of args.groupBy) {
            if (!schema[column]) {
               throw new XansqlError({
                  code: "VALIDATION_ERROR",
                  message: `Column ${column} not found in model ${model.table} for groupBy`,
                  model: model.table,
                  field: column as any
               });
            }
         }
         columns.push(args.groupBy.join(", "))
         groupBySql = ` GROUP BY ${args.groupBy.join(", ")} `
      }

      if (args.orderBy && Object.keys(args.orderBy).length) {
         if (!args.groupBy?.length) {
            throw new XansqlError({
               code: "VALIDATION_ERROR",
               message: `Cannot use orderBy without specifying groupBy.`,
               model: model.table,
            });
         }

         for (let col in args.orderBy) {
            if (!args.groupBy.includes(col)) {
               throw new XansqlError({
                  code: "VALIDATION_ERROR",
                  message: `Cannot order by "${col}" without including it in groupBy.`,
                  model: model.table,
               });
            }
         }
      }

      let sql = `SELECT ${columns.length ? columns.join(", ") + "," : ""} ${sargs.sql} 
                     FROM ${model.table} as ${model.alias}
                     ${wargs.sql} ${groupBySql}
                     ${oargs.sql} 
                     ${args.groupBy?.length ? largs.sql : ""}
                  `.trim()
      sql = sql.replace(/\s+/gi, " ")
      const execute = await model.execute(sql)
      return execute.results
   }
}

export default BuildAggregateArgs