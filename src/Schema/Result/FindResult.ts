import Schema from "..";
import { ForeignInfo } from "../../type";
import XqlArray from "../../Types/fields/Array";
import XqlEnum from "../../Types/fields/Enum";
import XqlObject from "../../Types/fields/Object";
import XqlRecord from "../../Types/fields/Record";
import XqlTuple from "../../Types/fields/Tuple";
import XqlUnion from "../../Types/fields/Union";
import { isObject } from "../../utils";
import { chunkArray, chunkNumbers } from "../../utils/chunker";
import { FindArgs, FindArgsAggregate, LimitArgs, OrderByArgs } from "../type";
import AggregateResult from "./AggregateResult";
import WhereArgsQuery from "./WhereArgsQuery";


type RelationInfo = { [column: string]: { args: FindArgs, foreign: ForeignInfo } }

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
      // hooks beforeFind
      if (this.model.options.hooks?.beforeFind) {
         const res = await this.model.options.hooks.beforeFind(args)
         args = res
      }
      const xansql = this.model.xansql
      const maxLimit = xansql.config.maxLimit.find
      const chunk = chunkNumbers(args.limit?.take || maxLimit, args.limit?.skip || 0)

      let result: any[] = []
      for (let { take, skip } of chunk) {
         args.limit = { take, skip }
         const res = await this.excute(args, meta)
         result = result.concat(res)
         if (res.length < take) break; // no more rows
      }
      // hooks afterFind
      if (this.model.options.hooks?.afterFind) {
         const res = await this.model.options.hooks.afterFind(result, args)
         result = res
      }
      return result
   }

   private async excute(args: FindArgs, meta?: Meta) {

      const model = this.model
      const xansql = model.xansql
      let { distinct, select, where, limit, orderBy, aggregate } = args
      const columns: string[] = []
      const formatableColumns = []
      const relationColumns: string[] = []
      const Where = new WhereArgsQuery(model, where || {})
      const Limit = this.limit(limit || {})
      const OrderBy = this.orderby(orderBy || {})

      let relationArgs: RelationInfo = {}

      for (let column in select) {
         const xanv = model.schema[column]
         if (!xanv) {
            throw new Error(`Invalid column in select clause: ${column} in model ${model.table}`)
         };

         const value: any = select[column]
         if (xansql.isForeign(xanv)) {
            const foreign = xansql.foreignInfo(model.table, column)
            // const FModel = xansql.getModel(foreign.table)
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
               throw new Error(`Invalid select value for column ${column} in model ${model.table}`)
            }
            if (model.iof(column, XqlEnum, XqlArray, XqlObject, XqlRecord, XqlTuple, XqlUnion)) {
               formatableColumns.push(column)
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


      const { result: main_result } = await model.excute(sql)
      if (main_result.length) {
         for (let { chunk: result } of chunkArray(main_result)) {
            const aggResults = await this.aggregate(aggregate || {}, result)
            const freses = await this.excuteRelation(relationArgs, result, meta)

            for (let row of result) {

               // format columns
               for (let col of formatableColumns) {
                  let val = row[col]
                  if (val === null || val === undefined) continue
                  try {
                     row[col] = JSON.parse(val)
                  } catch (error) {
                     row[col] = val
                  }
               }

               for (let { col, foreign, aggRes } of aggResults) {
                  let find = aggRes.find((ar: any) => ar[foreign.relation.main] === row[foreign.relation.target]) || null
                  if (!("aggregate" in row)) {
                     row["aggregate"] = {}
                  }
                  if (find) delete find[foreign.relation.main]
                  row["aggregate"][col] = find
               }

               for (let { rel_args, foreign, fres } of freses) {
                  if (xansql.isForeignArray(model.schema[rel_args])) {
                     row[rel_args] = fres.filter((fr: any) => {
                        let is = fr[foreign.relation.main] === row[foreign.relation.target]
                        if (is) {
                           delete fr[foreign.relation.main]
                        }
                        return is
                     })
                  } else {
                     row[rel_args] = fres.find((fr: any) => fr[foreign.relation.main] === row[foreign.relation.target]) || null
                  }
               }
            }
         }
      }

      return main_result
   }

   private async excuteRelation(relationArgs: RelationInfo, result: any[], meta?: Meta) {
      const model = this.model
      let freses = []
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
            throw new Error(`Circular reference detected in relation ${rel_args}. table: ${model.table}`);
         }

         const findResult = new FindResult(FModel)

         const fres: any = await findResult.result(args, {
            parent_table: model.table,
            in: {
               column: foreign.relation.main,
               values: Array.from(new Set(ids))
            }
         })

         freses.push({ rel_args, foreign, fres })
      }
      return freses
   }

   private async aggregate(aggregate: FindArgsAggregate, result: any[]) {
      const model = this.model
      const xansql = model.xansql
      let aggResults: any = []
      if (aggregate && Object.keys(aggregate).length) {
         for (let col in aggregate) {
            if (!(col in model.schema)) {
               throw new Error(`Invalid column in aggregate clause: ${col} in model ${model.table}`)
            }
            const foreign = xansql.foreignInfo(model.table, col)
            if (!foreign) {
               throw new Error(`Column ${col} is not a foreign column in ${model.table}, cannot aggregate on it.`)
            }
            if (!xansql.isForeignArray(model.schema[col])) {
               throw new Error(`Column ${col} is not a foreign array column in ${model.table}, cannot aggregate on it.`)
            }

            const FModel = xansql.getModel(foreign.table)
            let ids: number[] = []
            for (let r of result) {
               let id = r[foreign.relation.target]
               if (typeof id === "number" && !ids.includes(id)) {
                  ids.push(id)
               }
            }
            if (ids.length === 0) continue;
            const aggregateResult = new AggregateResult(FModel)
            const aggRes = await aggregateResult.result({
               where: {
                  [foreign.relation.main]: {
                     in: ids
                  }
               },
               groupBy: [foreign.relation.main],
               aggregate: aggregate[col]
            })
            aggResults.push({ col, foreign, aggRes })
         }
      }
      return aggResults
   }

   private limit(args: LimitArgs) {
      const model = this.model
      const xansql = model.xansql
      const maxLimit = xansql.config.maxLimit.find
      let take = args.take ?? maxLimit
      let skip = args.skip ?? 0
      if (take < 0 || !Number.isInteger(take)) {
         throw new Error(`Invalid take value in limit clause in model ${model.table}`)
      }
      if (skip < 0 || !Number.isInteger(skip)) {
         throw new Error(`Invalid skip value in limit clause in model ${model.table}`)
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
            throw new Error(`Invalid column in orderBy clause: ${column} in model ${model.table}`)
         };
         if (['asc', 'desc'].includes(val) === false) {
            throw new Error(`Invalid orderBy value for column ${column} in model ${model.table}`)
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