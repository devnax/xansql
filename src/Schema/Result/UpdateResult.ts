import Schema from "..";
import { ForeignInfo } from "../../type";
import { isObject } from "../../utils";
import { SelectArgs, UpdateArgs } from "../type";
import FindResult from "./FindResult";
import WhereArgs from "./WhereArgs";

type MetaInfo = {
   table: string;
}

class UpdateResult {
   finder: FindResult
   model: Schema
   constructor(model: Schema) {
      this.model = model
      this.finder = new FindResult(model)
   }

   async result(args: UpdateArgs, meta?: MetaInfo) {
      if (!args.data || Object.keys(args.data).length === 0 || !args.where || Object.keys(args.where).length === 0) {
         throw new Error("No data to update.");
      }


      const model = this.model
      const data = this.formatData(args.data)
      const Where = new WhereArgs(model, args.where || {})
      const where_sql = Where.sql
      if (!where_sql) {
         throw new Error("Update operation requires a valid where clause to prevent mass updates.");
      }

      let sql = `UPDATE ${model.table} SET ${data.sql} ${where_sql}`
      const result = await model.excute(sql)

      if (result.affectedRows) {
         if (data.relations.length) {
            for (let col of data.relations) {
               let val = (args.data as any)[col]
               if (!val) {
                  throw new Error("No data for relation " + col);
               }

               let foreign = model.xansql.foreignInfo(model.table, col) as ForeignInfo
               if (meta && foreign.table === meta.table) {
                  throw new Error(`Circular reference detected for relation ${col} in update data. table: ${model.table}`);
               }
               let FModel = model.xansql.getModel(foreign.table)
               let rargs: UpdateArgs = {
                  data: val.data,
                  where: {
                     ...val.where || {},
                     [foreign.column]: args.where
                  }
               }

               const r = new UpdateResult(FModel)
               await r.result(rargs, {
                  table: model.table,
               })
            }
         }

         if (args.select) {
            const fres = await this.finder.result({
               select: args.select,
               where: args.where
            } as SelectArgs)
            return fres
         }
      }
      return !!result.affectedRows
   }

   private formatData(data: UpdateArgs["data"]) {
      const model = this.model
      const xansql = model.xansql
      const schema = model.schema
      const relations: string[] = []
      const columns: string[] = []
      const values: any[] = []

      for (const column in data) {
         const dataValue = (data as any)[column]
         if (xansql.isForeign(schema[column]) && isObject(dataValue)) {
            relations.push(column)
         } else {
            columns.push(column)
            values.push(`${column}=${model.toSql(column, dataValue)}`)
         }
      }

      let sql = ``
      sql += values.join(', ')

      return { sql, columns, relations }
   }

}

export default UpdateResult;