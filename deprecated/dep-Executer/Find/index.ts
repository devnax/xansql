import Model from "../..";
import Foreign, { ForeignInfoType } from "../../../core/classes/ForeignInfo";
import { ModelType, RowObject } from "../../../core/types";
import Xansql from "../../../core/Xansql";
import XansqlError from "../../../core/XansqlError";
import { chunkArray, chunkNumbers } from "../../../utils/chunker";
import { XqlSchemaShape } from "../../../xt/types";
import WhereArgs from "../../Args/WhereArgs";
import { FindArgs, FindArgsAggregate } from "../../types";
import AggregateExecuter from "../Aggregate";
import DistinctArgs from "./DistinctArgs";
import LimitArgs from "./LimitArgs";
import OrderByArgs from "./OrderByArgs";
import SelectArgs, { SelectArgsRelationInfo } from "./SelectArgs";

class FindExecuter<M extends Model<Xansql, string, XqlSchemaShape>> {
   model: M
   transformer: ((row: RowObject) => Promise<RowObject>) | null = null
   constructor(model: M, transformer: ((row: RowObject) => Promise<RowObject>) | null = null) {
      this.model = model
      this.transformer = transformer
   }

   async execute<A extends FindArgs<any>>(args: A) {
      const model = this.model
      const Select = new SelectArgs(model, args.select || {})
      const Where = new WhereArgs(model, args.where || {})
      const Limit = new LimitArgs(model, args.limit || {})
      const OrderBy = new OrderByArgs(model, args.orderBy || {} as any)
      const Distinct = new DistinctArgs(model, args.distinct || [] as any, Where, args.orderBy as any)

      let where_sql = Where.sql

      if (Distinct.sql) {
         where_sql = where_sql ? `${where_sql} AND ${Distinct.sql}` : `WHERE ${Distinct.sql}`
      }

      // batch execution with limit and offset
      let results: any[] = []

      if (!Limit.sql) {
         const sql = `SELECT ${Select.sql} FROM ${model.table} ${where_sql}${OrderBy.sql}`.trim()
         const executed = await model.execute(sql)
         if (executed?.results) {
            results = results.concat(executed.results)
         }
      } else {
         let lastRecordCount: any = null
         for (let { take, skip } of chunkNumbers(Limit.take)) {
            if (lastRecordCount !== null && lastRecordCount < take) {
               break;
            }
            const batchLimitArgs = new LimitArgs(model, { take, skip: Limit.skip + skip })
            const sql = `SELECT ${Select.sql} FROM ${model.table} ${where_sql}${OrderBy.sql}${batchLimitArgs.sql}`.trim()
            const executed = await model.execute(sql)
            lastRecordCount = executed?.results?.length || 0

            if (executed?.results) {
               results = results.concat(executed.results)
            }
         }
      }

      if (results?.length) {
         const is = Select.formatable_columns.length
            || Object.keys(Select.relations).length
            || Object.keys(args.aggregate || {}).length

         if (!is) return results

         const freses: { [col: string]: any[] } = {}
         let idsList: { [col: string]: number[] } = {}

         for (let column in Select.relations) {
            const relation = Select.relations[column]
            const ids: number[] = idsList[column] || []
            const foreign = relation.foreign
            if (!idsList[column]) {
               for (let r of results) {
                  let id = r[foreign.relation.target]
                  if (typeof id === "number" && !ids.includes(id)) {
                     ids.push(id)
                  }
               }
               idsList[column] = ids
            }

            const fres = await this.executeRelation(relation, ids)
            freses[column] = fres
         }

         const agg_reses: any = {}
         if (Object.keys(args.aggregate || {}).length) {
            const agg_results = await this.aggregate(model, args.aggregate || {}, results)
            for (let col in agg_results) {
               agg_reses[col] = agg_results[col]
            }
         }

         for (let { chunk } of chunkArray(results)) {
            for (let row of chunk) {
               // handle formattable columns
               this.formatFormadableColumns(row, Select.formatable_columns)
               row = this?.transformer ? await this.transformer(row) : row

               // handle aggregate
               if (Object.keys(agg_reses).length) {
                  for (let col in agg_reses) {
                     const aggres = agg_reses[col]
                     if (!row.aggregate) {
                        row.aggregate = {}
                     }
                     row.aggregate[col] = aggres.results.find((ar: any) => {
                        let is = ar[aggres.foreign.relation.main] === row[aggres.foreign.relation.target]
                        if (is) delete ar[aggres.foreign.relation.main]
                        return is
                     })
                  }
               }

               // handle relations
               if (Object.keys(freses).length) {
                  for (let col in freses) {
                     const fres = freses[col]
                     const relation = Select.relations[col]
                     if (Foreign.isArray(model.schema[col])) {
                        row[col] = fres.filter((fr: any) => {
                           let is = fr[relation.foreign.relation.main] === row[relation.foreign.relation.target]
                           if (is) delete fr[relation.foreign.relation.main]
                           return is
                        })
                     } else {
                        row[col] = fres.find((fr: any) => fr[relation.foreign.relation.main] === row[relation.foreign.relation.target]) || null
                     }
                  }
               }
            }
         }
      }
      return results;
   }


