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
         const schema = this.xansql.getSchema(info.table);
         for (let column in schema.schema) {
            if (!info.columns.includes(column) && column !== schema.IDColumn) {
               try {
                  info.values.push(schema.toSql(column, null));
                  info.columns.push(column);
               } catch (err) {
                  throw new Error(`Field ${column} is required in create data. table: ${schema.table}`);
               }
            }
         }
         let sql = `
            INSERT INTO ${info.table} (${info.columns.join(', ')}) 
            VALUES (${info.values.join(', ')})
         `
         const res = await this.excute(sql)
         const insertId = res.insertId;
         if (!insertId) {
            return;
         }

         const result = { [schema.IDColumn]: insertId } as any;
         const findWhere = {
            [schema.IDColumn]: insertId
         }

         for (let column in info.joins) {
            const joinInfo = info.joins[column]
            const relations = this.xansql.getRelations(info.table);
            const relation = relations[column]
            let mainField = relation.main.field
            if (Array.isArray(joinInfo)) {
               let ids = []
               for (let joinItem of joinInfo) {
                  joinItem.columns.push(relation.foregin.column);
                  joinItem.values.push(insertId);
                  const res = await excute(joinItem)
                  result[mainField] = result[mainField] || [];
                  result[mainField].push(res?.result)
                  ids.push(res?.result[relation.foregin.schema.IDColumn]);
               }

               if (!findWhere[mainField]) findWhere[mainField] = {}
               findWhere[mainField][relation.foregin.schema.IDColumn] = { in: ids }
            } else {
               joinInfo.columns.push(relation.foregin.column);
               joinInfo.values.push(insertId);
               const res = await excute(joinInfo)
               result[mainField] = res?.result

               if (findWhere[mainField]) findWhere[mainField] = {}
               findWhere[mainField][relation.foregin.schema.IDColumn] = res?.result[schema.IDColumn];
            }
         }

         return { result, findWhere }
      }
      let results: any;
      if (Array.isArray(info)) {
         results = [];
         for (let item of info) {
            const res = await excute(item);
            results.push(res?.result);
         }
      } else {
         const res = await excute(info);

         if (args.select) {
            // let r = await this.findOne({
            //    where: res?.findWhere,
            //    select: args.select
            // })

            // console.log(r);

         }
         results = res?.result;
      }

      return results;
   }

   async find(args: FindArgs) {
      const select = BuildSelect(args.select || {}, this);
      const where = BuildWhere(args.where || {}, this)
      const limit = BuildLimit(args.limit || {}, this)
      const orderby = BuildOrderby(args.orderBy || {}, this)
      const sql = `${select.sql} ${where.sql} ${orderby.sql} ${limit.sql}`
      const { result } = await this.excute(sql)
      const ins = {} as any;

      for (let column in select.joins) {
         const join = select.joins[column];
         let sql = join.sql;
         const schema = this.xansql.getSchema(join.table);
         const where = BuildWhere({
            ...join.args.where,
         }, schema)
         const orderby = BuildOrderby(join.args.orderBy || {}, schema)
         // const limit = BuildLimit(join.args.limit || {}, schema)
         sql = `${sql} ${where.sql} ${orderby.sql}`
         const res = await this.excute(sql)
         result[column] = res.result
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
