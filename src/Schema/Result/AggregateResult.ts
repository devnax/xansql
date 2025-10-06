import Schema from ".."
import { isObject } from "../../utils"
import { chunkNumbers } from "../../utils/chunker"
import WhereArgs from "../Args/WhereArgs"
import { AggregateArgs, AggregateArgsAggregate, LimitArgs, OrderByArgs } from "../type"

class AggregateResult {
   model: Schema
   private methods = ["count", "sum", "avg", "min", "max"]

   constructor(schema: Schema) {
      this.model = schema
   }

   async result(args: AggregateArgs) {
      // hooks beforeAggregate
      if (this.model.options.hooks?.beforeAggregate) {
         const res = await this.model.options.hooks.beforeAggregate(args)
         args = res
      }
      const model = this.model
      const table = model.table
      const xansql = model.xansql
      const maxLimit = xansql.config.maxLimit.find
      let { groupBy, where, aggregate, orderBy, limit } = args

      if (!Object.keys(limit || {}).length) {
         if (groupBy && groupBy.length) {
            limit = { take: maxLimit }
         }
      }

      orderBy = orderBy || {}
      let formated = this.formatAggregate(aggregate)
      let Where = new WhereArgs(model, where || {})
      let limitSql = this.limit(limit || {})
      let OrderBy = this.orderby(orderBy || {}).concat(formated.orderby || [])

      let sql = `SELECT `
      sql += groupBy && groupBy.length ? groupBy.join(", ") + ", " : ""
      sql += formated.columns.join(", ")
      sql += ` FROM ${table} ${Where.sql}`
      sql += groupBy && groupBy.length ? ` GROUP BY ${groupBy.join(", ")} ` : ""
      sql += OrderBy.length ? ` ORDER BY ${OrderBy.join(", ")} ` : ""

      if (groupBy && groupBy.length) {
         let results: any[] = []
         let _limit = limit?.take || maxLimit
         for (let { take, skip } of chunkNumbers(_limit, limit?.skip || 0)) {
            sql += ` LIMIT ${take} ${skip ? `OFFSET ${skip}` : ""}`
            const { result } = await model.excute(sql)
            results = results.concat(result)
            if (result.length < take) break;
         }
         return results
      } else {
         sql += ` ${limitSql}`
      }
      const { result } = await model.excute(sql)
      // hooks afterAggregate
      if (this.model.options.hooks?.afterAggregate) {
         const res = await this.model.options.hooks.afterAggregate(result, args)
         return res
      }
      return result
   }

   private formatAggregate(aggregate: AggregateArgsAggregate) {
      const model = this.model
      let aggSqlParts: string[] = []
      let orderByParts: string[] = []

      for (let column in aggregate) {
         let agg_methods: any = aggregate[column]
         if (!(column in model.schema)) {
            throw new Error(`Invalid column in aggregate clause: ${column} in table: ${model.table}`);
         }

         for (let method in agg_methods) {
            if (!this.methods.includes(method)) {
               throw new Error(`Invalid aggregate method: ${method} for column: ${column} in table: ${model.table}`);
            }

            let alias = column === model.IDColumn ? `${method}` : `${method}_${column}`
            let opts: any = agg_methods[method]
            let round;

            if (isObject(opts)) {
               alias = opts.alias ?? alias
               round = opts.round || 2
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
      const maxLimit = xansql.config.maxLimit.find
      let take = args.take ?? maxLimit
      let skip = args.skip ?? 0
      if (take < 0 || !Number.isInteger(take)) {
         throw new Error(`Invalid take value in limit clause in table ${model.table}`);
      }
      if (skip < 0 || !Number.isInteger(skip)) {
         throw new Error(`Invalid skip value in limit clause in table ${model.table}`);
      }

      return `LIMIT ${take} ${skip ? `OFFSET ${skip}` : ""}`.trim()
   }

   private orderby(args: OrderByArgs) {
      const model = this.model
      const items = []

      for (let column in args) {
         const val = args[column]
         if (!(column in model.schema)) {
            throw new Error(`Invalid column in orderBy clause: ${column} in table: ${model.table}`)
         };
         if (['asc', 'desc'].includes(val) === false) {
            throw new Error(`Invalid orderBy value for column ${column} in table ${model.table}`);
         }
         items.push(`${model.table}.${column} ${val.toUpperCase()}`)
      }
      return items
   }


}

export default AggregateResult;