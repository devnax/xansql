import Schema from ".";
import BuildLimit from "./Query/BuildLimit";
import BuildOrderby from "./Query/BuildOrderby";
import BuildSelect from "./Query/BuildSelect";
import BuildWhere from "./Query/BuildWhere";
import { FindArgs } from "./type";

class Find {
   constructor(readonly args: FindArgs, readonly schema: Schema) {
      this.args = args
      this.schema = schema
   }

   async excute() {
      const select = BuildSelect(this.args.select || {}, this.schema);
      const where = BuildWhere(this.args.where || {}, this.schema)
      const limit = BuildLimit(this.args.limit || {}, this.schema)
      const orderby = BuildOrderby(this.args.orderBy || {}, this.schema)
      const sql = `${select.sql} ${where.sql} ${orderby.sql} ${limit.sql}`

      const { result } = await this.schema.excute(sql)
      let ids = result.map((r: any) => r[this.schema.IDColumn])
      for (let column in select.joins) {
         const join = select.joins[column];
         let sql = join.sql;
         const schema = this.schema.xansql.getSchema(join.table);
         const relations = this.schema.xansql.getRelations(this.schema.table);
         const relation = relations[column]

         const where = BuildWhere({
            ...join.args.where,
            [relation.foregin.column]: {
               [relation.main.column]: { in: ids }
            }
         }, schema)
         const orderby = BuildOrderby(join.args.orderBy || {}, schema)
         sql = `${sql} ${where.sql} ${orderby.sql}`
         const res = await this.schema.excute(sql)

         result[column] = res.result
      }
      return result
   }
}