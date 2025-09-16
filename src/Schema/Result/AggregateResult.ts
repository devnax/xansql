import Schema from ".."
import { isObject } from "../../utils"
import { AggregateArgs, AggregateArgsAggregate, LimitArgs, OrderByArgs } from "../type"
import WhereArgsQuery from "./WhereArgsQuery"

class AggregateResult {
   model: Schema
   private methods = ["count", "sum", "avg", "min", "max"]

   constructor(schema: Schema) {
      this.model = schema
   }

   async result(args: AggregateArgs) {
      const model = this.model
      const table = model.table

      let { groupBy, where, aggregate, orderBy, limit } = args

      orderBy = orderBy || {}
      let formated = this.formatAggregate(aggregate)
      let Where = new WhereArgsQuery(model, where || {})
      let limitSql = this.limit(limit || {})
      let OrderBy = this.orderby(orderBy || {}).concat(formated.orderby || [])

      let sql = `SELECT `
      sql += groupBy && groupBy.length ? groupBy.join(", ") + ", " : ""
      sql += formated.columns.join(", ")
      sql += ` FROM ${table} ${Where.sql}`
      sql += groupBy && groupBy.length ? ` GROUP BY ${groupBy.join(", ")} ` : ""
      sql += OrderBy.length ? ` ORDER BY ${OrderBy.join(", ")} ` : ""
      sql += ` ${limitSql}`

      const { result } = await model.excute(sql)
      return result
   }

   private formatAggregate(aggregate: AggregateArgsAggregate) {
      const model = this.model
      let aggSqlParts: string[] = []
      let orderByParts: string[] = []

      for (let column in aggregate) {
         let agg_methods: any = aggregate[column]
         if (!(column in model.schema)) {
            throw new Error(`Invalid column in aggregate clause: ${column}`)
         }

         for (let method in agg_methods) {
            if (!this.methods.includes(method)) {
               throw new Error(`Invalid aggregate method: ${method} for column: ${column}`);
            }
            let alias = column === model.IDColumn ? `${method}` : `${method}_${column}`
            let round;
            let opts: any = agg_methods[method]

            if (isObject(opts)) {
               alias = opts.alias ?? alias
               round = opts.round
               if (opts.orderBy) {
                  orderByParts.push(`${alias} ${opts.orderBy.toUpperCase()}`)
               }
            }
            let c = `${method}(CAST(${column} AS REAL))`
            if (typeof round === 'number') {
               c = `ROUND(${c}, ${round})`
            }
            aggSqlParts.push(`${c} AS ${alias}`)
         }
      }
      return {
         columns: aggSqlParts,
         orderby: orderByParts
      }
   }

   private limit(args: LimitArgs) {
      if (Object.keys(args).length === 0) {
         return ""
      }

      const model = this.model
      const xansql = model.xansql
      let take = args.take ?? xansql.config.maxFindLimit
      let skip = args.skip ?? 0
      if (take < 0 || !Number.isInteger(take)) {
         throw new Error("Invalid take value in limit clause")
      }
      if (skip < 0 || !Number.isInteger(skip)) {
         throw new Error("Invalid skip value in limit clause")
      }

      return `LIMIT ${take} ${skip ? `OFFSET ${skip}` : ""}`.trim()
   }

   private orderby(args: OrderByArgs) {
      const model = this.model
      const items = []

      for (let column in args) {
         const val = args[column]
         if (!(column in model.schema)) {
            throw new Error("Invalid column in orderBy clause: " + column)
         };
         if (['asc', 'desc'].includes(val) === false) {
            throw new Error("Invalid orderBy value for column " + column)
         }
         items.push(`${model.table}.${column} ${val.toUpperCase()}`)
      }
      return items
   }


}

export default AggregateResult;