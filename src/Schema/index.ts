import { formatValue } from "../utils";
import SchemaBase from "./Base";
import BuildData, { BuildDataInfo } from "./Query/BuildData";
import BuildLimit from "./Query/BuildLimit";
import BuildOrderby from "./Query/BuildOrderby";
import BuildSelect from "./Query/BuildSelect";
import BuildWhere from "./Query/BuildWhere";
import { CreateArgs, FindArgs } from "./type";

class Schema extends SchemaBase {

   async create(args: CreateArgs) {
      const info = BuildData(args.data || {}, this);

      const excute = async (info: BuildDataInfo) => {
         const res = await this.excute(`INSERT INTO ${info.table} (${info.columns.join(', ')}) VALUES (${info.values.map(v => formatValue(v)).join(', ')})`)
         for (let column in info.joins) {
            const joinInfo = info.joins[column]
            if (Array.isArray(joinInfo)) {
               for (let joinItem of joinInfo) {
                  const res = await this.excute(`INSERT INTO ${joinItem.table} (${joinItem.columns.join(', ')}) VALUES (${joinItem.values.map(v => formatValue(v)).join(', ')})`)
               }
            } else {
               const res = await this.excute(`INSERT INTO ${joinInfo.table} (${joinInfo.columns.join(', ')}) VALUES (${joinInfo.values.map(v => formatValue(v)).join(', ')})`)
            }
         }
      }

      if (Array.isArray(info)) {
         for (let item of info) {
            const res = await excute(item);
         }
      } else {
         const res = await excute(info);
      }
   }

   async find(args: FindArgs) {
      const select = BuildSelect(args.select || {}, this);
      const where = BuildWhere(args.where || {}, this)
      const limit = BuildLimit(args.limit || {}, this)
      const orderby = BuildOrderby(args.orderBy || {}, this)

      const sql = `${select.sql} ${where.sql} ${orderby.sql} LIMIT ${limit.skip}, ${limit.take}`
      const result = await this.excute(sql)
      console.log(sql);

      for (let column of select.joins) {

      }
   }
}

export default Schema;