   private async executeRelation(relation: SelectArgsRelationInfo, ids: number[]) {
      let xansql = this.model.xansql
      let foreign = relation.foreign

      const table = foreign.table
      let FModel = xansql.getModel(table)
      const field = FModel.schema[foreign.column]
      let args = relation.args

      const chunkedIds = chunkArray(ids, 150)

      let fres: any[] = []

      for (let { chunk } of chunkedIds) {
         let sql = ''
         const limit = args.limit
         let where_sql = args.where
         let insql = `${foreign.relation.main} IN (${chunk.join(",")})`
         where_sql += where_sql ? ` AND ${insql}` : `WHERE ${insql}`

         if (!Foreign.isSchema(field)) {
            sql = `SELECT ${args.select.sql} FROM ${table} ${where_sql} ${args.orderBy} ${limit.sql}`.trim()
         } else {
            if (!limit.sql) {
               sql = `SELECT ${args.select.sql} FROM ${table} ${where_sql} ${args.orderBy}`.trim()
            } else {
               sql = `
            SELECT ${args.select.sql} FROM (
              SELECT
                  ${args.select.sql},
                ROW_NUMBER() OVER (PARTITION BY ${table}.${foreign.relation.main} ${args.orderBy}) AS ${table}_rank
              FROM ${table}
               ${where_sql}
            ) AS ${table}
            WHERE ${table}_rank > ${limit.skip} AND ${table}_rank <= ${limit.take + limit.skip};
         `
            }
         }
         const res = (await FModel.execute(sql)).results
         if (res) {
            fres = fres.concat(res)
         }
      }

      // let insql = `${foreign.relation.main} IN (${ids.join(",")})`
      // where_sql += where_sql ? ` AND ${insql}` : `WHERE ${insql}`

      // if (!Foreign.isSchema(field)) {
      //    sql = `SELECT ${args.select.sql} FROM ${table} ${where_sql} ${args.orderBy} ${limit.sql}`.trim()
      // } else {
      //    sql = `
      //    SELECT ${args.select.sql} FROM (
      //      SELECT
      //          ${args.select.sql},
      //        ROW_NUMBER() OVER (PARTITION BY ${table}.${foreign.relation.main} ${args.orderBy}) AS ${table}_rank
      //      FROM ${table}
      //       ${where_sql}
      //    ) AS ${table}
      //    WHERE ${table}_rank > ${limit.skip} AND ${table}_rank <= ${limit.take + limit.skip};
      // `
      // }
      // const res = (await FModel.execute(sql)).results
      // fres = fres.concat(res)


      if (fres.length) {
         const is = args.select.formatable_columns.length
            || Object.keys(args.select.relations || {}).length
            || Object.keys(args.aggregate || {}).length

         if (!is) return fres

         const nested_freses: { [col: string]: any[] } = {}
         const idsList: { [col: string]: number[] } = {}
         // handle nested relations
         for (let col in args.select.relations) {
            const rel = args.select.relations[col]
            const ids: number[] = idsList[col] || []
            const foreign = rel.foreign
            if (!idsList[col]) {
               for (let r of fres) {
                  let id = r[foreign.relation.target]
                  if (typeof id === "number" && !ids.includes(id)) {
                     ids.push(id)
                  }
               }
               idsList[col] = ids
            }
            const nested_fres = await this.executeRelation(rel, ids)
            nested_freses[col] = nested_fres
         }
         // handle aggregate
         const agg_reses: any = {}
         if (Object.keys(args.aggregate || {}).length) {
            const agg_results = await this.aggregate(FModel, args.aggregate || {}, fres)
            for (let col in agg_results) {
               agg_reses[col] = agg_results[col]
            }
         }

         for (let { chunk } of chunkArray(fres)) {
            for (let row of chunk) {
               // handle formattable columns
               this.formatFormadableColumns(row, args.select.formatable_columns)
               row = this?.transformer ? await this.transformer(row) : row
               // handle aggregate
               if (Object.keys(agg_reses).length) {
                  for (let col in agg_reses) {
                     const aggres = agg_reses[col]
                     if (!row.aggregate) {
                        row.aggregate = {}
                     }

                     row.aggregate[col] = aggres.results.find((ar: any) => {
                        let is = ar[aggres.foreign.relation.target] === row[aggres.foreign.relation.main]
                        if (is) delete ar[aggres.foreign.relation.main]
                        return is
                     })
                  }
               }

               // handle nested relations
               if (Object.keys(nested_freses).length) {
                  for (let col in nested_freses) {
                     const nested_fres = nested_freses[col]
                     const rel: any = args.select.relations?.[col]
                     if (Foreign.isArray(FModel.schema[col])) {
                        row[col] = nested_fres.filter((fr: any) => {
                           let is = fr[rel.foreign.relation.main] === row[rel.foreign.relation.target]
                           if (is) delete fr[rel.foreign.relation.main]
                           return is
                        })
                     } else {
                        row[col] = nested_fres.find((fr: any) => fr[rel.foreign.relation.main] === row[rel.foreign.relation.target]) || null
                     }
                  }
               }
            }
         }
      }

      return fres
   }

