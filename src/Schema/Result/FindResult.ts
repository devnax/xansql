import Schema from "..";
import { RelationInfo } from "../../type";
import BuildLimit from "../Query/BuildLimit";
import BuildOrderby from "../Query/BuildOrderby";
import BuildSelect, { BuildSelectJoinInfo, BuildSelectJoinType } from "../Query/BuildSelect";
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
      await this.excute(select.table, select.joins, ids)

      return result
   }

   private async excute(table: string, joins: BuildSelectJoinType, ids: any[]) {
      for (let column in joins) {
         const join = joins[column]
         const xansql = this.schema.xansql;
         const schema = xansql.getSchema(join.table);
         const relation = join.relation as RelationInfo

         let whereClause: any = {}
         if (relation.single) {
            console.log(join);

            whereClause[relation.foregin.column] = { in: ids }
         } else {
            const pr = this.schema.xansql.getRelation(relation.foregin.table, relation.foregin.column)
            whereClause[relation.foregin.column] = {
               // [pr.foregin.column]: { in: ids }
            }
         }

         console.log(whereClause);


         const where = BuildWhere({
            ...join.args.where,
            // ...whereClause
         }, schema)
         const orderby = BuildOrderby(join.args.orderBy || {}, schema)
         const sql = `${join.sql} ${where.sql} ${orderby.sql}`
         const result = await this.schema.excute(sql)

         if (Object.keys(join.joins).length > 0) {
            const rids = result.result.map((r: any) => r[schema.IDColumn])
            if (rids.length > 0) {
               const r = await this.excute(join.table, join.joins, rids)
               console.log(r);
            }
         }


         return null
      }

      // return result;
   }
}

export default FindResult;