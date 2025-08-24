import XqlIDField from "../Types/fields/IDField";
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
         // validate required fields
         for (let column in this.schema) {
            const xanv = this.schema[column];
            if (!info.columns.includes(column) && column !== this.IDColumn) {
               try {
                  xanv.parse(undefined);
               } catch (err) {
                  throw new Error(`Field ${column} is required in create data.`);
               }
            }
         }

         const res = await this.excute(`
            INSERT INTO ${info.table} (${info.columns.join(', ')}) 
            VALUES (${info.values.map(v => formatValue(v)).join(', ')})
         `)
         const insertId = res.insertId;
         if (!insertId) {
            return;
         }

         // find
         let select_columns: any = {
            [this.IDColumn]: true
         };
         if (args.select === 'full') {
            for (let column of this.columns.main) {
               select_columns[column] = true;
            }
         } else if (args.select === 'partial') {
            for (let column of info.columns) {
               select_columns[column] = true;
            }
         }

         const find = await this.findOne({
            where: {
               [this.IDColumn]: insertId
            },
            select: select_columns
         })

         const id = find?.[this.IDColumn] as number

         for (let column in info.joins) {
            const joinInfo = info.joins[column]
            if (Array.isArray(joinInfo)) {
               for (let joinItem of joinInfo) {
                  const relations = this.xansql.getRelations(info.table);
                  const relation = relations[column]
                  joinItem.columns.push(relation.foregin.column);
                  joinItem.values.push(id);
                  const res = await excute(joinItem)
                  find![column] = find![column] || [];
                  find![column].push(res)
               }
            } else {
               const relations = this.xansql.getRelations(info.table);
               const relation = relations[column]
               joinInfo.columns.push(relation.foregin.column);
               joinInfo.values.push(id);
               const res = await excute(joinInfo)
               find![column] = res
            }
         }
         return find
      }
      let results: any;
      if (Array.isArray(info)) {
         results = [];
         for (let item of info) {
            const res = await excute(item);
            results.push(res);
         }
      } else {
         results = await excute(info);
      }

      return results;
   }

   async find(args: FindArgs) {
      const select = BuildSelect(args.select || {}, this);
      const where = BuildWhere(args.where || {}, this)
      const limit = BuildLimit(args.limit || {}, this)
      const orderby = BuildOrderby(args.orderBy || {}, this)

      const sql = `${select.sql} ${where.sql} ${orderby.sql} LIMIT ${limit.skip}, ${limit.take}`
      const { result } = await this.excute(sql)

      for (let column of select.joins) {

      }

      return result;
   }

   async findOne(args: FindArgs) {
      const res = await this.find({
         ...args,
         limit: {
            take: 1,
            skip: 0
         }
      })
      return res?.[0];
   }
}

export default Schema;