   private formatFormadableColumns(row: any, columns: string[]) {
      for (let col of columns) {
         try {
            row[col] = JSON.parse(row[col])
         } catch (error) {
            row[col] = row[col]
         }
      }
   }

   private async aggregate(model: ModelType, aggregate: FindArgsAggregate, results: any[]) {
      const xansql = model.xansql
      const agg_results: {
         [column: string]: {
            results: any[],
            foreign: ForeignInfoType
         }
      } = {}
      for (let col in aggregate) {
         if (!(col in model.schema)) {
            throw new XansqlError({
               message: `Column ${col} not found in model ${model.table} for aggregate`,
               model: model.table,
               column: col
            })
         }
         const foreign = Foreign.get(model, col)
         if (!foreign) {
            throw new XansqlError({
               message: `Column ${col} is not a foreign column in ${model.table}, cannot aggregate on it.`,
               model: model.table,
               column: col
            })
         }
         if (!Foreign.isArray(model.schema[col])) {
            throw new XansqlError({
               message: `Column ${col} is not a relation column in ${model.table}, cannot aggregate on it.`,
               model: model.table,
               column: col
            })
         }

         const FModel = xansql.getModel(foreign.table)
         let ids: number[] = []
         for (let r of results) {
            let id = r[foreign.relation.target]
            if (typeof id === "number" && !ids.includes(id)) {
               ids.push(id)
            }
         }
         if (!ids.length) continue;
         const AggExecuter = new AggregateExecuter(FModel, false)
         const aggRes = await AggExecuter.execute({
            where: {
               [foreign.relation.main]: {
                  in: ids
               }
            },
            groupBy: [foreign.relation.main],
            select: aggregate[col]
         })

         agg_results[col] = {
            results: aggRes,
            foreign
         }
      }
      return agg_results;
   }

}

export default FindExecuter;