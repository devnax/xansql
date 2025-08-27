import Schema from "..";
import BuildData, { BuildDataInfo } from "../Query/BuildData";
import { CreateArgs } from "../type";

class CreateResult {

   constructor(readonly schema: Schema) { }

   async result(args: CreateArgs) {
      const schema = this.schema
      const data = BuildData(args.data || {}, schema);
      let results: any;
      if (Array.isArray(data)) {
         results = [];
         for (let item of data) {
            const res = await this.excute(item);
            // results.push(res?.result);
         }
      } else {
         const res = await this.excute(data);
         if (args.select) {

         }
         results = res?.result;
      }
      return results
   }

   private validateInfo(info: BuildDataInfo) {
      const model = this.schema.xansql.getSchema(info.table);
      for (let column in model.schema) {
         if (!info.columns.includes(column) && column !== model.IDColumn) {
            try {
               info.values.push(model.toSql(column, null));
               info.columns.push(column);
            } catch (err) {
               throw new Error(`Field ${column} is required in create data. table: ${model.table}`);
            }
         }
      }
      return info;
   }


   private async excute(info: BuildDataInfo) {
      info = this.validateInfo(info);
      const model = this.schema.xansql.getSchema(info.table);
      const sql = `INSERT INTO ${info.table} (${info.columns.join(', ')}) VALUES (${info.values.join(', ')})`
      const res = await model.excute(sql)
      const insertId = res.insertId;
      if (!insertId) return;

      const result = { [model.IDColumn]: insertId } as any;
      const findWhere = {
         [model.IDColumn]: insertId
      }

      for (let column in info.joins) {
         const relation = model.xansql.getRelation(info.table, column);
         const joinInfo = info.joins[column]

         if (Array.isArray(joinInfo)) {
            let ids = []
            for (let joinItem of joinInfo) {
               joinItem.columns.push(relation.column);
               joinItem.values.push(insertId);
               const res = await this.excute(joinItem)
               result[column] = result[column] || [];
               result[column].push(res?.result)
               ids.push(res?.result[relation.column]);
            }

            if (!findWhere[column]) findWhere[column] = {}
            findWhere[column][relation.column] = { in: ids }
         } else {
            joinInfo.columns.push(relation.column);
            joinInfo.values.push(insertId);
            const res = await this.excute(joinInfo)
            result[column] = res?.result

            if (findWhere[column]) findWhere[column] = {}
            findWhere[column][relation.column] = res?.result[model.IDColumn];
         }
      }

      return { result, findWhere }
   }



}

export default CreateResult;