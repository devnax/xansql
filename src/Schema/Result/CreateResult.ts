import Schema from "..";
import { ForeignInfo } from "../../type";
import BuildData, { BuildDataInfo } from "../Query/BuildData";
import { SelectArgs } from "../Query/types";
import { CreateArgs } from "../type";
import FindResult from "./FindResult";

class CreateResult {
   finder: FindResult
   constructor(readonly schema: Schema) {
      this.finder = new FindResult(schema)
   }

   async result(args: CreateArgs) {
      const schema = this.schema
      const data = BuildData(args.data || {}, schema);
      let results: any;
      if (Array.isArray(data)) {
         results = [];
         for (let item of data) {
            let excuted = await this.excute(item);
            let result = await this.find(excuted, args.select);
            results.push(result);
         }
      } else {
         let excuted = await this.excute(data);
         results = await this.find(excuted, args.select);
      }
      return results
   }



   private async excute(info: BuildDataInfo) {
      info = this.validateInfo(info);
      const model = this.schema.xansql.getSchema(info.table);
      const sql = `INSERT INTO ${info.table} (${info.columns.join(', ')}) VALUES (${info.values.join(', ')})`
      const res = await model.excute(sql)
      const insertId = res.insertId;
      if (!insertId) return;

      const result = { [model.IDColumn]: insertId } as any;

      for (let column in info.joins) {
         const foreign = model.getForeign(column) as ForeignInfo
         const joinInfo = info.joins[column]

         if (Array.isArray(joinInfo)) {
            let ids = []
            for (let joinItem of joinInfo) {
               joinItem.columns.push(foreign.column);
               joinItem.values.push(insertId);
               const res = await this.excute(joinItem)
               result[column] = result[column] || [];
               result[column].push(res)
               ids.push(res[foreign.column]);
            }
         } else {
            joinInfo.columns.push(foreign.column);
            joinInfo.values.push(insertId);
            const res = await this.excute(joinInfo)
            result[column] = res
         }
      }

      return result
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

   async find(result: any, select?: SelectArgs) {
      if (result && select) {
         const id = result[this.schema.IDColumn];
         const r = await this.finder.result({
            select,
            where: {
               [this.schema.IDColumn]: id
            }
         })
         if (r?.length) {
            result = r?.[0]
         }
      }
      return result
   }
}

export default CreateResult;