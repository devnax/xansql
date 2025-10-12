import Schema from "..";
import DistinctArgs from "../Args/DistinctArgs";
import LimitArgs from "../Args/LimitArgs";
import OrderByArgs from "../Args/OrderByArgs";
import SelectArgs, { SelectArgsRelationInfo } from "../Args/SelectArgs";
import WhereArgs from "../Args/WhereArgs";
import Foreign from "../include/Foreign";
import { FindArgsType } from "../type";

class FindExcuter {
   model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async excute(args: FindArgsType) {
      const model = this.model
      const Select = new SelectArgs(model, args.select || {})
      const Where = new WhereArgs(model, args.where || {})
      const Limit = new LimitArgs(model, args.limit || {})
      const OrderBy = new OrderByArgs(model, args.orderBy || {})
      const Distinct = new DistinctArgs(model, args.distinct || [], Where, args.orderBy)

      let where_sql = Where.sql
      if (Distinct.sql) {
         where_sql = where_sql ? `${where_sql} AND ${Distinct.sql}` : `WHERE ${Distinct.sql}`
      }

      const sql = `SELECT ${Select.sql} FROM ${model.table} ${where_sql}${OrderBy.sql}${Limit.sql}`.trim()
      const { result } = await model.excute(sql)

      if (Select.relations && Object.keys(Select.relations).length) {
         for (let column in Select.relations) {
            const relation = Select.relations[column]
            await this.excuteRelation(relation, column, result)
         }
      }
      return result;
   }


   private async excuteRelation(relation: SelectArgsRelationInfo, column: string, result: any[]) {
      let xansql = this.model.xansql
      let foreign = relation.foreign
      const table = foreign.table
      let FModel = xansql.getModel(table)

      let ids: number[] = []
      for (let r of result) {
         let id = r[foreign.relation.target]
         if (typeof id === "number" && !ids.includes(id)) {
            ids.push(id)
         }
      }

      let fargs = relation.args
      const limit = fargs.limit
      let where_sql = fargs.where
      let insql = `${foreign.relation.main} IN (${ids.join(",")})`
      where_sql += where_sql ? ` AND ${insql}` : `WHERE ${insql}`

      let sql = `
         SELECT ${fargs.select.sql} FROM (
           SELECT
               ${fargs.select.sql},
             ROW_NUMBER() OVER (PARTITION BY ${table}.${foreign.relation.main} ${fargs.orderBy}) AS ${table}_rank
           FROM ${table}
            ${where_sql}
         ) AS ${table}
         WHERE ${table}_rank > ${limit.skip} AND ${table}_rank <= ${limit.take + limit.skip};
      `
      const fres = (await FModel.excute(sql)).result
      for (let r of result) {
         if (Foreign.isArray(this.model.schema[column])) {
            r[column] = fres.filter((fr: any) => {
               let is = fr[foreign.relation.main] === r[foreign.relation.target]
               if (is) delete fr[foreign.relation.main]
               return is
            })
         } else {
            r[column] = fres.find((fr: any) => fr[foreign.relation.main] === r[foreign.relation.target]) || null
         }
      }
      return result
   }

}

export default FindExcuter;