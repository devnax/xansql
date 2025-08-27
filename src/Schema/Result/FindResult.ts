import Schema from "..";
import BuildLimit from "../Query/BuildLimit";
import BuildOrderby from "../Query/BuildOrderby";
import BuildSelect, { BuildSelectJoinInfo } from "../Query/BuildSelect";
import BuildWhere from "../Query/BuildWhere";
import { FindArgs } from "../type";

class FindResult {
   constructor(readonly schema: Schema) {
   }

   async result(args: FindArgs) {
      const select = BuildSelect(args.select || {}, this.schema);
      const where = BuildWhere(args.where || {}, this.schema)
      const limit = BuildLimit(args.limit || {}, this.schema)
      const orderby = BuildOrderby(args.orderBy || {}, this.schema)
      const sql = `${select.sql} ${where.sql} ${orderby.sql} ${limit.sql}`

      const { result } = await this.schema.excute(sql)
      let ids = result.map((r: any) => r[this.schema.IDColumn])

      for (let column in select.joins) {
         const joinRes = await this.excute(column, select.joins[column], ids)
         const relation = this.schema.xansql.getRelation(this.schema.table, column);

         // filter with column
         const map: Record<string, any[]> = {}

         for (let jr of joinRes?.result || []) {
            const key = jr[relation.foregin.column];
            if (!(key in map)) {
               map[key] = []
            }

            delete jr[relation.foregin.column]
            map[key].push(jr)
         }

         if (relation.single) {
            for (let r of result) {
               r[column] = map[r[this.schema.IDColumn]] ? map[r[this.schema.IDColumn]][0] || null : null
            }
         } else {
            for (let r of result) {
               r[column] = map[r[this.schema.IDColumn]] || []
            }
         }
      }
      return select
   }

   private async excute(column: string, join: BuildSelectJoinInfo, ids: any[]) {
      const xansql = this.schema.xansql;
      const schema = xansql.getSchema(join.table);
      const relation = xansql.getRelation(join.relationTable, column);
      const where = BuildWhere({
         ...join.args.where,
         [relation.foregin.column]: {
            [relation.main.column]: { in: ids }
         }
      }, schema)
      const orderby = BuildOrderby(join.args.orderBy || {}, schema)
      const sql = `${join.sql} ${where.sql} ${orderby.sql}`
      console.log(sql);

      // const result = await this.schema.excute(sql)
      // const rids = result.result.map((r: any) => r[schema.IDColumn])
      for (let col in join.joins) {
         const r = await this.excute(col, join.joins[col], [])
      }

      return null
      // return result;
   }
}

export default FindResult;