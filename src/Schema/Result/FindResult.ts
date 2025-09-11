import Schema from "..";
import { ForeignInfo } from "../../type";
import { isObject } from "../../utils";
import { FindArgs, LimitArgs, OrderByArgs } from "../type";
import WhereArgs from "./WhereArgs";

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
      const res = await this.excute(args, meta)
      return res
   }

   private async excute(args: FindArgs, meta?: Meta) {
      const model = this.model
      const xansql = model.xansql
      const { select, where, limit, orderBy } = args
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

            if (value === true || (isObject(value) && Object.keys(value).length === 0)) {
               for (let rcol in FModel.schema) {
                  const rxanv = FModel.schema[rcol]
                  if (rxanv && !xansql.isForeign(rxanv)) {
                     fargs.select[rcol] = true
                  }
               }
            }
            relationArgs[column] = {
               args: fargs,
               foreign
            }
         } else {
            if (value === false) continue

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

      let cols = [...columns, ...relationColumns]
      let select_sql = cols.length ? cols.join(", ") : "*"
      let sql = ``

      if (meta) {
         sql = `
         SELECT ${select_sql} FROM (
           SELECT
               ${select_sql},
             ROW_NUMBER() OVER (PARTITION BY ${model.table}.${meta.in.column} ${OrderBy.sql}) AS ${model.table}_rank
           FROM ${model.table}
            ${where_sql}
         ) AS ${model.table}
         WHERE ${model.table}_rank > ${Limit.skip} AND ${model.table}_rank <= ${Limit.take + Limit.skip};
      `
      } else {
         sql = `SELECT ${select_sql} FROM ${model.table} ${where_sql} ${OrderBy.sql} ${Limit.sql}`.trim()
      }

      const { result } = await model.excute(sql)
      if (result.length) {
         for (let rel_args in relationArgs) {
            const { args, foreign } = relationArgs[rel_args]
            const FModel = model.xansql.getModel(foreign.table)
            let ids: number[] = result.map((r: any) => r[foreign.relation.target]);

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
                     if (is && relationColumns.includes(`${model.table}.${foreign.relation.target}`)) {
                        delete fr[foreign.relation.main]
                     }
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