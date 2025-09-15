import Schema from "..";
import { ForeignInfo } from "../../type";
import { isObject } from "../../utils";
import { FindArgs, LimitArgs, OrderByArgs } from "../type";
import WhereArgs from "./WhereArgs";

const BATCH_SIZE = 500;

type Meta = {
   parent_table: string,
   in: {
      column: string,
      values: number[]
   }
}

class FindResult {
   private model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async result(args: FindArgs, meta?: Meta) {

      if (meta) {
         if (args.limit && (args as any).limit.take > BATCH_SIZE) {
            // use while loop for large limit
            let allResults: any[] = []
            let remaining = args.limit.take || 0
            let skip = args.limit.skip || 0
            while (remaining > 0) {
               const res = await this.excute({
                  ...args,
                  limit: {
                     take: Math.min(remaining, BATCH_SIZE),
                     skip: skip
                  }
               }, meta)
               allResults = allResults.concat(res)
               remaining -= res.length
               skip = Math.max(0, skip - res.length)
               if (res.length < Math.min(remaining, BATCH_SIZE)) {
                  // no more records
                  break;
               }
            }
            return allResults
         } else if (meta.in.values.length > BATCH_SIZE) {
            // use while loop for large in values
            let allResults: any[] = []
            let i = 0
            while (i < meta.in.values.length) {
               const chunk = meta.in.values.slice(i, i + BATCH_SIZE)
               const res = await this.excute(args, {
                  parent_table: meta.parent_table,
                  in: {
                     column: meta.in.column,
                     values: chunk
                  }
               })
               allResults = allResults.concat(res)
               i += BATCH_SIZE
            }
            return allResults
         }
      } else if (args.limit && (args as any).limit.take > BATCH_SIZE) {

         let allResults: any[] = []
         let remaining = args.limit.take || 0
         let skip = args.limit.skip || 0
         while (remaining > 0) {
            const res = await this.excute({
               ...args,
               limit: {
                  take: Math.min(remaining, BATCH_SIZE),
                  skip: skip
               }
            })
            allResults = allResults.concat(res)
            remaining -= res.length
            skip = Math.max(0, skip - res.length)
            if (res.length < Math.min(remaining, BATCH_SIZE)) {
               // no more records
               break;
            }
         }
         return allResults

      }

      const res = await this.excute(args, meta)
      return res
   }

