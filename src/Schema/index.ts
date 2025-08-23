import { formatValue } from "../utils";
import SchemaBase from "./Base";
import BuildLimit from "./Query/BuildLimit";
import BuildOrderby from "./Query/BuildOrderby";
import BuildSelect from "./Query/BuildSelect";
import BuildWhere from "./Query/BuildWhere";
import { CreateArgs, FindArgs } from "./type";

class Schema extends SchemaBase {


   async create(args: CreateArgs) {

   }

   async find(args: FindArgs) {
      const select = BuildSelect(args.select || {}, this);
      const where = BuildWhere(args.where || {}, this)
      const limit = BuildLimit(args.limit || {}, this)
      const orderby = BuildOrderby(args.orderBy || {}, this)

      const sql = `${select.sql} ${where.sql} ${orderby.sql} LIMIT ${limit.skip}, ${limit.take}`
      const result = await this.excute(sql)

      for (let column of select.joins) {

      }
   }
}

export default Schema;
