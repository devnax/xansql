import Schema from "../..";
import WhereArgs from "../../Args/WhereArgs";
import Foreign from "../../include/Foreign";
import { FindArgsType } from "../../type";
import DistinctArgs from "./DistinctArgs";
import LimitArgs from "./LimitArgs";
import OrderByArgs from "./OrderByArgs";
import SelectArgs, { SelectArgsRelationInfo } from "./SelectArgs";

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
            await this.excuteRelation(model, relation, column, result)
         }
      }
      return result;
   }


   private async excuteRelation(model: Schema, relation: SelectArgsRelationInfo, column: string, result: any[]) {
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

      let args = relation.args
      const limit = args.limit
      let where_sql = args.where
      let insql = `${foreign.relation.main} IN (${ids.join(",")})`
      where_sql += where_sql ? ` AND ${insql}` : `WHERE ${insql}`

      let sql = `
         SELECT ${args.select.sql} FROM (
           SELECT
               ${args.select.sql},
             ROW_NUMBER() OVER (PARTITION BY ${table}.${foreign.relation.main} ${args.orderBy}) AS ${table}_rank
           FROM ${table}
            ${where_sql}
         ) AS ${table}
         WHERE ${table}_rank > ${limit.skip} AND ${table}_rank <= ${limit.take + limit.skip};
      `
      const fres = (await FModel.excute(sql)).result

      for (let r of result) {
         if (Foreign.isArray(model.schema[column])) {
            r[column] = fres.filter((fr: any) => {
               let is = fr[foreign.relation.main] === r[foreign.relation.target]
               if (is) delete fr[foreign.relation.main]
               return is
            })
         } else {
            r[column] = fres.find((fr: any) => fr[foreign.relation.main] === r[foreign.relation.target]) || null
         }
      }

      // excute nested relations
      if (args.select.relations && Object.keys(args.select.relations).length) {
         for (let rel_column in args.select.relations) {
            const rel_relation = args.select.relations[rel_column]
            await this.excuteRelation(FModel, rel_relation, rel_column, fres)
         }
      }

      return result
   }

}

export default FindExcuter;