   private async excute(args: FindArgs, meta?: Meta) {
      const model = this.model
      const xansql = model.xansql
      let { distinct, select, where, limit, orderBy } = args
      const columns: string[] = []
      const relationColumns: string[] = []
      const Where = new WhereArgs(model, where || {})
      const Limit = this.limit(limit || {})
      const OrderBy = this.orderby(orderBy || {})

      let relationArgs: { [column: string]: { args: FindArgs, foreign: ForeignInfo } } = {}

      for (let column in select) {
         const xanv = model.schema[column]
         if (!xanv) {
            throw new Error("Invalid column in select clause: " + column)
         };

         const value: any = select[column]
         if (xansql.isForeign(xanv)) {
            const foreign = xansql.foreignInfo(model.table, column)
            const FModel = xansql.getModel(foreign.table)
            let col = `${model.table}.${foreign.relation.target}`
            if (!columns.includes(col) && !relationColumns.includes(col)) {
               relationColumns.push(col)
            }

            const fargs = {
               select: isObject(value) ? value.select : {},
               where: isObject(value) && value.where ? value.where : {},
               limit: isObject(value) && value.limit ? value.limit : {},
               orderBy: isObject(value) && value.orderBy ? value.orderBy : {},
            }

            relationArgs[column] = {
               args: fargs,
               foreign
            }
         } else {
            if (value === false || column === model.IDColumn) continue
            if (value === true) {
               columns.push(`${model.table}.${column}`)
            } else {
               throw new Error("Invalid select value for column " + column)
            }
         }
      }

      if (meta) {
         let col = `${model.table}.${meta.in.column}`
         if (!columns.includes(col) && !relationColumns.includes(col)) {
            relationColumns.push(col)
         }
      }

      let where_sql = Where.sql
      if (meta) {
         let insql = `${meta.in.column} IN (${meta.in.values.join(",")})`
         where_sql += where_sql ? ` AND ${insql}` : `WHERE ${insql}`
      }


      if (distinct && distinct.length) {
         let dcols: string[] = []
         for (let col of distinct) {
            if (!(col in model.schema)) {
               throw new Error("Invalid column in distinct clause: " + col)
            };
            let MX = orderBy && orderBy[col] === "desc" ? "MAX" : "min"
            dcols.push(`${model.table}.${model.IDColumn} IN (
               SELECT ${MX}(${model.table}.${model.IDColumn})
               FROM ${model.table}
               ${where_sql}
               GROUP BY  ${col}
            )`)
         }
         if (dcols.length) {
            where_sql = where_sql ? `${where_sql} AND ${dcols.join(" AND ")}` : `WHERE ${dcols.join(" AND ")}`
         }
      }

      if (!columns.length) {
         for (let c in model.schema) {
            if (!xansql.isForeign(model.schema[c])) {
               columns.push(`${model.table}.${c}`)
            }
         }
      }

      let cols = [...columns, ...relationColumns]
      let idcol = `${model.table}.${model.IDColumn}`
      cols.unshift(idcol)

      let sql_cols = cols.join(", ").trim()
      let sql = ``

      if (meta) {
         sql = `
         SELECT ${sql_cols} FROM (
           SELECT
               ${sql_cols},
             ROW_NUMBER() OVER (PARTITION BY ${model.table}.${meta.in.column} ${OrderBy.sql}) AS ${model.table}_rank
           FROM ${model.table}
            ${where_sql}
         ) AS ${model.table}
         WHERE ${model.table}_rank > ${Limit.skip} AND ${model.table}_rank <= ${Limit.take + Limit.skip};
      `
      } else {
         sql = `SELECT ${sql_cols} 
         FROM ${model.table} 
         ${where_sql} 
         ${OrderBy.sql} 
         ${Limit.sql}`.trim()
      }

      const { result } = await model.excute(sql)

      if (result.length) {
         for (let rel_args in relationArgs) {
            const { args, foreign } = relationArgs[rel_args]
            const FModel = model.xansql.getModel(foreign.table)
            let ids: number[] = []
            for (let r of result) {
               let id = r[foreign.relation.target]
               if (typeof id === "number" && !ids.includes(id)) {
                  ids.push(id)
               }
            }

            if (meta && meta.parent_table === foreign.table) {
               throw new Error("Circular reference detected in relation " + rel_args);
            }
            const findResult = new FindResult(FModel)
            const fres: any = await findResult.result(args, {
               parent_table: model.table,
               in: {
                  column: foreign.relation.main,
                  values: Array.from(new Set(ids))
               }
            })

            for (let row of result) {
               if (xansql.isForeignArray(model.schema[rel_args])) {
                  row[rel_args] = fres.filter((fr: any) => {
                     let is = fr[foreign.relation.main] === row[foreign.relation.target]
                     if (is) {
                        delete fr[foreign.relation.main]
                     }
                     return is
                  })
               } else {
                  row[rel_args] = fres.find((fr: any) => {
                     let is = fr[foreign.relation.main] === row[foreign.relation.target]
                     // if (is && relationColumns.includes(`${model.table}.${foreign.relation.target}`)) {
                     //    delete fr[foreign.relation.main]
                     // }
                     return is
                  }) || null
               }
            }
         }
      }

      return result
   }

   private limit(args: LimitArgs) {

      let take = args.take ?? 50
      let skip = args.skip ?? 0
      if (take < 0 || !Number.isInteger(take)) {
         throw new Error("Invalid take value in limit clause")
      }
      if (skip < 0 || !Number.isInteger(skip)) {
         throw new Error("Invalid skip value in limit clause")
      }

      const info: any = {
         take: take,
         skip: skip,
         sql: `LIMIT ${take} ${skip ? `OFFSET ${skip}` : ""}`.trim(),
      }

      return info
   }

   private orderby(args: OrderByArgs) {
      const model = this.model
      const info: any = {
         sql: "",
      }
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
      if (items.length > 0) {
         info.sql += `ORDER BY ${items.join(', ')}`
      }
      return info
   }

}

export default FindResult;