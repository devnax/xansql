import Schema from "..";
import { isNumber, isObject } from "../../utils";
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

      if (Object.keys(select.joins).length && result?.length) {
         for (let column in select.joins) {
            const join: BuildSelectJoinInfo = select.joins[column]
            const parent = join.parent
            const ids = result.map((r: any) => r[parent.relation])
            const r_result = await this.excute(join, ids)
            for (let res of result) {
               if (parent.single) {
                  res[parent.column] = r_result.find((r: any) => r[join.in_column] === res[parent.relation])
               } else {
                  if (!Array.isArray(res[parent.column])) res[parent.column] = []
                  for (let _r of r_result) {
                     let r = JSON.parse(JSON.stringify(_r))
                     let id = r[join.in_column]
                     if (isNumber(id)) delete r[join.in_column]
                     if (isObject(id)) id = id[parent.relation]

                     if (id === res[parent.relation]) {
                        res[parent.column].push(r)
                     }
                  }
               }
            }
         }
      }

      return result
   }

   private async excute(join: BuildSelectJoinInfo, ids: any[]) {
      const xansql = this.schema.xansql;
      const FModel = xansql.getSchema(join.table)
      const where = BuildWhere(join.where, FModel)
      const orderBy = BuildOrderby(join.orderBy, FModel)
      const limit = BuildLimit(join.limit, FModel)
      const IN = `${join.in_column} IN (${ids.join(",")})`
      if (where.sql) {
         where.sql += ` AND ${IN}`
      } else {
         where.sql += ` WHERE ${IN}`
      }

      let columns = join.columns.join(",")
      let take = limit.take, skip = limit.skip;
      let sql = `
         SELECT ${columns} FROM (
           SELECT
               ${columns},
             ROW_NUMBER() OVER (PARTITION BY ${join.alias}.${join.in_column} ${orderBy.sql}) AS ${join.alias}_rank
           FROM ${join.table} ${join.alias}
            ${where.sql}
         ) AS ${join.alias}
         WHERE ${join.alias}_rank > ${skip} AND ${join.alias}_rank <= ${take + skip};
      `
      const { result } = await FModel.excute(sql)

      if (Object.keys(join.joins).length && result?.length) {
         for (let column in join.joins) {
            const rjoin: BuildSelectJoinInfo = join.joins[column]
            const parent = rjoin.parent
            const ids = result.map((r: any) => r[parent.relation])
            const r_result = await this.excute(rjoin, ids)
            for (let res of result) {
               if (parent.single) {
                  const find = r_result.find((r: any) => r[rjoin.in_column] === res[parent.relation])
                  res[parent.column] = find || null
               } else {
                  if (!Array.isArray(res[parent.column])) res[parent.column] = []
                  for (let _r of r_result) {
                     let r = JSON.parse(JSON.stringify(_r))
                     let id = r[rjoin.in_column]
                     if (isNumber(id)) delete r[join.in_column]
                     if (isObject(id)) id = id[parent.relation]

                     if (id === res[parent.relation]) {
                        res[parent.column].push(r)
                     }
                  }
               }
            }
         }
      }
      return result;
   }
}

export default FindResult;